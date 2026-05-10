"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { requirePractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SPECIALTY_LABELS } from "@/lib/labels";

export type WeeklySummary = {
  source: "gemini" | "unavailable" | "error";
  headline?: string;
  highlights?: string[];
  concerns?: string[];
  next_focus?: string;
  error?: string;
};

const SYSTEM_PROMPT = `Tu es un assistant clinique. Tu reçois l'activité de la dernière semaine sur le dossier d'un patient en préparation marathon. Ton rôle : produire une synthèse de cette semaine destinée au praticien référent.

Format JSON strict :
- "headline" : titre d'1 phrase max 80 chars résumant la semaine.
- "highlights" : 1 à 3 puces de faits positifs ou progrès observés (max 20 mots chacune).
- "concerns" : 0 à 3 puces de points de vigilance objectifs (max 20 mots chacune).
- "next_focus" : 1 phrase max 80 chars sur quoi devrait être l'attention du praticien la semaine prochaine.

Règles :
- Factuel et basé uniquement sur les données fournies.
- Pas de jargon. Phrases courtes.
- Si rien à dire, listes vides ; ne jamais inventer.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
    next_focus: { type: Type.STRING },
  },
  required: ["headline", "highlights", "concerns", "next_focus"],
};

export async function aiWeeklySummary(
  patientId: string,
): Promise<WeeklySummary> {
  await requirePractitioner();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { source: "unavailable" };

  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  // Note : on s'aligne sur la date démo 2026-05-10 pour la cohérence
  const today = new Date("2026-05-10T10:00:00Z");
  const weekStart = new Date(
    today.getTime() - 7 * 86_400_000,
  ).toISOString();

  const [
    { data: profile },
    { data: notes },
    { data: appts },
    { data: tasks },
    { data: alerts },
    { data: pains },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("notes")
      .select(
        "content, created_at, practitioners(specialty, profiles(first_name, last_name))",
      )
      .eq("patient_id", patientId)
      .gte("created_at", weekStart)
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select(
        "scheduled_at, status, reason, summary, practitioners(specialty)",
      )
      .eq("patient_id", patientId)
      .gte("scheduled_at", weekStart),
    supabase
      .from("tasks")
      .select("title, status, completed_at, source, due_at")
      .eq("patient_id", patientId)
      .or(`completed_at.gte.${weekStart},created_at.gte.${weekStart}`),
    supabase
      .from("alerts")
      .select("severity, title, message, created_at, resolved_at, source")
      .eq("patient_id", patientId)
      .gte("created_at", weekStart),
    supabase
      .from("pain_points")
      .select("body_zone, severity, started_on, resolved_on")
      .eq("patient_id", patientId),
  ]);

  void sevenDaysAgo;

  const lines: string[] = [];
  lines.push(
    `Patient : ${profile?.first_name ?? "?"} ${profile?.last_name ?? "?"}`,
  );
  lines.push(`Période analysée : 7 derniers jours`);

  if (notes && notes.length) {
    lines.push(`\n# Notes de la semaine (${notes.length})`);
    for (const n of notes as unknown as Array<{
      content: string;
      created_at: string;
      practitioners: {
        specialty: string;
        profiles: { first_name: string; last_name: string };
      } | null;
    }>) {
      const pr = n.practitioners
        ? `${n.practitioners.profiles.first_name} ${n.practitioners.profiles.last_name} (${SPECIALTY_LABELS[n.practitioners.specialty] ?? n.practitioners.specialty})`
        : "praticien";
      lines.push(`- ${n.created_at.slice(0, 10)} · ${pr} : ${n.content}`);
    }
  }

  if (appts && appts.length) {
    lines.push(`\n# RDV de la semaine (${appts.length})`);
    for (const a of appts as unknown as Array<{
      scheduled_at: string;
      status: string;
      reason: string;
      summary: string | null;
      practitioners: { specialty: string } | null;
    }>) {
      const sp = a.practitioners
        ? SPECIALTY_LABELS[a.practitioners.specialty] ??
          a.practitioners.specialty
        : "?";
      lines.push(
        `- ${a.scheduled_at.slice(0, 10)} [${a.status}] ${sp} — ${a.reason}${a.summary ? " · CR : " + a.summary : ""}`,
      );
    }
  }

  if (tasks && tasks.length) {
    const done = tasks.filter((t) => t.status === "done");
    const pending = tasks.filter((t) => t.status !== "done");
    if (done.length) {
      lines.push(`\n# Tâches accomplies (${done.length})`);
      for (const t of done) lines.push(`- ✓ ${t.title}`);
    }
    if (pending.length) {
      lines.push(`\n# Tâches encore en cours (${pending.length})`);
      for (const t of pending)
        lines.push(`- ${t.title}${t.due_at ? ` (échéance ${t.due_at})` : ""}`);
    }
  }

  if (alerts && alerts.length) {
    lines.push(`\n# Alertes de la semaine (${alerts.length})`);
    for (const a of alerts) {
      lines.push(
        `- [${a.severity}] ${a.title}${a.resolved_at ? " (résolue)" : " (ouverte)"}${a.source ? ` · source ${a.source}` : ""}`,
      );
    }
  }

  if (pains && pains.length) {
    const active = pains.filter((p) => !p.resolved_on);
    if (active.length) {
      lines.push(`\n# Douleurs actives à ce jour`);
      for (const p of active)
        lines.push(`- ${p.body_zone} ${p.severity}/10`);
    }
  }

  if (lines.length <= 2) {
    return {
      source: "gemini",
      headline: "Aucune activité cette semaine",
      highlights: [],
      concerns: [],
      next_focus:
        "Reprendre contact avec le patient pour relancer le suivi.",
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: lines.join("\n"),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
      },
    });
    const parsed = JSON.parse(r.text ?? "{}");
    return {
      source: "gemini",
      headline: parsed.headline,
      highlights: parsed.highlights ?? [],
      concerns: parsed.concerns ?? [],
      next_focus: parsed.next_focus,
    };
  } catch (err) {
    return {
      source: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
