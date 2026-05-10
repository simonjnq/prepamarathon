import Link from "next/link";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronRight,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { AITriage } from "./ai-triage";
import { SurveillanceButton } from "./surveillance-button";
import { Avatar } from "@/components/avatar";
import { Badge, severityBadgeVariant } from "@/components/badge";
import type { SessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ALERT_SEVERITY_LABELS,
  SPORT_GOAL_LABELS,
  fmtDateLong,
  fmtDateTime,
  fmtRelative,
} from "@/lib/labels";

export async function PractitionerDashboard({
  profile,
}: {
  profile: SessionProfile;
}) {
  const supabase = await createClient();

  // KPIs
  const { count: patientCount } = await supabase
    .from("practitioner_assignments")
    .select("patient_id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id)
    .eq("active", true);

  // Defense-in-depth : on ne fait pas que confier la sécurité à RLS,
  // on filtre explicitement aux patients assignés au praticien.
  const { data: myAssignmentRows } = await supabase
    .from("practitioner_assignments")
    .select("patient_id")
    .eq("practitioner_id", profile.id)
    .eq("active", true);
  const myPatientIds = (myAssignmentRows ?? []).map((r) => r.patient_id);

  const openAlertsQuery =
    myPatientIds.length === 0
      ? { count: 0 }
      : await supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .is("resolved_at", null)
          .in("patient_id", myPatientIds);
  const openAlertsTotal = openAlertsQuery.count ?? 0;

  const todayStart = new Date("2026-05-09T00:00:00Z").toISOString();
  const todayEnd = new Date("2026-05-09T23:59:59Z").toISOString();

  const { count: todayAppointmentsCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id)
    .gte("scheduled_at", todayStart)
    .lte("scheduled_at", todayEnd);

  // Alertes ouvertes restreintes explicitement aux patients assignés
  // (RLS gère déjà ce filtre, mais defense-in-depth).
  const alerts =
    myPatientIds.length === 0
      ? []
      : ((
          await supabase
            .from("alerts")
            .select(
              "id, severity, title, message, created_at, patient_id, patients!inner(profiles!inner(first_name, last_name))",
            )
            .is("resolved_at", null)
            .in("patient_id", myPatientIds)
            .order("severity", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(5)
        ).data ?? []);

  // Today's appointments for this practitioner
  const { data: todayAppts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, reason, status, patient_id, patients!inner(profiles!inner(first_name, last_name))",
    )
    .eq("practitioner_id", profile.id)
    .gte("scheduled_at", todayStart)
    .lte("scheduled_at", todayEnd)
    .order("scheduled_at", { ascending: true });

  // Upcoming appointments (next 5)
  const nowIso = new Date("2026-05-09T10:00:00Z").toISOString();
  const { data: upcomingAppts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, reason, status, patient_id, patients!inner(profiles!inner(first_name, last_name))",
    )
    .eq("practitioner_id", profile.id)
    .eq("status", "scheduled")
    .gte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(5);

  return (
    <>
      <header>
        <p className="text-sm text-ink-muted">Bonjour</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          {profile.first_name},{" "}
          <span className="font-accent font-normal text-coral">
            voici votre journée
          </span>
        </h1>
      </header>

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Patients suivis
            </p>
            <Users size={18} strokeWidth={1.75} className="text-coral" />
          </div>
          <p className="mt-3 text-4xl font-extrabold">{patientCount ?? 0}</p>
          <p className="mt-1 text-sm text-ink-muted">en parcours actif</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Alertes ouvertes
            </p>
            <AlertTriangle
              size={18}
              strokeWidth={1.75}
              className="text-coral"
            />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-coral">
            {openAlertsTotal ?? 0}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            tous patients confondus
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              RDV aujourd&apos;hui
            </p>
            <CalendarIcon
              size={18}
              strokeWidth={1.75}
              className="text-coral"
            />
          </div>
          <p className="mt-3 text-4xl font-extrabold">
            {todayAppointmentsCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-ink-muted">consultation(s) prévues</p>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AITriage />
        </div>
        <div className="lg:col-span-2">
          <SurveillanceButton />
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-5">
        <div className="card p-7 lg:col-span-3">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold">
              Alertes nécessitant votre attention
            </h2>
            <Link
              href={"/alerts" as never}
              className="text-sm font-medium text-coral hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {alerts && alerts.length > 0 ? (
            <ul className="space-y-3">
              {alerts.map((a) => {
                const patientProfile = (
                  a as unknown as {
                    patients: { profiles: { first_name: string; last_name: string } };
                  }
                ).patients?.profiles;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/patients/${a.patient_id}` as never}
                      className="group flex items-start gap-4 rounded-md border border-line bg-surface-warm p-4 transition-colors hover:border-coral"
                    >
                      <Avatar
                        firstName={patientProfile?.first_name}
                        lastName={patientProfile?.last_name}
                        size={42}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold">
                            {patientProfile?.first_name}{" "}
                            {patientProfile?.last_name}
                          </p>
                          <Badge variant={severityBadgeVariant(a.severity)}>
                            {ALERT_SEVERITY_LABELS[a.severity] ?? a.severity}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-ink">
                          {a.title}
                        </p>
                        {a.message && (
                          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                            {a.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-light">
                          {fmtRelative(a.created_at)}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        strokeWidth={1.75}
                        className="mt-1 shrink-0 text-ink-light transition-transform group-hover:translate-x-0.5 group-hover:text-coral"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              Aucune alerte à traiter. ✨
            </p>
          )}
        </div>

        <div className="card p-7 lg:col-span-2">
          <h2 className="text-lg font-extrabold">Aujourd&apos;hui</h2>
          {todayAppts && todayAppts.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {todayAppts.map((a) => {
                const patientProfile = (
                  a as unknown as {
                    patients: { profiles: { first_name: string; last_name: string } };
                  }
                ).patients?.profiles;
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0"
                  >
                    <Avatar
                      firstName={patientProfile?.first_name}
                      lastName={patientProfile?.last_name}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {fmtDateTime(a.scheduled_at)}
                      </p>
                      <p className="text-sm">
                        {patientProfile?.first_name}{" "}
                        {patientProfile?.last_name}
                      </p>
                      <p className="text-xs text-ink-muted">{a.reason}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Aucun RDV aujourd&apos;hui. Bon repos.
            </p>
          )}

          <h3 className="mt-7 text-sm font-bold uppercase tracking-wider text-ink-muted">
            Prochains rendez-vous
          </h3>
          {upcomingAppts && upcomingAppts.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {upcomingAppts.slice(0, 4).map((a) => {
                const patientProfile = (
                  a as unknown as {
                    patients: { profiles: { first_name: string; last_name: string } };
                  }
                ).patients?.profiles;
                return (
                  <li key={a.id} className="text-sm">
                    <span className="font-bold">
                      {fmtDateTime(a.scheduled_at)}
                    </span>
                    <span className="block text-ink-muted">
                      {patientProfile?.first_name}{" "}
                      {patientProfile?.last_name} · {a.reason}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">Agenda libre.</p>
          )}
        </div>
      </section>
    </>
  );
}
