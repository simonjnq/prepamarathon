import Link from "next/link";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { requirePractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  SPORT_GOAL_LABELS,
  ageFromDob,
  fmtDateShort,
  fmtRelative,
} from "@/lib/labels";

const GOAL_CHIPS: Array<{ value: string | null; label: string }> = [
  { value: null, label: "Tous" },
  { value: "marathon", label: "Marathon" },
  { value: "semi_marathon", label: "Semi" },
  { value: "10km", label: "10 km" },
  { value: "reprise", label: "Reprise" },
];

type Search = { q?: string; goal?: string; alerts?: string; pain?: string };

export default async function PatientsListPage(props: {
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
  const q = (sp.q ?? "").trim().toLowerCase();
  const goal = sp.goal ?? null;
  const onlyWithAlerts = sp.alerts === "1";
  const onlyWithPain = sp.pain === "1";

  // Fetch patients + their profile + their journeys (3 queries — split avoids
  // PostgREST embed ambiguity when patients.id is both PK and FK to profiles.id).
  const [patientsRes, profilesRes, journeysRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id, occupation, date_of_birth")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "patient"),
    supabase
      .from("journeys")
      .select(
        "id, patient_id, sport_goal, race_name, race_date, progress_pct, weeks_to_race, current_step_label, status",
      ),
  ]);

  const profileById = new Map<string, { first_name: string; last_name: string }>();
  (profilesRes.data ?? []).forEach((p) =>
    profileById.set(p.id, { first_name: p.first_name, last_name: p.last_name }),
  );
  const journeysByPatient = new Map<
    string,
    Array<{
      id: string;
      sport_goal: string;
      race_name: string | null;
      race_date: string | null;
      progress_pct: number | null;
      weeks_to_race: number | null;
      current_step_label: string | null;
      status: string;
    }>
  >();
  (journeysRes.data ?? []).forEach((j) => {
    const arr = journeysByPatient.get(j.patient_id) ?? [];
    arr.push(j);
    journeysByPatient.set(j.patient_id, arr);
  });

  const all = (patientsRes.data ?? []).map((p) => {
    const journeys = journeysByPatient.get(p.id) ?? [];
    return {
      id: p.id,
      occupation: p.occupation,
      date_of_birth: p.date_of_birth,
      profiles: profileById.get(p.id) ?? { first_name: "?", last_name: "?" },
      journeys,
      activeJourney:
        journeys.find((j) => j.status === "active") ?? journeys[0] ?? null,
    };
  });

  // Alert counts per patient
  const { data: alertRows } = await supabase
    .from("alerts")
    .select("patient_id, severity")
    .is("resolved_at", null);
  const alertCount = new Map<string, { total: number; urgent: number }>();
  (alertRows ?? []).forEach((a) => {
    const cur = alertCount.get(a.patient_id) ?? { total: 0, urgent: 0 };
    cur.total += 1;
    if (a.severity === "urgent") cur.urgent += 1;
    alertCount.set(a.patient_id, cur);
  });

  // Patients ayant une douleur active (pain_points sans resolved_on)
  const { data: painRows } = await supabase
    .from("pain_points")
    .select("patient_id, body_zone, severity")
    .is("resolved_on", null);
  const painsByPatient = new Map<
    string,
    Array<{ body_zone: string; severity: number | null }>
  >();
  (painRows ?? []).forEach((p) => {
    const arr = painsByPatient.get(p.patient_id) ?? [];
    arr.push({ body_zone: p.body_zone, severity: p.severity });
    painsByPatient.set(p.patient_id, arr);
  });


  // Next appointment per patient with THIS practitioner
  const nowIso = new Date("2026-05-09T10:00:00Z").toISOString();
  const { data: apptRows } = await supabase
    .from("appointments")
    .select("patient_id, scheduled_at, reason")
    .eq("practitioner_id", profile.id)
    .eq("status", "scheduled")
    .gte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true });
  const nextAppt = new Map<
    string,
    { scheduled_at: string; reason: string | null }
  >();
  (apptRows ?? []).forEach((a) => {
    if (!nextAppt.has(a.patient_id))
      nextAppt.set(a.patient_id, { scheduled_at: a.scheduled_at, reason: a.reason });
  });

  // Filter (la RLS limite déjà aux patients assignés au praticien)
  const filtered = all.filter((p) => {
    const fullName =
      `${p.profiles.first_name} ${p.profiles.last_name}`.toLowerCase();
    if (q && !fullName.includes(q)) return false;
    if (goal && p.activeJourney?.sport_goal !== goal) return false;
    if (onlyWithAlerts && (alertCount.get(p.id)?.total ?? 0) === 0)
      return false;
    if (onlyWithPain && (painsByPatient.get(p.id)?.length ?? 0) === 0)
      return false;
    return true;
  });

  // Sort: alerts urgent first, then total alerts, then race_date asc
  filtered.sort((a, b) => {
    const ac = alertCount.get(a.id) ?? { total: 0, urgent: 0 };
    const bc = alertCount.get(b.id) ?? { total: 0, urgent: 0 };
    if (ac.urgent !== bc.urgent) return bc.urgent - ac.urgent;
    if (ac.total !== bc.total) return bc.total - ac.total;
    const ad = a.activeJourney?.race_date ?? "9999";
    const bd = b.activeJourney?.race_date ?? "9999";
    return ad.localeCompare(bd);
  });

  function buildHref(overrides: Partial<Search> = {}): string {
    const cur: Search = {
      q: q || undefined,
      goal: goal ?? undefined,
      alerts: onlyWithAlerts ? "1" : undefined,
      pain: onlyWithPain ? "1" : undefined,
      ...overrides,
    };
    const u = new URLSearchParams();
    if (cur.q) u.set("q", cur.q);
    if (cur.goal) u.set("goal", cur.goal);
    if (cur.alerts) u.set("alerts", cur.alerts);
    if (cur.pain) u.set("pain", cur.pain);
    const s = u.toString();
    return s ? `/patients?${s}` : "/patients";
  }
  const chipHref = (value: string | null) => buildHref({ goal: value ?? undefined });
  const alertsToggleHref = () =>
    buildHref({ alerts: onlyWithAlerts ? undefined : "1" });
  const painToggleHref = () =>
    buildHref({ pain: onlyWithPain ? undefined : "1" });

  return (
    <AppShell profile={profile} specialty={specialty}>
      <header>
        <p className="text-sm text-ink-muted">Vos patients</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mes patients{" "}
          <span className="font-accent font-normal text-coral">
            en préparation
          </span>
        </h1>
        <p className="mt-2 text-ink-muted">
          {filtered.length} patient{filtered.length > 1 ? "s" : ""} suivi
          {filtered.length > 1 ? "s" : ""} par vous
          {q && ` correspondent à « ${q} »`}
          {goal && ` · ${SPORT_GOAL_LABELS[goal]}`}
          {onlyWithAlerts && " · avec alertes ouvertes"}
          {onlyWithPain && " · avec douleur active"}
        </p>
      </header>

      {/* Filters */}
      <section className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form
          action="/patients"
          method="GET"
          className="flex w-full max-w-md items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 focus-within:border-coral"
        >
          <Search size={18} strokeWidth={1.75} className="text-ink-light" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un patient…"
            className="flex-1 bg-transparent text-sm placeholder:text-ink-light focus:outline-none"
          />
          {goal && <input type="hidden" name="goal" value={goal} />}
          {onlyWithAlerts && <input type="hidden" name="alerts" value="1" />}
        </form>

        <div className="flex flex-wrap gap-2">
          {GOAL_CHIPS.map((c) => {
            const active = (c.value ?? null) === (goal ?? null);
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
          <Link
            href={alertsToggleHref() as never}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
              onlyWithAlerts
                ? "border-coral bg-coral-bg text-coral"
                : "border-line bg-surface text-ink-muted hover:border-coral hover:text-coral"
            }`}
          >
            <AlertTriangle size={13} strokeWidth={2} />
            Avec alertes
          </Link>
          <Link
            href={painToggleHref() as never}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
              onlyWithPain
                ? "border-coral bg-coral-bg text-coral"
                : "border-line bg-surface text-ink-muted hover:border-coral hover:text-coral"
            }`}
          >
            Avec douleur active
          </Link>
        </div>
      </section>

      {/* List */}
      <section className="mt-7 grid gap-4">
        {filtered.length === 0 ? (
          <p className="card p-8 text-center text-ink-muted">
            Aucun patient ne correspond à ces critères.
          </p>
        ) : (
          filtered.map((p) => {
            const j = p.activeJourney;
            const alerts = alertCount.get(p.id);
            const next = nextAppt.get(p.id);
            const age = ageFromDob(p.date_of_birth);
            const pains = painsByPatient.get(p.id) ?? [];
            return (
              <Link
                key={p.id}
                href={`/patients/${p.id}` as never}
                className="card group flex flex-col gap-5 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4 sm:w-72 sm:shrink-0">
                  <Avatar
                    firstName={p.profiles.first_name}
                    lastName={p.profiles.last_name}
                    size={52}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold leading-tight">
                      {p.profiles.first_name} {p.profiles.last_name}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {age != null ? `${age} ans` : "âge ?"}
                      {p.occupation && ` · ${p.occupation}`}
                    </p>
                  </div>
                </div>

                <div className="flex-1 sm:border-l sm:border-line sm:pl-5">
                  {j ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-light">
                        {SPORT_GOAL_LABELS[j.sport_goal] ?? j.sport_goal}
                        {j.race_date && ` · ${fmtDateShort(j.race_date)}`}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold">
                        {j.race_name ?? "—"}
                      </p>
                      <p className="mt-1 truncate text-xs text-ink-muted">
                        {j.current_step_label ?? "—"}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-soft">
                          <div
                            className="h-full bg-coral"
                            style={{ width: `${j.progress_pct ?? 0}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-bold">
                          {j.progress_pct ?? 0}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      Aucun parcours actif.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:w-56 sm:shrink-0 sm:flex-col sm:items-end sm:gap-2">
                  {alerts && alerts.total > 0 ? (
                    <Badge
                      variant={alerts.urgent > 0 ? "rust" : "amber"}
                      className="shrink-0"
                    >
                      {alerts.total} alerte{alerts.total > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge variant="leaf" className="shrink-0">
                      OK
                    </Badge>
                  )}
                  {pains.length > 0 && (
                    <Badge variant="amber" className="shrink-0">
                      Douleur :{" "}
                      {pains
                        .map((p) => p.body_zone)
                        .slice(0, 2)
                        .join(" + ")}
                    </Badge>
                  )}
                  {next ? (
                    <p className="text-xs text-ink-muted sm:text-right">
                      Prochain RDV{" "}
                      <span className="font-bold text-ink">
                        {fmtRelative(next.scheduled_at)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-ink-light">Aucun RDV avec vous</p>
                  )}
                </div>

                <ChevronRight
                  size={18}
                  strokeWidth={1.75}
                  className="hidden text-ink-light transition-transform group-hover:translate-x-0.5 group-hover:text-coral sm:block"
                />
              </Link>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
