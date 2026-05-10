"use server";

import { revalidatePath } from "next/cache";
import { requirePractitioner } from "@/lib/auth";

export async function sendCaseMessageAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = String(formData.get("patient_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!patientId || !content) return;

  await supabase.from("case_messages").insert({
    patient_id: patientId,
    sender_id: profile.id,
    content,
  });

  revalidatePath(`/patients/${patientId}`);
}
