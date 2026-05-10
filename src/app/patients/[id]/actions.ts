"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePractitioner } from "@/lib/auth";
import { Schemas, field, stripHtml } from "@/lib/validation";

const SuggestionsSchema = z.array(
  z.object({
    title: z.string().min(1).max(200),
    dueInDays: z.number().int().min(0).max(365),
  }),
);

export async function createNoteAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = field(formData, "patient_id", Schemas.uuid);
  const content = field(formData, "content", Schemas.noteContent);
  const isAi = formData.get("ai_source") === "gemini";
  const selectedRaw = String(formData.get("selected_suggestions") ?? "[]");

  if (!patientId || !content) return;

  const { data: note, error } = await supabase
    .from("notes")
    .insert({ patient_id: patientId, practitioner_id: profile.id, content })
    .select("id")
    .single();
  if (error || !note) throw new Error(error?.message ?? "Note insert failed");

  let selected: Array<{ title: string; dueInDays: number }> = [];
  try {
    const parsed = JSON.parse(selectedRaw);
    const r = SuggestionsSchema.safeParse(parsed);
    if (r.success) selected = r.data.slice(0, 5);
  } catch {
    selected = [];
  }

  if (selected.length > 0) {
    const today = new Date("2026-05-09T10:00:00Z").getTime();
    await supabase.from("tasks").insert(
      selected.map((s) => ({
        patient_id: patientId,
        title: stripHtml(s.title).trim().slice(0, 200),
        status: "pending",
        source: isAi ? "ai" : "practitioner",
        source_practitioner_id: profile.id,
        source_note_id: note.id,
        due_at: new Date(today + s.dueInDays * 86_400_000)
          .toISOString()
          .slice(0, 10),
      })),
    );
  }

  revalidatePath(`/patients/${patientId}`);
}

const SPECIALTY_TO_STEP_CATEGORY: Record<string, string> = {
  medecin_du_sport: "medical",
  kinesitherapeute: "kine",
  osteopathe: "osteo",
  nutritionniste: "nutrition",
  podologue: "podologie",
  cardiologue: "cardio",
  psychologue: "mental",
  coach: "training",
};

export async function createAppointmentAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = field(formData, "patient_id", Schemas.uuid);
  const date = field(formData, "date", Schemas.date);
  const time = field(formData, "time", Schemas.time);
  const duration = field(formData, "duration", Schemas.duration) ?? 30;
  const location = field(formData, "location", Schemas.apptLocation) ?? "";
  const reason = field(formData, "reason", Schemas.apptReason);

  if (!patientId || !date || !time || !reason) return;

  const scheduled = new Date(`${date}T${time}:00`);
  if (Number.isNaN(scheduled.getTime())) return;

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      practitioner_id: profile.id,
      scheduled_at: scheduled.toISOString(),
      duration_min: duration,
      location: location || null,
      status: "scheduled",
      reason,
    })
    .select("id")
    .single();
  if (apptErr || !appt) {
    throw new Error(apptErr?.message ?? "Appointment insert failed");
  }

  // Reflect the appointment as an upcoming step in the patient's active journey.
  const { data: journey } = await supabase
    .from("journeys")
    .select("id")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (journey) {
    const { data: maxStep } = await supabase
      .from("journey_steps")
      .select("order_idx")
      .eq("journey_id", journey.id)
      .order("order_idx", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxStep?.order_idx ?? 0) + 1;

    const { data: practitionerRow } = await supabase
      .from("practitioners")
      .select("specialty")
      .eq("id", profile.id)
      .maybeSingle();
    const category =
      SPECIALTY_TO_STEP_CATEGORY[practitionerRow?.specialty ?? ""] ?? "medical";

    await supabase.from("journey_steps").insert({
      journey_id: journey.id,
      order_idx: nextOrder,
      title: reason,
      description: `Rendez-vous avec ${profile.first_name} ${profile.last_name}${
        location ? ` — ${location}` : ""
      }`,
      category,
      status: "upcoming",
      practitioner_id: profile.id,
      scheduled_at: date,
    });
  }

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/agenda");
  revalidatePath("/mon-parcours");
}

export async function setStepStatusAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const stepId = field(formData, "step_id", Schemas.uuid);
  const status = field(formData, "status", Schemas.stepStatus);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  if (!stepId || !status) return;

  await supabase
    .from("journey_steps")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", stepId);

  if (patientId) revalidatePath(`/patients/${patientId}`);
  revalidatePath("/mon-parcours");
}

export async function setAppointmentStatusAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const apptId = field(formData, "appointment_id", Schemas.uuid);
  const status = field(formData, "status", Schemas.appointmentStatus);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  const summary = field(formData, "summary", Schemas.apptSummary) ?? "";
  if (!apptId || !status) return;

  await supabase
    .from("appointments")
    .update({ status, summary: summary || null })
    .eq("id", apptId);

  if (patientId) revalidatePath(`/patients/${patientId}`);
  revalidatePath("/agenda");
}

export async function updateNoteAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const noteId = field(formData, "note_id", Schemas.uuid);
  const content = field(formData, "content", Schemas.noteContent);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  if (!noteId || !content) return;

  await supabase
    .from("notes")
    .update({ content })
    .eq("id", noteId)
    .eq("practitioner_id", profile.id);

  if (patientId) revalidatePath(`/patients/${patientId}`);
}

export async function addAssignmentAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const patientId = field(formData, "patient_id", Schemas.uuid);
  const practitionerId = field(formData, "practitioner_id", Schemas.uuid);
  const role = field(formData, "role", Schemas.documentDescription) ?? "";
  if (!patientId || !practitionerId) return;

  await supabase.from("practitioner_assignments").upsert(
    {
      patient_id: patientId,
      practitioner_id: practitionerId,
      role_in_journey: role || "Suivi en cours",
      active: true,
      started_at: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "patient_id,practitioner_id" },
  );

  revalidatePath(`/patients/${patientId}`);
}

export async function removeAssignmentAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const assignmentId = field(formData, "assignment_id", Schemas.uuid);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  if (!assignmentId) return;

  await supabase
    .from("practitioner_assignments")
    .update({ active: false })
    .eq("id", assignmentId);

  if (patientId) revalidatePath(`/patients/${patientId}`);
}

export async function addDocumentRowAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = field(formData, "patient_id", Schemas.uuid);
  const type = field(formData, "type", Schemas.documentType) ?? "autre";
  const title = field(formData, "title", Schemas.documentTitle);
  const description =
    field(formData, "description", Schemas.documentDescription) ?? "";
  // file_url stocke un path Storage ou (legacy) une URL — pas de strict
  // validation, juste cap longueur.
  const rawFileUrl = String(formData.get("file_url") ?? "").trim().slice(0, 1000);
  const appointmentId = field(formData, "appointment_id", Schemas.optUuid);
  if (!patientId || !title) return;

  await supabase.from("documents").insert({
    patient_id: patientId,
    uploaded_by: profile.id,
    type,
    title,
    description: description || null,
    file_url: rawFileUrl || null,
    appointment_id: appointmentId || null,
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/mes-documents");
}

export async function updateAppointmentNoteAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const apptId = field(formData, "appointment_id", Schemas.uuid);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  const summary = field(formData, "summary", Schemas.apptSummary) ?? "";
  if (!apptId) return;
  await supabase
    .from("appointments")
    .update({ summary: summary || null })
    .eq("id", apptId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}

export async function resolveAlertAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const alertId = field(formData, "alert_id", Schemas.uuid);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  if (!alertId) return;
  await supabase
    .from("alerts")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", alertId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}
