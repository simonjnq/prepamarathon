"use server";

import { revalidatePath } from "next/cache";
import { requirePractitioner } from "@/lib/auth";
import { Schemas, field } from "@/lib/validation";

export async function createReminderAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = field(formData, "patient_id", Schemas.uuid);
  const channel = field(formData, "channel", Schemas.reminderChannel);
  const date = field(formData, "date", Schemas.date);
  const time = field(formData, "time", Schemas.time);
  const message = field(formData, "message", Schemas.reminderMessage);
  if (!patientId || !channel || !date || !time || !message) return;

  const scheduled = new Date(`${date}T${time}:00`);
  if (Number.isNaN(scheduled.getTime())) return;

  await supabase.from("reminders").insert({
    patient_id: patientId,
    channel,
    message,
    scheduled_at: scheduled.toISOString(),
    status: "pending",
    created_by: profile.id,
  });

  revalidatePath(`/patients/${patientId}`);
}

export async function markReminderSentAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const reminderId = field(formData, "reminder_id", Schemas.uuid);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  if (!reminderId) return;
  await supabase
    .from("reminders")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", reminderId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}

export async function cancelReminderAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const reminderId = field(formData, "reminder_id", Schemas.uuid);
  const patientId = field(formData, "patient_id", Schemas.optUuid);
  if (!reminderId) return;
  await supabase
    .from("reminders")
    .update({ status: "cancelled" })
    .eq("id", reminderId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}
