"use server";

import { revalidatePath } from "next/cache";
import { requirePractitioner } from "@/lib/auth";
import { Schemas, field } from "@/lib/validation";

export async function sendCaseMessageAction(formData: FormData) {
  const { supabase, profile } = await requirePractitioner();
  const patientId = field(formData, "patient_id", Schemas.uuid);
  const content = field(formData, "content", Schemas.message);
  if (!patientId || !content) return;

  await supabase.from("case_messages").insert({
    patient_id: patientId,
    sender_id: profile.id,
    content,
  });

  revalidatePath(`/patients/${patientId}`);
}
