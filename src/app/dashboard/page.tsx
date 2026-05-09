import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PractitionerDashboard } from "./practitioner-dashboard";
import { PatientDashboard } from "./patient-dashboard";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const isPractitioner =
    profile.role === "practitioner" || profile.role === "admin";

  let specialty: string | null = null;
  if (isPractitioner) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practitioners")
      .select("specialty")
      .eq("id", profile.id)
      .maybeSingle();
    specialty = data?.specialty ?? null;
  }

  return (
    <AppShell profile={profile} specialty={specialty}>
      <RealtimeRefresh
        tables={["alerts", "tasks", "appointments"]}
        channel={`dashboard-${profile.id}`}
      />
      {isPractitioner ? (
        <PractitionerDashboard profile={profile} />
      ) : (
        <PatientDashboard profile={profile} />
      )}
    </AppShell>
  );
}
