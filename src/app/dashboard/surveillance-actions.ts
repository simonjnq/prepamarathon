"use server";

import { revalidatePath } from "next/cache";
import { requirePractitioner } from "@/lib/auth";

export type SurveillanceResult = {
  preRaceReminders: number;
  apptReminders: number;
  missedApptAlerts: number;
  overdueTaskReminders: number;
  unmonitoredPainAlerts: number;
  details: string[];
};

const TODAY = new Date("2026-05-10T10:00:00Z");

function dateAt(daysOffset: number, hour = 9, minute = 0): string {
  const d = new Date(TODAY.getTime() + daysOffset * 86_400_000);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Lance les 5 checks de surveillance temporelle pour le praticien
 * connecté. Idempotent sur 24h via le champ source. */
export async function runSurveillance(): Promise<SurveillanceResult> {
  const { supabase, profile } = await requirePractitioner();

  const result: SurveillanceResult = {
    preRaceReminders: 0,
    apptReminders: 0,
    missedApptAlerts: 0,
    overdueTaskReminders: 0,
    unmonitoredPainAlerts: 0,
    details: [],
  };

  // Patients assignés
  const { data: assignments } = await supabase
    .from("practitioner_assignments")
    .select("patient_id")
    .eq("practitioner_id", profile.id)
    .eq("active", true);
  const patientIds = (assignments ?? []).map((r) => r.patient_id);
  if (patientIds.length === 0) return result;

  const yesterdayIso = dateAt(-1);

  // Pré-requête : tout ce qui a été créé par la surveillance dans les 24h
  // pour éviter les doublons.
  const { data: recentRem } = await supabase
    .from("reminders")
    .select("patient_id, message, scheduled_at, status, created_at")
    .in("patient_id", patientIds)
    .gte("created_at", yesterdayIso);
  const recentReminderKeys = new Set(
    (recentRem ?? []).map((r) => `${r.patient_id}|${r.message}`),
  );

  const { data: recentAuto } = await supabase
    .from("alerts")
    .select("patient_id, source, title, created_at")
    .in("patient_id", patientIds)
    .gte("created_at", yesterdayIso);
  const recentAutoAlertKeys = new Set(
    (recentAuto ?? []).map((a) => `${a.patient_id}|${a.source}`),
  );

  // ---------------------------------------------------------------
  // C1 — Relances pré-course J-30, J-15, J-7
  // ---------------------------------------------------------------
  const { data: journeys } = await supabase
    .from("journeys")
    .select("patient_id, race_date, race_name")
    .in("patient_id", patientIds)
    .eq("status", "active");

  for (const j of journeys ?? []) {
    if (!j.race_date) continue;
    const daysToRace = Math.round(
      (new Date(j.race_date).getTime() - TODAY.getTime()) / 86_400_000,
    );
    let triggerDay: number | null = null;
    if (daysToRace === 30) triggerDay = 30;
    else if (daysToRace === 15) triggerDay = 15;
    else if (daysToRace === 7) triggerDay = 7;
    if (!triggerDay) continue;

    const message = `À ${triggerDay} jours de votre ${j.race_name ?? "course"}, comment vous sentez-vous ? Toute douleur ou inconfort, signalez-le dans l'app.`;
    if (recentReminderKeys.has(`${j.patient_id}|${message}`)) continue;

    await supabase.from("reminders").insert({
      patient_id: j.patient_id,
      channel: "whatsapp",
      message,
      scheduled_at: dateAt(0, 18, 0),
      status: "pending",
      created_by: profile.id,
    });
    result.preRaceReminders += 1;
    result.details.push(
      `Relance J-${triggerDay} programmée pour ${j.race_name}`,
    );
  }

  // ---------------------------------------------------------------
  // C2 — Rappel veille de RDV (les RDV demain à 24h ± 12h)
  // ---------------------------------------------------------------
  const tomorrowStart = dateAt(1, 0, 0);
  const tomorrowEnd = dateAt(2, 0, 0);
  const { data: tomorrowAppts } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, scheduled_at, reason, location, practitioners(profiles(first_name, last_name))",
    )
    .in("patient_id", patientIds)
    .eq("status", "scheduled")
    .gte("scheduled_at", tomorrowStart)
    .lt("scheduled_at", tomorrowEnd);

  for (const a of (tomorrowAppts ?? []) as unknown as Array<{
    id: string;
    patient_id: string;
    scheduled_at: string;
    reason: string;
    location: string | null;
    practitioners: {
      profiles: { first_name: string; last_name: string };
    } | null;
  }>) {
    const time = new Date(a.scheduled_at).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
    const pName = a.practitioners
      ? `${a.practitioners.profiles.first_name} ${a.practitioners.profiles.last_name}`
      : "votre praticien";
    const message = `Rappel : RDV demain à ${time} avec ${pName} (${a.reason})${a.location ? ` — ${a.location}` : ""}.`;
    if (recentReminderKeys.has(`${a.patient_id}|${message}`)) continue;

    await supabase.from("reminders").insert({
      patient_id: a.patient_id,
      channel: "sms",
      message,
      scheduled_at: dateAt(0, 19, 0),
      status: "pending",
      created_by: profile.id,
    });
    result.apptReminders += 1;
    result.details.push(`Rappel J-1 envoyé pour le RDV avec ${pName}`);
  }

  // ---------------------------------------------------------------
  // C3 — RDV non honorés (scheduled mais date passée +24h)
  // ---------------------------------------------------------------
  const cutoff = dateAt(-1);
  const { data: missed } = await supabase
    .from("appointments")
    .select("id, patient_id, scheduled_at, reason")
    .in("patient_id", patientIds)
    .eq("status", "scheduled")
    .lt("scheduled_at", cutoff);

  for (const a of missed ?? []) {
    const key = `${a.patient_id}|auto_missed_appt:${a.id}`;
    if (recentAutoAlertKeys.has(`${a.patient_id}|auto_missed_appt:${a.id}`))
      continue;
    if (recentAutoAlertKeys.has(key)) continue;

    await supabase.from("alerts").insert({
      patient_id: a.patient_id,
      severity: "warning",
      title: "RDV non honoré",
      message: `Le RDV "${a.reason}" du ${a.scheduled_at.slice(0, 10)} n'a pas été clôturé. À reprogrammer ?`,
      source: `auto_missed_appt:${a.id}`,
    });
    await supabase.from("tasks").insert({
      patient_id: a.patient_id,
      title: `Reprogrammer le RDV manqué : ${a.reason}`,
      status: "pending",
      source: "system",
      due_at: dateAt(7).slice(0, 10),
    });
    result.missedApptAlerts += 1;
    result.details.push(`RDV non honoré détecté : ${a.reason}`);
  }

  // ---------------------------------------------------------------
  // C4 — Tâches en retard (due_at < today, status pending)
  // ---------------------------------------------------------------
  const todayDate = dateAt(0).slice(0, 10);
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, patient_id, title, due_at")
    .in("patient_id", patientIds)
    .in("status", ["pending", "in_progress"])
    .lt("due_at", todayDate);

  for (const t of overdueTasks ?? []) {
    const message = `Rappel : la tâche "${t.title}" était prévue pour le ${t.due_at}. Pensez à la traiter ou reprogrammer si besoin.`;
    if (recentReminderKeys.has(`${t.patient_id}|${message}`)) continue;
    await supabase.from("reminders").insert({
      patient_id: t.patient_id,
      channel: "notification",
      message,
      scheduled_at: dateAt(0, 17, 0),
      status: "pending",
      created_by: profile.id,
    });
    result.overdueTaskReminders += 1;
  }
  if ((overdueTasks?.length ?? 0) > 0) {
    result.details.push(
      `${overdueTasks!.length} relance(s) sur tâches en retard`,
    );
  }

  // ---------------------------------------------------------------
  // C5 — Douleur active > 14 jours sans RDV programmé
  // ---------------------------------------------------------------
  const { data: oldPains } = await supabase
    .from("pain_points")
    .select("id, patient_id, body_zone, severity, started_on")
    .in("patient_id", patientIds)
    .is("resolved_on", null)
    .lte("started_on", dateAt(-14).slice(0, 10));

  if (oldPains && oldPains.length > 0) {
    // Pour chaque douleur, vérifie si le patient a un RDV à venir
    const concernedIds = Array.from(
      new Set(oldPains.map((p) => p.patient_id)),
    );
    const { data: futureAppts } = await supabase
      .from("appointments")
      .select("patient_id")
      .in("patient_id", concernedIds)
      .eq("status", "scheduled")
      .gte("scheduled_at", dateAt(0));
    const haveFutureAppt = new Set(
      (futureAppts ?? []).map((a) => a.patient_id),
    );

    for (const p of oldPains) {
      if (haveFutureAppt.has(p.patient_id)) continue;
      const sourceTag = `auto_unmonitored_pain:${p.id}`;
      if (recentAutoAlertKeys.has(`${p.patient_id}|${sourceTag}`)) continue;

      await supabase.from("alerts").insert({
        patient_id: p.patient_id,
        severity: "warning",
        title: `Douleur ${p.body_zone} non monitorée`,
        message: `Active depuis ${p.started_on}, intensité ${p.severity}/10. Aucun RDV programmé. Programmer un suivi ?`,
        source: sourceTag,
      });
      result.unmonitoredPainAlerts += 1;
      result.details.push(
        `Alerte douleur non monitorée : ${p.body_zone}`,
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/alerts");
  return result;
}
