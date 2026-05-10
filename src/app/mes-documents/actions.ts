"use server";

import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth";

export async function addPatientDocumentAction(formData: FormData) {
  const { supabase, profile } = await requirePatient();
  const type = String(formData.get("type") ?? "autre");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  if (!title) return;

  await supabase.from("documents").insert({
    patient_id: profile.id,
    uploaded_by: profile.id,
    type,
    title,
    description: description || null,
    file_url: fileUrl || null,
  });

  revalidatePath("/mes-documents");
}
