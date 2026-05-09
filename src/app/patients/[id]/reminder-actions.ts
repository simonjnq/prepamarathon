"use server";

import { revalidatePath } from "next/cache";
import { requirePractitioner } from "@/lib/auth";

export async function createReminderAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = String(formData.get("patient_id") ?? "");
  const channel = String(formData.get("channel") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const message = String(formData.get("message") ?? "").trim();
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
  const reminderId = String(formData.get("reminder_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!reminderId) return;
  await supabase
    .from("reminders")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", reminderId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}

export async function cancelReminderAction(formData: FormData) {
  const { supabase } = await requirePractitioner();
  const reminderId = String(formData.get("reminder_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  if (!reminderId) return;
  await supabase
    .from("reminders")
    .update({ status: "cancelled" })
    .eq("id", reminderId);
  if (patientId) revalidatePath(`/patients/${patientId}`);
}
