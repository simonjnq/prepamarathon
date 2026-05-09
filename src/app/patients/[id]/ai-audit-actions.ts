"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { requirePractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SPECIALTY_LABELS, SPORT_GOAL_LABELS } from "@/lib/labels";

export type AuditFinding = {
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  suggestedAction?: {
    type: "task" | "appointment" | "alert";
    title: string;
    dueInDays?: number;
    severity?: "info" | "warning" | "urgent";
  };
};

export type AuditResult = {
  source: "gemini" | "unavailable" | "error";
  findings: AuditFinding[];
  summary?: string;
  error?: string;
};

const SYSTEM_PROMPT = `Tu es un assistant IA pour une plateforme de coordination médicale (Via Sana — PrépaMarathon). Un praticien consulte la fiche d'un patient et te demande un audit du parcours de soins.

Tu reçois en entrée :
- Le profil du patient (âge, parcours sportif, antécédents)
- L'équipe de praticiens assignés
- Les étapes du parcours (réalisées, en cours, à venir)
- Les rendez-vous récents et à venir
- Les notes des praticiens (dernières)
- Les douleurs actives
- Les alertes ouvertes
- Les tâches en cours du patient

Ton rôle : identifier 0 à 4 "findings" (constats) qui méritent l'attention du praticien. Concentre-toi sur :
- Suivis manquants ou en retard (ex : "aucun bilan kiné en 4 semaines alors qu'une tendinite est en cours")
- Incohérences (ex : "alerte douleur ouverte mais aucun RDV programmé")
- Échéances imminentes (ex : "race dans 3 semaines, plus de RDV programmé")
- Signaux faibles (ex : "score sommeil 4/10 dans le questionnaire et fatigue chronique signalée")

Règles strictes :
- Si tout est OK, renvoie un tableau vide. NE PAS inventer.
- "title" : 60 chars max, factuel, pas alarmiste
- "detail" : UNE phrase, max 25 mots, citant des éléments concrets du contexte
- "severity" : "info" (à savoir), "warning" (à traiter sous la semaine), "critical" (immédiat)
- "suggestedAction" optionnel : action concrète. type=task pour une action patient, type=appointment pour programmer un RDV, type=alert pour escalader.
- "summary" : UNE phrase de synthèse globale. Ex : "Suivi globalement bien tenu, douleur achille à monitorer."`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ["info", "warning", "critical"] },
          title: { type: Type.STRING },
          detail: { type: Type.STRING },
          suggestedAction: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              type: { type: Type.STRING, enum: ["task", "appointment", "alert"] },
              title: { type: Type.STRING },
              dueInDays: { type: Type.INTEGER, nullable: true },
              severity: {
                type: Type.STRING,
                enum: ["info", "warning", "urgent"],
                nullable: true,
              },
            },
            required: ["type", "title"],
          },
        },
        required: ["severity", "title", "detail"],
      },
    },
  },
  required: ["summary", "findings"],
};

