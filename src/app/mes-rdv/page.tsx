import { Calendar, Clock, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { requirePatient } from "@/lib/auth";
import {
  APPOINTMENT_STATUS_LABELS,
  SPECIALTY_LABELS,
  fmtDateLong,
  fmtDateTime,
  fmtRelative,
} from "@/lib/labels";

export default async function MesRdvPage() {
  const { supabase, profile } = await requirePatient();

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, duration_min, location, status, reason, summary, practitioners(profiles(first_name, last_name), specialty)",
    )
    .eq("patient_id", profile.id)
    .order("scheduled_at", { ascending: false });

  type ApptRow = {
    id: string;
    scheduled_at: string;
    duration_min: number | null;
    location: string | null;
    status: string;
    reason: string | null;
    summary: string | null;
    practitioners: {
      profiles: { first_name: string; last_name: string };
      specialty: string;
    };
  };
  const all = (appts ?? []) as unknown as ApptRow[];

  const nowIso = new Date("2026-05-09T10:00:00Z").toISOString();
  const upcoming = all
    .filter((a) => a.status === "scheduled" && a.scheduled_at >= nowIso)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = all.filter(
    (a) => a.status !== "scheduled" || a.scheduled_at < nowIso,
  );

  return (
    <AppShell profile={profile}>
      <header>
        <p className="text-sm text-ink-muted">Votre agenda</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mes{" "}
          <span className="font-accent font-normal text-coral">
            rendez-vous
          </span>
        </h1>
      </header>

      <section className="mt-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          À venir
        </h2>
        {upcoming.length === 0 ? (
          <p className="card mt-3 p-6 text-sm text-ink-muted">
            Aucun rendez-vous programmé.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {upcoming.map((a) => (
              <ApptCard key={a.id} appt={a} variant="upcoming" />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-9">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            Passés
          </h2>
          <ul className="mt-3 space-y-3">
            {past.map((a) => (
              <ApptCard key={a.id} appt={a} variant="past" />
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function ApptCard({
  appt: a,
  variant,
}: {
  appt: {
    id: string;
    scheduled_at: string;
    duration_min: number | null;
    location: string | null;
    status: string;
    reason: string | null;
    summary: string | null;
    practitioners: {
      profiles: { first_name: string; last_name: string } | null;
      specialty: string;
    } | null;
  };
  variant: "upcoming" | "past";
}) {
  const pp = a.practitioners;
  const ppProfile = pp?.profiles;
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar
          firstName={ppProfile?.first_name}
          lastName={ppProfile?.last_name}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-extrabold">{a.reason}</p>
            {variant === "upcoming" ? (
              <Badge variant="coral">{fmtRelative(a.scheduled_at)}</Badge>
            ) : (
              <Badge variant="neutral">
                {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {ppProfile?.first_name} {ppProfile?.last_name}
            {pp?.specialty &&
              ` · ${SPECIALTY_LABELS[pp.specialty] ?? pp.specialty}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} strokeWidth={1.75} />
              {fmtDateTime(a.scheduled_at)}
            </span>
            {a.duration_min && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.75} />
                {a.duration_min} min
              </span>
            )}
            {a.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} strokeWidth={1.75} />
                {a.location}
              </span>
            )}
          </div>
          {variant === "past" && a.summary && (
            <p className="mt-3 rounded-md bg-cream-soft px-3 py-2 text-sm italic text-ink-muted">
              « {a.summary} »
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
