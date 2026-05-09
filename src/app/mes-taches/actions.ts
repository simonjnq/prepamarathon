"use server";

import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth";

export async function toggleTaskAction(formData: FormData) {
  const { supabase, profile } = await requirePatient();
  const taskId = String(formData.get("task_id") ?? "");
  const markDone = formData.get("mark_done") === "1";
  if (!taskId) return;

  await supabase
    .from("tasks")
    .update(
      markDone
        ? { status: "done", completed_at: new Date().toISOString() }
        : { status: "pending", completed_at: null },
    )
    .eq("id", taskId)
    .eq("patient_id", profile.id);

  revalidatePath("/mes-taches");
  revalidatePath("/dashboard");
}
