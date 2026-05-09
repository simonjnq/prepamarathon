"use server";

import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth";

export async function saveQuestionnaireAction(
  updates: Array<{ question_key: string; answer_text: string }>,
) {
  const { supabase, profile } = await requirePatient();
  if (!Array.isArray(updates) || updates.length === 0) return;

  // Update each row by (patient_id, question_key)
  for (const u of updates) {
    if (!u.question_key) continue;
    await supabase
      .from("questionnaire_responses")
      .update({
        answer_text: u.answer_text,
        answered_at: new Date().toISOString(),
      })
      .eq("patient_id", profile.id)
      .eq("question_key", u.question_key);
  }

  revalidatePath("/mon-questionnaire");
  revalidatePath("/dashboard");
}
