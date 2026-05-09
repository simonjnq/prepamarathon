import { AppShell } from "@/components/app-shell";
import { Timeline, type TimelineStep } from "@/components/timeline";
import { requirePatient } from "@/lib/auth";
import { SPORT_GOAL_LABELS, fmtDateLong } from "@/lib/labels";

export default async function MonParcoursPage() {
  const { supabase, profile } = await requirePatient();

  const { data: journey } = await supabase
    .from("journeys")
    .select(
      "id, sport_goal, race_name, race_date, status, progress_pct, weeks_to_race, current_step_label, started_at",
    )
    .eq("patient_id", profile.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let steps: TimelineStep[] = [];
  if (journey) {
    const { data } = await supabase
      .from("journey_steps")
      .select(
        "id, order_idx, title, description, category, status, scheduled_at, completed_at, practitioners(profiles(first_name, last_name))",
      )
      .eq("journey_id", journey.id)
      .order("order_idx", { ascending: true });
    steps = ((data ?? []) as unknown as Array<{
      id: string;
      order_idx: number;
      title: string;
      description: string | null;
      category: string;
      status: TimelineStep["status"];
      scheduled_at: string | null;
      completed_at: string | null;
      practitioners: { profiles: { first_name: string; last_name: string } } | null;
    }>).map((s) => ({
      id: s.id,
      order_idx: s.order_idx,
      title: s.title,
      description: s.description,
      category: s.category,
      status: s.status,
      scheduled_at: s.scheduled_at,
      completed_at: s.completed_at,
      practitioner_name: s.practitioners
        ? `${s.practitioners.profiles.first_name} ${s.practitioners.profiles.last_name}`
        : null,
    }));
  }

  const doneCount = steps.filter((s) => s.status === "done").length;
  const inProgressCount = steps.filter((s) => s.status === "in_progress").length;
  const upcomingCount = steps.filter((s) => s.status === "upcoming").length;

  return (
    <AppShell profile={profile}>
      <header>
        <p className="text-sm text-ink-muted">Votre préparation</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mon{" "}
          <span className="font-accent font-normal text-coral">parcours</span>
        </h1>
      </header>

      {journey ? (
        <>
          <section className="mt-7 overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
            <div className="bg-coral-bg px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral">
                {SPORT_GOAL_LABELS[journey.sport_goal] ?? journey.sport_goal}
                {journey.race_date &&
                  ` · ${fmtDateLong(journey.race_date)}`}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold">
                {journey.race_name}
              </h2>
              {journey.weeks_to_race != null && (
                <p className="mt-1 text-sm text-ink-muted">
                  Plus que{" "}
                  <span className="font-bold text-ink">
                    {journey.weeks_to_race} semaines
                  </span>{" "}
                  avant le départ.
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 divide-x divide-line">
              <Stat label="Réalisées" value={doneCount} tone="leaf" />
              <Stat label="En cours" value={inProgressCount} tone="coral" />
              <Stat label="À venir" value={upcomingCount} />
            </div>
          </section>

          <section className="mt-8">
            <Timeline steps={steps} />
          </section>
        </>
      ) : (
        <p className="card mt-7 p-8 text-center text-ink-muted">
          Aucun parcours actif pour le moment.
        </p>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "leaf" | "coral";
}) {
  const toneCls =
    tone === "leaf" ? "text-leaf" : tone === "coral" ? "text-coral" : "text-ink";
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-extrabold ${toneCls}`}>{value}</p>
    </div>
  );
}
