"use server";

import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth";
import { stripHtml } from "@/lib/validation";

export async function saveQuestionnaireAction(
  updates: Array<{ question_key: string; answer_text: string }>,
) {
  const { supabase, profile } = await requirePatient();
  if (!Array.isArray(updates) || updates.length === 0) return;

  for (const u of updates) {
    if (!u.question_key || typeof u.question_key !== "string") continue;
    if (u.question_key.length > 100) continue;
    const sanitized = stripHtml(String(u.answer_text ?? "")).slice(0, 1000);
    await supabase
      .from("questionnaire_responses")
      .update({
        answer_text: sanitized,
        answered_at: new Date().toISOString(),
      })
      .eq("patient_id", profile.id)
      .eq("question_key", u.question_key);
  }

  revalidatePath("/mon-questionnaire");
  revalidatePath("/dashboard");
}
