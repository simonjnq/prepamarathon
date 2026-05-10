"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { requirePractitioner } from "@/lib/auth";
import { priorityScore, weeksToRace } from "@/lib/journey";

export type TriageItem = {
  patientId: string;
  patientName: string;
  priority: "high" | "medium" | "low";
  headline: string;
  recommendation: string;
};

export type TriageResult = {
  source: "gemini" | "unavailable" | "error" | "empty";
  items: TriageItem[];
  error?: string;
};

const SYSTEM_PROMPT = `Tu es un assistant de triage clinique pour un praticien qui suit plusieurs patients en préparation marathon. On te donne pour chaque patient un résumé bref (alertes, douleurs, jours depuis dernier RDV, semaines avant la course).

Ton rôle : pour chaque patient listé, produire :
- "headline" : 1 phrase max 60 chars résumant la situation actuelle
- "recommendation" : 1 phrase max 80 chars qui dit au praticien ce qu'il devrait FAIRE aujourd'hui pour ce patient
- "priority" : "high" | "medium" | "low"

Règles :
- Tu réponds avec EXACTEMENT le même nombre d'items que ceux fournis, dans le même ordre.
- Conserve le "patientId" et le "patientName" tels que fournis.
- Pas de jargon. Pas d'invention.
- Si un patient n'a aucune alerte ni douleur ni gap, priority="low" + recommandation type "Suivi normal, pas d'action".`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          patientId: { type: Type.STRING },
          patientName: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
          headline: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: [
          "patientId",
          "patientName",
          "priority",
          "headline",
          "recommendation",
        ],
      },
    },
  },
  required: ["items"],
};

export async function aiTriagePatients(): Promise<TriageResult> {
  const { supabase, profile } = await requirePractitioner();

  // Récupère les patients assignés
  const { data: assignmentRows } = await supabase
    .from("practitioner_assignments")
    .select("patient_id")
    .eq("practitioner_id", profile.id)
    .eq("active", true);
  const ids = (assignmentRows ?? []).map((r) => r.patient_id);
  if (ids.length === 0) return { source: "empty", items: [] };

  // Données pour score + contexte
  const today = new Date("2026-05-10T10:00:00Z");
  const [
    { data: profiles },
    { data: alerts },
    { data: pains },
    { data: lastAppts },
    { data: journeys },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", ids),
    supabase
      .from("alerts")
      .select("patient_id, severity, title")
      .in("patient_id", ids)
      .is("resolved_at", null),
    supabase
      .from("pain_points")
      .select("patient_id, body_zone, severity")
      .in("patient_id", ids)
      .is("resolved_on", null),
    supabase
      .from("appointments")
      .select("patient_id, scheduled_at")
      .in("patient_id", ids)
      .lte("scheduled_at", today.toISOString())
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("journeys")
      .select("patient_id, race_date, race_name, weeks_to_race")
      .in("patient_id", ids)
      .eq("status", "active"),
  ]);

  const nameById = new Map<string, string>();
  (profiles ?? []).forEach((p) =>
    nameById.set(p.id, `${p.first_name} ${p.last_name}`),
  );

  const alertsByPatient = new Map<
    string,
    Array<{ severity: string; title: string }>
  >();
  (alerts ?? []).forEach((a) => {
    const arr = alertsByPatient.get(a.patient_id) ?? [];
    arr.push({ severity: a.severity, title: a.title });
    alertsByPatient.set(a.patient_id, arr);
  });

  const painsByPatient = new Map<
    string,
    Array<{ body_zone: string; severity: number | null }>
  >();
  (pains ?? []).forEach((p) => {
    const arr = painsByPatient.get(p.patient_id) ?? [];
    arr.push({ body_zone: p.body_zone, severity: p.severity });
    painsByPatient.set(p.patient_id, arr);
  });

  const lastApptByPatient = new Map<string, string>();
  (lastAppts ?? []).forEach((a) => {
    if (!lastApptByPatient.has(a.patient_id))
      lastApptByPatient.set(a.patient_id, a.scheduled_at);
  });

  const journeyByPatient = new Map<
    string,
    { race_date: string | null; race_name: string | null; weeks_to_race: number | null }
  >();
  (journeys ?? []).forEach((j) =>
    journeyByPatient.set(j.patient_id, {
      race_date: j.race_date,
      race_name: j.race_name,
      weeks_to_race: j.weeks_to_race,
    }),
  );

  // Score chaque patient, prend les 6 premiers
  const ranked = ids
    .map((id) => {
      const al = alertsByPatient.get(id) ?? [];
      const ph = painsByPatient.get(id) ?? [];
      const last = lastApptByPatient.get(id);
      const days = last
        ? Math.round(
            (today.getTime() - new Date(last).getTime()) / 86_400_000,
          )
        : null;
      const j = journeyByPatient.get(id);
      const w = weeksToRace(j?.race_date, j?.weeks_to_race ?? null);
      const score = priorityScore({
        alertsUrgent: al.filter((a) => a.severity === "urgent").length,
        alertsWarning: al.filter((a) => a.severity === "warning").length,
        alertsInfo: al.filter((a) => a.severity === "info").length,
        maxActivePainSeverity: ph.reduce(
          (m, x) => Math.max(m, x.severity ?? 0),
          0,
        ),
        daysSinceLastAppointment: days,
        weeksToRace: w,
      });
      return { id, score, alerts: al, pains: ph, days, weeks: w, journey: j };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { source: "unavailable", items: [] };

  // Préparer le contexte pour Gemini
  const contextLines = ranked.map((r) => {
    const lines: string[] = [];
    lines.push(`---`);
    lines.push(`patientId: ${r.id}`);
    lines.push(`patientName: ${nameById.get(r.id) ?? "?"}`);
    if (r.journey?.race_date)
      lines.push(
        `Course : ${r.journey.race_name} le ${r.journey.race_date}${r.weeks != null ? ` (dans ${r.weeks} sem.)` : ""}`,
      );
    if (r.alerts.length) {
      lines.push(
        `Alertes ouvertes : ${r.alerts.map((a) => `[${a.severity}] ${a.title}`).join(" · ")}`,
      );
    }
    if (r.pains.length) {
      lines.push(
        `Douleurs actives : ${r.pains.map((p) => `${p.body_zone} ${p.severity}/10`).join(" · ")}`,
      );
    }
    if (r.days != null) {
      lines.push(`Dernier RDV : il y a ${r.days} jours`);
    }
    return lines.join("\n");
  });

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextLines.join("\n\n"),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.3,
      },
    });
    const text = response.text ?? "";
    const parsed = JSON.parse(text) as { items?: TriageItem[] };
    return {
      source: "gemini",
      items: (parsed.items ?? []).slice(0, 6),
    };
  } catch (err) {
    return {
      source: "error",
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
