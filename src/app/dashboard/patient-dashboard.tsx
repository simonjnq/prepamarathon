import Link from "next/link";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronRight,
  Footprints,
} from "lucide-react";
import { Badge, statusBadgeVariant } from "@/components/badge";
import type { SessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  SPORT_GOAL_LABELS,
  STEP_CATEGORY_LABELS,
  STEP_STATUS_LABELS,
  fmtDateLong,
  fmtDateTime,
  fmtRelative,
} from "@/lib/labels";

export async function PatientDashboard({
  profile,
}: {
  profile: SessionProfile;
}) {
  const supabase = await createClient();

  const { data: journey } = await supabase
    .from("journeys")
    .select(
      "id, sport_goal, race_name, race_date, progress_pct, weeks_to_race, current_step_label",
    )
    .eq("patient_id", profile.id)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let currentStep: {
    title: string;
    description: string | null;
    category: string;
    scheduled_at: string | null;
    practitioner_name: string | null;
  } | null = null;
  if (journey?.id) {
    const { data: step } = await supabase
      .from("journey_steps")
      .select(
        "title, description, category, scheduled_at, practitioner_id, practitioners(profiles(first_name, last_name))",
      )
      .eq("journey_id", journey.id)
      .eq("status", "in_progress")
      .order("order_idx", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (step) {
      const pp = (
        step as unknown as {
          practitioners: { profiles: { first_name: string; last_name: string } } | null;
        }
      ).practitioners?.profiles;
      currentStep = {
        title: step.title,
        description: step.description,
        category: step.category,
        scheduled_at: step.scheduled_at,
        practitioner_name: pp ? `${pp.first_name} ${pp.last_name}` : null,
      };
    }
  }

  const nowIso = new Date("2026-05-09T10:00:00Z").toISOString();
  const { data: nextAppt } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, reason, location, practitioners(profiles(first_name, last_name), specialty)",
    )
    .eq("patient_id", profile.id)
    .eq("status", "scheduled")
    .gte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: openTasks } = await supabase
    .from("tasks")
    .select("id, title, description, due_at")
    .eq("patient_id", profile.id)
    .in("status", ["pending", "in_progress"])
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(3);

  const apptPractitioner = (
    nextAppt as unknown as {
      practitioners: {
        profiles: { first_name: string; last_name: string };
        specialty: string;
      } | null;
    } | null
  )?.practitioners;

  return (
    <>
      <header>
        <p className="text-sm text-ink-muted">Bonjour</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          {profile.first_name},
        </h1>
        <p className="mt-2 text-lg text-ink-muted">
          votre préparation,{" "}
          <span className="font-accent text-coral">sans angle mort</span>.
        </p>
      </header>

      {currentStep && (
        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-coral">
            Votre prochaine étape
          </p>
          <div className="card mt-2 overflow-hidden p-0">
            <div className="bg-coral-bg px-7 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-coral">
                {STEP_CATEGORY_LABELS[currentStep.category] ??
                  currentStep.category}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold">
                {currentStep.title}
              </h2>
            </div>
            <div className="px-7 py-5">
              {currentStep.description && (
                <p className="text-ink-muted">{currentStep.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {currentStep.scheduled_at && (
                  <span className="text-ink-muted">
                    📅 {fmtDateLong(currentStep.scheduled_at)}
                  </span>
                )}
                {currentStep.practitioner_name && (
                  <span className="text-ink-muted">
                    Avec {currentStep.practitioner_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Journey progress */}
        <Link
          href={"/mon-parcours" as never}
          className="card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-card lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints
                size={18}
                strokeWidth={1.75}
                className="text-coral"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Mon parcours
              </p>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.75}
              className="text-ink-light transition-transform group-hover:translate-x-0.5 group-hover:text-coral"
            />
          </div>
          {journey ? (
            <>
              <h3 className="mt-3 text-2xl font-extrabold">
                {journey.race_name}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                {SPORT_GOAL_LABELS[journey.sport_goal] ?? journey.sport_goal}
                {journey.race_date &&
                  ` · ${fmtDateLong(journey.race_date)}`}
                {journey.weeks_to_race != null && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-bold text-ink">
                      {journey.weeks_to_race} sem.
                    </span>{" "}
                    avant
                  </>
                )}
              </p>
              <div className="mt-5">
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
                    className="h-full bg-coral transition-all"
                    style={{ width: `${journey.progress_pct ?? 0}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-ink-muted">
              Aucun parcours actif pour le moment.
            </p>
          )}
        </Link>

        {/* Next appointment */}
        <Link
          href={"/mes-rdv" as never}
          className="card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon
                size={18}
                strokeWidth={1.75}
                className="text-coral"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Prochain rendez-vous
              </p>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.75}
              className="text-ink-light transition-transform group-hover:translate-x-0.5 group-hover:text-coral"
            />
          </div>
          {nextAppt ? (
            <>
              <p className="mt-3 text-sm font-bold text-coral">
                {fmtRelative(nextAppt.scheduled_at)}
              </p>
              <h3 className="mt-1 text-lg font-extrabold leading-tight">
                {nextAppt.reason}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
                {fmtDateTime(nextAppt.scheduled_at)}
              </p>
              {apptPractitioner && (
                <p className="mt-1 text-sm text-ink-muted">
                  avec {apptPractitioner.profiles.first_name}{" "}
                  {apptPractitioner.profiles.last_name}
                </p>
              )}
              {nextAppt.location && (
                <p className="mt-1 text-xs text-ink-light">
                  {nextAppt.location}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">
              Aucun RDV programmé.
            </p>
          )}
        </Link>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} strokeWidth={1.75} className="text-coral" />
            <h2 className="text-lg font-extrabold">À faire</h2>
          </div>
          <Link
            href={"/mes-taches" as never}
            className="text-sm font-medium text-coral hover:underline"
          >
            Voir tout
          </Link>
        </div>
        {openTasks && openTasks.length > 0 ? (
          <ul className="space-y-3">
            {openTasks.map((t) => (
              <li key={t.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.title}</p>
                    {t.description && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {t.description}
                      </p>
                    )}
                  </div>
                  {t.due_at && (
                    <Badge variant="coral" className="shrink-0">
                      {fmtRelative(t.due_at)}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-5 text-sm text-ink-muted">
            Aucune tâche en attente. Vous êtes à jour.
          </p>
        )}
      </section>
    </>
  );
}
