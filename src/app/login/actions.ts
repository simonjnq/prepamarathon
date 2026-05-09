"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DOMAIN = process.env.DEMO_EMAIL_DOMAIN ?? "prepa.test";

function toEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@${DOMAIN}`;
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Identifiant et mot de passe requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(identifier),
    password,
  });

  if (error) {
    return { error: "Identifiant ou mot de passe incorrect." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
