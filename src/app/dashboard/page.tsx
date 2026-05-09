import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "../login/actions";

const SPECIALTY_LABELS: Record<string, string> = {
  medecin_du_sport: "Médecin du sport",
  kinesitherapeute: "Kinésithérapeute",
  osteopathe: "Ostéopathe",
  nutritionniste: "Nutritionniste",
  podologue: "Podologue",
  cardiologue: "Cardiologue",
  psychologue: "Psychologue",
  coach: "Coach",
};

const SPORT_GOAL_LABELS: Record<string, string> = {
  marathon: "Marathon",
  semi_marathon: "Semi-marathon",
  "10km": "10 km",
  "5km": "5 km",
  running: "Running",
  reprise: "Reprise sportive",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, username, email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="card p-8 text-center">
          <h1 className="text-xl font-extrabold">Profil introuvable</h1>
          <p className="mt-2 text-ink-muted">
            Votre compte auth existe mais aucun profil n&apos;est associé.
            Lancez <code>npm run seed</code>.
          </p>
          <form action={logoutAction} className="mt-4">
            <button className="btn-secondary">Se déconnecter</button>
          </form>
        </div>
      </main>
    );
  }

  const isPractitioner = profile.role === "practitioner" || profile.role === "admin";

  let practitionerData: { specialty: string; cabinet_name: string | null } | null = null;
  let patientData: {
    occupation: string | null;
    height_cm: number | null;
    weight_kg: number | null;
  } | null = null;
  let journey: {
    sport_goal: string;
    race_name: string | null;
    race_date: string | null;
    progress_pct: number | null;
    weeks_to_race: number | null;
    current_step_label: string | null;
  } | null = null;
  let upcomingAppts: Array<{
    id: string;
    scheduled_at: string;
    reason: string | null;
  }> = [];
  let openTasks: Array<{ id: string; title: string; due_at: string | null }> =
    [];
  let assignedPatientCount = 0;
  let alertsCount = 0;

  if (isPractitioner) {
    const { data: pr } = await supabase
      .from("practitioners")
      .select("specialty, cabinet_name")
      .eq("id", user.id)
      .single();
    practitionerData = pr;

    const { count: patientCount } = await supabase
      .from("practitioner_assignments")
      .select("patient_id", { count: "exact", head: true })
      .eq("practitioner_id", user.id)
      .eq("active", true);
    assignedPatientCount = patientCount ?? 0;

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, reason")
      .eq("practitioner_id", user.id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(3);
    upcomingAppts = appts ?? [];

    const { count: alerts } = await supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null);
    alertsCount = alerts ?? 0;
  } else {
    const { data: pa } = await supabase
      .from("patients")
      .select("occupation, height_cm, weight_kg")
      .eq("id", user.id)
      .single();
    patientData = pa;

    const { data: j } = await supabase
      .from("journeys")
      .select(
        "sport_goal, race_name, race_date, progress_pct, weeks_to_race, current_step_label",
      )
      .eq("patient_id", user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    journey = j;

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, reason")
      .eq("patient_id", user.id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(3);
    upcomingAppts = appts ?? [];

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, due_at")
      .eq("patient_id", user.id)
      .in("status", ["pending", "in_progress"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(5);
    openTasks = tasks ?? [];
  }

  return (
    <main className="min-h-screen px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-[1120px]">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-accent text-lg text-coral">Via Sana</p>
            <h1 className="text-3xl font-extrabold tracking-tight">
              PrépaMarathon
            </h1>
          </div>
          <form action={logoutAction}>
            <button className="btn-secondary">Se déconnecter</button>
          </form>
        </header>

        <section className="mt-10">
          <p className="text-sm text-ink-muted">Bonjour</p>
          <h2 className="mt-1 text-4xl font-extrabold">
            {profile.first_name}{" "}
            <span className="text-ink-muted font-normal">
              {profile.last_name}
            </span>
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`badge ${
                isPractitioner
                  ? "bg-coral-bg text-coral"
                  : "bg-leaf-bg text-leaf"
              }`}
            >
              {isPractitioner ? "Praticien" : "Patient"}
            </span>
            {isPractitioner && practitionerData && (
              <>
                <span className="badge bg-cream-soft text-ink-muted">
                  {SPECIALTY_LABELS[practitionerData.specialty] ??
                    practitionerData.specialty}
                </span>
                {practitionerData.cabinet_name && (
                  <span className="text-sm text-ink-muted">
                    {practitionerData.cabinet_name}
                  </span>
                )}
              </>
            )}
            {!isPractitioner && patientData?.occupation && (
              <span className="text-sm text-ink-muted">
                {patientData.occupation}
              </span>
            )}
          </div>
        </section>

        {isPractitioner ? (
          <section className="mt-10 grid gap-5 sm:grid-cols-3">
            <div className="card p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Patients suivis
              </p>
              <p className="mt-3 text-4xl font-extrabold">
                {assignedPatientCount}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                en parcours actif
              </p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Alertes ouvertes
              </p>
              <p className="mt-3 text-4xl font-extrabold text-coral">
                {alertsCount}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                tous patients confondus
              </p>
            </div>
            <div className="card p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Prochains RDV
              </p>
              {upcomingAppts.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Aucun RDV programmé.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcomingAppts.map((a) => (
                    <li key={a.id} className="text-sm">
                      <span className="font-bold">
                        {formatDateTime(a.scheduled_at)}
                      </span>
                      <span className="block text-ink-muted">
                        {a.reason ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="card lg:col-span-2 p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Votre parcours
              </p>
              {journey ? (
                <>
                  <h3 className="mt-2 text-2xl font-extrabold">
                    {journey.race_name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {SPORT_GOAL_LABELS[journey.sport_goal] ?? journey.sport_goal}
                    {journey.race_date && ` · ${formatRaceDate(journey.race_date)}`}
                    {journey.weeks_to_race != null &&
                      ` · ${journey.weeks_to_race} semaines avant la course`}
                  </p>

                  <div className="mt-6">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                        Progression
                      </span>
                      <span className="text-sm font-bold">
                        {journey.progress_pct ?? 0}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-soft">
                      <div
                        className="h-full bg-coral"
                        style={{ width: `${journey.progress_pct ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {journey.current_step_label && (
                    <div className="mt-6 rounded-[14px] border border-line bg-surface-warm p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                        Étape en cours
                      </p>
                      <p className="mt-1 font-bold">
                        {journey.current_step_label}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-ink-muted">
                  Aucun parcours actif. Contactez votre praticien.
                </p>
              )}
            </div>

            <div className="card p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Prochains rendez-vous
              </p>
              {upcomingAppts.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Aucun RDV programmé.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {upcomingAppts.map((a) => (
                    <li key={a.id}>
                      <p className="text-sm font-bold">
                        {formatDateTime(a.scheduled_at)}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {a.reason ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card lg:col-span-3 p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                À faire
              </p>
              {openTasks.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Aucune tâche en attente.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-line">
                  {openTasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="font-medium">{t.title}</span>
                      {t.due_at && (
                        <span className="badge bg-coral-bg text-coral">
                          {formatRaceDate(t.due_at)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        <footer className="mt-14 text-xs text-ink-light">
          Connecté en tant que <code>{profile.username ?? profile.email}</code>{" "}
          · ID {user.id.slice(0, 8)}
        </footer>
      </div>
    </main>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRaceDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
