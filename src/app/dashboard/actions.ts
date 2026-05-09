"use server";

import { revalidatePath } from "next/cache";
import { requirePatient } from "@/lib/auth";

const SEVERITY_BY_CATEGORY: Record<string, "info" | "warning" | "urgent"> = {
  pain_increase: "urgent",
  pain_persistent: "warning",
  appointment_missed: "warning",
  fatigue: "warning",
  other: "info",
};

const TITLE_BY_CATEGORY: Record<string, string> = {
  pain_increase: "Le patient signale une douleur en augmentation",
  pain_persistent: "Le patient signale une douleur persistante",
  appointment_missed: "Le patient signale un rendez-vous manqué ou non pris",
  fatigue: "Le patient signale une fatigue inhabituelle",
  other: "Le patient a un point à signaler",
};

export async function flagFromPatientAction(formData: FormData) {
  const { supabase, profile } = await requirePatient();
  const category = String(formData.get("category") ?? "other");
  const message = String(formData.get("message") ?? "").trim();

  const severity = SEVERITY_BY_CATEGORY[category] ?? "info";
  const title = TITLE_BY_CATEGORY[category] ?? TITLE_BY_CATEGORY.other;

  await supabase.from("alerts").insert({
    patient_id: profile.id,
    severity,
    title,
    message: message || null,
    source: "patient",
  });

  revalidatePath("/dashboard");
}
