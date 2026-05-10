import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Badge, severityBadgeVariant } from "@/components/badge";
import { requirePractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ALERT_SEVERITY_LABELS,
  fmtRelative,
  fmtDateTime,
} from "@/lib/labels";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { resolveAlertAction } from "../patients/[id]/actions";

const SEVERITY_CHIPS: Array<{ value: string | null; label: string }> = [
  { value: null, label: "Toutes" },
  { value: "urgent", label: "Urgent" },
  { value: "warning", label: "À surveiller" },
  { value: "info", label: "Info" },
];

type Search = { severity?: string; show?: string };

export default async function AlertsPage(props: {
  searchParams: Promise<Search>;
}) {
  const { profile } = await requirePractitioner();
  const supabase = await createClient();
  const { specialty } = await supabase
    .from("practitioners")
    .select("specialty")
    .eq("id", profile.id)
    .single()
    .then((r) => ({ specialty: r.data?.specialty ?? null }));

  const sp = await props.searchParams;
  const severity = sp.severity ?? null;
  const showResolved = sp.show === "all";

  // Defense-in-depth : limiter explicitement aux patients assignés
  const { data: myAssignmentRows } = await supabase
    .from("practitioner_assignments")
    .select("patient_id")
    .eq("practitioner_id", profile.id)
    .eq("active", true);
  const myPatientIds = (myAssignmentRows ?? []).map((r) => r.patient_id);

  let alerts: unknown[] | null = [];
  if (myPatientIds.length > 0) {
    let query = supabase
      .from("alerts")
      .select(
        "id, severity, title, message, source, created_at, resolved_at, patient_id, patients!inner(profiles!inner(first_name, last_name), occupation)",
      )
      .in("patient_id", myPatientIds)
      .order("severity", { ascending: false })
      .order("created_at", { ascending: false });
    if (!showResolved) query = query.is("resolved_at", null);
    if (severity) query = query.eq("severity", severity);
    const r = await query;
    alerts = r.data;
  }

  type AlertRow = {
    id: string;
    severity: string;
    title: string;
    message: string | null;
    source: string | null;
    created_at: string;
    resolved_at: string | null;
    patient_id: string;
    patients: {
      profiles: { first_name: string; last_name: string };
      occupation: string | null;
    };
  };
  const list = (alerts ?? []) as unknown as AlertRow[];

  function chipHref(value: string | null): string {
    const u = new URLSearchParams();
    if (value) u.set("severity", value);
    if (showResolved) u.set("show", "all");
    const s = u.toString();
    return s ? `/alerts?${s}` : "/alerts";
  }
  function showToggleHref() {
    const u = new URLSearchParams();
    if (severity) u.set("severity", severity);
    if (!showResolved) u.set("show", "all");
    const s = u.toString();
    return s ? `/alerts?${s}` : "/alerts";
  }

  // Counts for header (eux aussi restreints aux assignés)
  let openCount = 0;
  let urgentCount = 0;
  if (myPatientIds.length > 0) {
    const { count: o } = await supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null)
      .in("patient_id", myPatientIds);
    openCount = o ?? 0;
    const { count: u } = await supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null)
      .eq("severity", "urgent")
      .in("patient_id", myPatientIds);
    urgentCount = u ?? 0;
  }

  return (
    <AppShell profile={profile} specialty={specialty}>
      <RealtimeRefresh tables={["alerts"]} channel="alerts-feed" />
      <header>
        <p className="text-sm text-ink-muted">Vue alertes</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Alertes{" "}
          <span className="font-accent font-normal text-coral">
            ouvertes
          </span>
        </h1>
        <p className="mt-2 text-ink-muted">
          {openCount} alerte{openCount > 1 ? "s" : ""} ouverte
          {openCount > 1 ? "s" : ""} sur vos patients
          {urgentCount > 0 && (
            <>
              {" "}
              · <span className="font-bold text-rust">{urgentCount} urgent
              {urgentCount > 1 ? "es" : "e"}</span>
            </>
          )}
        </p>
      </header>

      {/* Filters */}
      <section className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SEVERITY_CHIPS.map((c) => {
            const active = (c.value ?? null) === (severity ?? null);
            return (
              <Link
                key={c.label}
                href={chipHref(c.value) as never}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "border-coral bg-coral text-white"
                    : "border-line bg-surface text-ink-muted hover:border-coral hover:text-coral"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
        <Link
          href={showToggleHref() as never}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
            showResolved
              ? "border-coral bg-coral-bg text-coral"
              : "border-line bg-surface text-ink-muted hover:border-coral hover:text-coral"
          }`}
        >
          {showResolved ? "Inclure les résolues ✓" : "Inclure les résolues"}
        </Link>
      </section>

      <section className="mt-6 space-y-3">
        {list.length === 0 ? (
          <p className="card p-8 text-center text-ink-muted">
            Aucune alerte ne correspond à ces critères.
          </p>
        ) : (
          list.map((a) => {
            const pp = a.patients.profiles;
            return (
              <article
                key={a.id}
                className={`card p-5 ${a.resolved_at ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="hidden sm:block">
                    <Avatar
                      firstName={pp.first_name}
                      lastName={pp.last_name}
                      size={48}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={severityBadgeVariant(a.severity)}>
                        <AlertTriangle
                          size={12}
                          strokeWidth={2.5}
                          className="mr-1 inline"
                        />
                        {ALERT_SEVERITY_LABELS[a.severity] ?? a.severity}
                      </Badge>
                      <p className="font-extrabold">{a.title}</p>
                      {a.resolved_at && (
                        <Badge variant="leaf">Résolue</Badge>
                      )}
                    </div>
                    {a.message && (
                      <p className="mt-1.5 text-sm text-ink-muted">
                        {a.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-ink-light">
                      Créée {fmtRelative(a.created_at)}
                      {a.source && ` · source : ${a.source}`}
                      {a.resolved_at && ` · résolue ${fmtDateTime(a.resolved_at)}`}
                    </p>

                    <Link
                      href={`/patients/${a.patient_id}` as never}
                      className="group mt-3 inline-flex items-center gap-2 text-sm font-bold text-coral hover:underline"
                    >
                      Patient&nbsp;:&nbsp;
                      <span className="font-bold">
                        {pp.first_name} {pp.last_name}
                      </span>
                      {a.patients.occupation && (
                        <span className="text-ink-muted font-normal">
                          ({a.patients.occupation})
                        </span>
                      )}
                      <ChevronRight
                        size={14}
                        strokeWidth={2}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>

                  {!a.resolved_at && (
                    <form action={resolveAlertAction} className="shrink-0">
                      <input type="hidden" name="alert_id" value={a.id} />
                      <input type="hidden" name="patient_id" value={a.patient_id} />
                      <button className="btn-secondary px-3! py-1.5! text-xs!">
                        Marquer résolue
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
