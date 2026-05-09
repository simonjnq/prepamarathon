"use server";

import { revalidatePath } from "next/cache";
import { requirePractitioner } from "@/lib/auth";

export async function createNoteAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = String(formData.get("patient_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const selectedRaw = String(formData.get("selected_suggestions") ?? "[]");
  const isAi = formData.get("ai_source") === "gemini";

  if (!patientId || !content) return;

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      patient_id: patientId,
      practitioner_id: profile.id,
      content,
    })
    .select("id")
    .single();
  if (error || !note) throw new Error(error?.message ?? "Note insert failed");

  let selected: Array<{ title: string; dueInDays: number }> = [];
  try {
    const parsed = JSON.parse(selectedRaw);
    if (Array.isArray(parsed)) {
      selected = parsed
        .filter(
          (s) =>
            typeof s?.title === "string" && typeof s?.dueInDays === "number",
        )
        .slice(0, 5);
    }
  } catch {
    selected = [];
  }

  if (selected.length > 0) {
    const today = new Date("2026-05-09T10:00:00Z").getTime();
    await supabase.from("tasks").insert(
      selected.map((s) => ({
        patient_id: patientId,
        title: s.title,
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

export async function createAppointmentAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = String(formData.get("patient_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const durationStr = String(formData.get("duration") ?? "30");
  const location = String(formData.get("location") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!patientId || !date || !time || !reason) return;

  const scheduled = new Date(`${date}T${time}:00`);
  if (Number.isNaN(scheduled.getTime())) return;

  await supabase.from("appointments").insert({
    patient_id: patientId,
    practitioner_id: profile.id,
    scheduled_at: scheduled.toISOString(),
    duration_min: Number.parseInt(durationStr, 10) || 30,
    location: location || null,
    status: "scheduled",
    reason,
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/agenda");
}

export async function resolveAlertAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const alertId = String(formData.get("alert_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!alertId) return;
  await supabase
    .from("alerts")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", alertId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}
