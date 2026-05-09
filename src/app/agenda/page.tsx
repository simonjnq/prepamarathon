import Link from "next/link";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { requirePractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  APPOINTMENT_STATUS_LABELS,
  fmtDateLong,
  fmtDateTime,
  fmtRelative,
} from "@/lib/labels";

export default async function AgendaPage() {
  const { profile } = await requirePractitioner();
  const supabase = await createClient();

  const { specialty } = await supabase
    .from("practitioners")
    .select("specialty")
    .eq("id", profile.id)
    .single()
    .then((r) => ({ specialty: r.data?.specialty ?? null }));

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, duration_min, location, status, reason, summary, patient_id, patients!inner(profiles!inner(first_name, last_name))",
    )
    .eq("practitioner_id", profile.id)
    .order("scheduled_at", { ascending: true });

  type ApptRow = {
    id: string;
    scheduled_at: string;
    duration_min: number | null;
    location: string | null;
    status: string;
    reason: string | null;
    summary: string | null;
    patient_id: string;
    patients: { profiles: { first_name: string; last_name: string } };
  };
  const all = (appts ?? []) as unknown as ApptRow[];

  const nowIso = new Date("2026-05-09T10:00:00Z").toISOString();
  const today = "2026-05-09";

  const todayAppts = all.filter((a) => a.scheduled_at.slice(0, 10) === today);
  const upcoming = all.filter(
    (a) => a.status === "scheduled" && a.scheduled_at > nowIso,
  );
  const past = all
    .filter((a) => a.status !== "scheduled" || a.scheduled_at < nowIso)
    .reverse(); // most recent first

  // Group upcoming by date
  const upcomingByDate = new Map<string, ApptRow[]>();
  upcoming.forEach((a) => {
    const day = a.scheduled_at.slice(0, 10);
    if (day === today) return; // already in todayAppts
    const arr = upcomingByDate.get(day) ?? [];
    arr.push(a);
    upcomingByDate.set(day, arr);
  });

  return (
    <AppShell profile={profile} specialty={specialty}>
      <header>
        <p className="text-sm text-ink-muted">Votre agenda</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mes{" "}
          <span className="font-accent font-normal text-coral">
            consultations
          </span>
        </h1>
      </header>

      <section className="mt-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          Aujourd&apos;hui — {fmtDateLong(today)}
        </h2>
        {todayAppts.length === 0 ? (
          <p className="card mt-3 p-6 text-sm text-ink-muted">
            Aucun rendez-vous aujourd&apos;hui.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {todayAppts.map((a) => (
              <ApptCard key={a.id} appt={a} variant="today" />
            ))}
          </ul>
        )}
      </section>

      {upcomingByDate.size > 0 && (
        <section className="mt-9">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            À venir
          </h2>
          <div className="mt-3 space-y-6">
            {Array.from(upcomingByDate.entries()).map(([day, list]) => (
              <div key={day}>
                <p className="mb-2 text-sm font-bold text-ink-muted">
                  {fmtDateLong(day)}
                </p>
                <ul className="space-y-3">
                  {list.map((a) => (
                    <ApptCard key={a.id} appt={a} variant="upcoming" />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-9">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            Récents
          </h2>
          <ul className="mt-3 space-y-3">
            {past.slice(0, 8).map((a) => (
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
    patient_id: string;
    patients: { profiles: { first_name: string; last_name: string } };
  };
  variant: "today" | "upcoming" | "past";
}) {
  const pp = a.patients.profiles;
  return (
    <li>
      <Link
        href={`/patients/${a.patient_id}` as never}
        className="card group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
      >
        <Avatar firstName={pp.first_name} lastName={pp.last_name} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-extrabold">
              {pp.first_name} {pp.last_name}
            </p>
            {variant === "today" ? (
              <Badge variant="coral">
                {new Date(a.scheduled_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            ) : variant === "upcoming" ? (
              <Badge variant="soft">{fmtRelative(a.scheduled_at)}</Badge>
            ) : (
              <Badge variant="neutral">
                {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{a.reason}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-light">
            {variant !== "today" && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon size={13} strokeWidth={1.75} />
                {fmtDateTime(a.scheduled_at)}
              </span>
            )}
            {a.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} strokeWidth={1.75} />
                {a.location}
              </span>
            )}
            {a.duration_min && <span>{a.duration_min} min</span>}
          </div>
          {variant === "past" && a.summary && (
            <p className="mt-2 line-clamp-2 text-xs italic text-ink-muted">
              « {a.summary} »
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