async function buildPatientContext(patientId: string): Promise<string> {
  const supabase = await createClient();

  const [
    { data: patient },
    { data: profile },
    { data: journey },
    { data: assignments },
    { data: recentAppts },
    { data: recentNotes },
    { data: pains },
    { data: alerts },
    { data: openTasks },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("date_of_birth, gender, occupation, allergies, medications, notes")
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("journeys")
      .select("sport_goal, race_name, race_date, weeks_to_race, progress_pct, current_step_label, started_at")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("practitioner_assignments")
      .select(
        "role_in_journey, practitioners(specialty, profiles(first_name, last_name))",
      )
      .eq("patient_id", patientId)
      .eq("active", true),
    supabase
      .from("appointments")
      .select(
        "scheduled_at, status, reason, summary, practitioners(specialty, profiles(first_name, last_name))",
      )
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false })
      .limit(8),
    supabase
      .from("notes")
      .select(
        "content, created_at, practitioners(specialty, profiles(first_name, last_name))",
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("pain_points")
      .select("body_zone, severity, description, started_on, resolved_on")
      .eq("patient_id", patientId)
      .order("started_on", { ascending: false }),
    supabase
      .from("alerts")
      .select("severity, title, message, created_at")
      .eq("patient_id", patientId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("title, due_at, status, source")
      .eq("patient_id", patientId)
      .in("status", ["pending", "in_progress"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(8),
  ]);

  const lines: string[] = [];
  lines.push(`# Patient`);
  lines.push(
    `${profile?.first_name ?? "?"} ${profile?.last_name ?? "?"}, né(e) ${patient?.date_of_birth ?? "?"}, ${patient?.occupation ?? "—"}`,
  );
  if (patient?.allergies) lines.push(`Allergies : ${patient.allergies}`);
  if (patient?.medications) lines.push(`Traitements : ${patient.medications}`);
  if (patient?.notes) lines.push(`Note : ${patient.notes}`);

  if (journey) {
    lines.push(`\n# Parcours`);
    lines.push(
      `Objectif : ${SPORT_GOAL_LABELS[journey.sport_goal] ?? journey.sport_goal} — ${journey.race_name ?? "course inconnue"} le ${journey.race_date ?? "?"}`,
    );
    lines.push(`Avancement : ${journey.progress_pct ?? 0}% — ${journey.weeks_to_race ?? "?"} semaines avant la course`);
    if (journey.current_step_label)
      lines.push(`Étape en cours : ${journey.current_step_label}`);
  }

  if (assignments && assignments.length) {
    lines.push(`\n# Équipe assignée`);
    for (const a of assignments as unknown as Array<{
      role_in_journey: string | null;
      practitioners: {
        specialty: string;
        profiles: { first_name: string; last_name: string };
      } | null;
    }>) {
      if (!a.practitioners) continue;
      lines.push(
        `- ${a.practitioners.profiles.first_name} ${a.practitioners.profiles.last_name} (${SPECIALTY_LABELS[a.practitioners.specialty] ?? a.practitioners.specialty})${a.role_in_journey ? ` — ${a.role_in_journey}` : ""}`,
      );
    }
  }

  if (recentAppts && recentAppts.length) {
    lines.push(`\n# Rendez-vous récents`);
    for (const a of recentAppts as unknown as Array<{
      scheduled_at: string;
      status: string;
      reason: string;
      summary: string | null;
      practitioners: {
        specialty: string;
        profiles: { first_name: string; last_name: string };
      } | null;
    }>) {
      const pr = a.practitioners
        ? ` — ${a.practitioners.profiles.first_name} ${a.practitioners.profiles.last_name} (${SPECIALTY_LABELS[a.practitioners.specialty] ?? a.practitioners.specialty})`
        : "";
      lines.push(
        `- ${a.scheduled_at.slice(0, 10)} [${a.status}] ${a.reason}${pr}${a.summary ? ` — ${a.summary}` : ""}`,
      );
    }
  }

  if (recentNotes && recentNotes.length) {
    lines.push(`\n# Notes récentes des praticiens`);
    for (const n of recentNotes as unknown as Array<{
      content: string;
      created_at: string;
      practitioners: {
        specialty: string;
        profiles: { first_name: string; last_name: string };
      } | null;
    }>) {
      const pr = n.practitioners
        ? `${n.practitioners.profiles.first_name} ${n.practitioners.profiles.last_name} (${SPECIALTY_LABELS[n.practitioners.specialty] ?? n.practitioners.specialty})`
        : "";
      lines.push(`- ${n.created_at.slice(0, 10)} — ${pr} : ${n.content}`);
    }
  }

  if (pains && pains.length) {
    const active = pains.filter((p) => !p.resolved_on);
    if (active.length) {
      lines.push(`\n# Douleurs actives`);
      for (const p of active) {
        lines.push(
          `- ${p.body_zone}, ${p.severity}/10${p.description ? ` — ${p.description}` : ""} (depuis ${p.started_on})`,
        );
      }
    }
  }

  if (alerts && alerts.length) {
    lines.push(`\n# Alertes ouvertes`);
    for (const a of alerts) {
      lines.push(
        `- [${a.severity}] ${a.title}${a.message ? ` — ${a.message}` : ""}`,
      );
    }
  }

  if (openTasks && openTasks.length) {
    lines.push(`\n# Tâches du patient en cours`);
    for (const t of openTasks) {
      lines.push(
        `- ${t.title}${t.due_at ? ` (échéance ${t.due_at})` : ""}`,
      );
    }
  }

  lines.push(`\n# Date du jour`);
  lines.push(`2026-05-09`);

  return lines.join("\n");
}

export async function aiAuditPatient(
  patientId: string,
): Promise<AuditResult> {
  await requirePractitioner();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { source: "unavailable", findings: [] };

  const ctx = await buildPatientContext(patientId);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: ctx,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
      },
    });
    const text = r.text ?? "";
    let parsed: { summary?: string; findings?: AuditFinding[] } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    return {
      source: "gemini",
      summary: parsed.summary,
      findings: (parsed.findings ?? []).slice(0, 4),
    };
  } catch (err) {
    return {
      source: "error",
      findings: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Apply an AI-suggested action by creating a task / alert / appointment shell. */
export async function applyFindingAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = String(formData.get("patient_id") ?? "");
  const type = String(formData.get("action_type") ?? "");
  const title = String(formData.get("action_title") ?? "");
  const dueInDays = Number.parseInt(
    String(formData.get("action_due") ?? "7"),
    10,
  );
  const severity = String(formData.get("action_severity") ?? "warning");
  if (!patientId || !type || !title) return;

  const today = new Date("2026-05-09T10:00:00Z").getTime();
  const dueDate = new Date(today + dueInDays * 86400000)
    .toISOString()
    .slice(0, 10);

  if (type === "task") {
    await supabase.from("tasks").insert({
      patient_id: patientId,
      title,
      status: "pending",
      source: "ai",
      source_practitioner_id: profile.id,
      due_at: dueDate,
    });
  } else if (type === "alert") {
    await supabase.from("alerts").insert({
      patient_id: patientId,
      severity,
      title,
      message: "Suggéré par l'audit IA.",
      source: "ai",
    });
  } else if (type === "appointment") {
    // Create a shell appointment 7 days out with this practitioner. The
    // practitioner can edit later. Date defaults to next morning at 10h.
    const scheduled = new Date(today + Math.max(1, dueInDays) * 86400000);
    scheduled.setUTCHours(10, 0, 0, 0);
    await supabase.from("appointments").insert({
      patient_id: patientId,
      practitioner_id: profile.id,
      scheduled_at: scheduled.toISOString(),
      duration_min: 30,
      status: "scheduled",
      reason: title,
    });
  }
}
