import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionProfile = {
  id: string;
  email: string;
  role: "patient" | "practitioner" | "admin";
  first_name: string;
  last_name: string;
  username: string | null;
};

/** Returns the current authenticated profile or redirects to /login. */
export async function requireProfile(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  profile: SessionProfile;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name, username")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/login");
  return { supabase, profile: profile as SessionProfile };
}

export async function requirePractitioner() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== "practitioner" && ctx.profile.role !== "admin") {
    redirect("/dashboard");
  }
  return ctx;
}

export async function requirePatient() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== "patient") redirect("/dashboard");
  return ctx;
}
