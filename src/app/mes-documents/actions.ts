"use server";

import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth";
import { Schemas, field } from "@/lib/validation";

export async function addPatientDocumentAction(formData: FormData) {
  const { supabase, profile } = await requirePatient();
  const type = field(formData, "type", Schemas.documentType) ?? "autre";
  const title = field(formData, "title", Schemas.documentTitle);
  const description =
    field(formData, "description", Schemas.documentDescription) ?? "";
  const rawFileUrl = String(formData.get("file_url") ?? "")
    .trim()
    .slice(0, 1000);
  if (!title) return;

  await supabase.from("documents").insert({
    patient_id: profile.id,
    uploaded_by: profile.id,
    type,
    title,
    description: description || null,
    file_url: rawFileUrl || null,
  });

  revalidatePath("/mes-documents");
}
