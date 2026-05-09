import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  MapPin,
  Phone,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { DocumentCard } from "@/components/document-card";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Badge, severityBadgeVariant } from "@/components/badge";
import { Timeline, type TimelineStep } from "@/components/timeline";
import { requirePractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ALERT_SEVERITY_LABELS,
  APPOINTMENT_STATUS_LABELS,
  SPECIALTY_LABELS,
  SPORT_GOAL_LABELS,
  TASK_SOURCE_LABELS,
  TASK_STATUS_LABELS,
  ageFromDob,
  fmtDateLong,
  fmtDateTime,
  fmtRelative,
} from "@/lib/labels";
import { NewNoteForm } from "./new-note-form";
import { NewAppointmentForm } from "./new-appointment-form";
import { StepActions } from "./step-actions";
import { NoteRow } from "./note-row";
import { AppointmentActions } from "./appointment-actions";
import {
  AddPractitionerInline,
  RemoveAssignmentButton,
} from "./add-practitioner";
import { AIAudit } from "./ai-audit";
import { RemindersSection, type Reminder } from "./reminders-section";
import { UploadDocument } from "./upload-document";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { resolveAlertAction } from "./actions";

export default async function PatientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { profile: me } = await requirePractitioner();
  const { id: patientId } = await props.params;
  const supabase = await createClient();

  const { specialty } = await supabase
    .from("practitioners")
    .select("specialty")
    .eq("id", me.id)
    .single()
    .then((r) => ({ specialty: r.data?.specialty ?? null }));

  const [{ data: patient }, { data: pf }] = await Promise.all([
    supabase
      .from("patients")
      .select(
        `id, date_of_birth, gender, height_cm, weight_kg, occupation,
         allergies, medications, blood_type, emergency_contact_name,
         emergency_contact_phone, notes`,
      )
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, username")
      .eq("id", patientId)
      .maybeSingle(),
  ]);

  if (!patient || !pf) notFound();

  const { data: journey } = await supabase
    .from("journeys")
    .select(
      "id, sport_goal, race_name, race_date, status, progress_pct, weeks_to_race, current_step_label, started_at",
    )
    .eq("patient_id", patientId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let steps: TimelineStep[] = [];
  if (journey) {
    const { data } = await supabase
      .from("journey_steps")
      .select(
        "id, order_idx, title, description, category, status, scheduled_at, completed_at, practitioner_id, practitioners(profiles(first_name, last_name))",
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

  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, content, tags, created_at, practitioner_id, practitioners(profiles(first_name, last_name), specialty)",
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, duration_min, location, status, reason, summary, practitioners(profiles(first_name, last_name), specialty)",
    )
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: false });

  const nowIso = new Date("2026-05-09T10:00:00Z").toISOString();
  const upcomingAppts = (appts ?? []).filter(
    (a) => a.status === "scheduled" && a.scheduled_at >= nowIso,
  );
  const pastAppts = (appts ?? []).filter(
    (a) => a.status !== "scheduled" || a.scheduled_at < nowIso,
  );

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, status, source, due_at, completed_at, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const openTasks = (tasks ?? []).filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );
  const doneTasks = (tasks ?? []).filter((t) => t.status === "done");

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, severity, title, message, source, resolved_at, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  const openAlerts = (alerts ?? []).filter((a) => !a.resolved_at);

  const { data: pains } = await supabase
    .from("pain_points")
    .select("id, body_zone, severity, description, started_on, resolved_on")
    .eq("patient_id", patientId)
    .order("started_on", { ascending: false });
  const activePains = (pains ?? []).filter((p) => !p.resolved_on);

  const { data: assignments } = await supabase
    .from("practitioner_assignments")
    .select(
      "id, role_in_journey, started_at, active, practitioner_id, practitioners(profiles(first_name, last_name), specialty, cabinet_name)",
    )
    .eq("patient_id", patientId)
    .eq("active", true);

  // All practitioners (for "Add to team" select). Filter out already-assigned.
  const assignedIds = new Set(
    (assignments ?? []).map((a) => a.practitioner_id),
  );
  const { data: allPractitioners } = await supabase
    .from("practitioners")
    .select("id, specialty, profiles(first_name, last_name)");
  const practitionerCandidates = ((allPractitioners ?? []) as unknown as Array<{
    id: string;
    specialty: string;
    profiles: { first_name: string; last_name: string } | null;
  }>)
    .filter((p) => !assignedIds.has(p.id) && p.profiles)
    .map((p) => ({
      id: p.id,
      name: `${p.profiles!.first_name} ${p.profiles!.last_name}`,
      specialty_label:
        SPECIALTY_LABELS[p.specialty] ?? p.specialty,
    }));

  const { data: qresps } = await supabase
    .from("questionnaire_responses")
    .select("section, question_label, answer_text")
    .eq("patient_id", patientId)
    .order("section", { ascending: true });

  const { data: docs } = await supabase
    .from("documents")
    .select("id, type, title, description, file_url, created_at, uploaded_by")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const { data: reminderRows } = await supabase
    .from("reminders")
    .select("id, channel, message, scheduled_at, status, sent_at")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true });
  const reminders = (reminderRows ?? []) as unknown as Reminder[];
  const uploaderIds = Array.from(
    new Set(
      (docs ?? [])
        .map((d) => d.uploaded_by)
        .filter((x): x is string => !!x),
    ),
  );
  const docUploaderById = new Map<string, string>();
  if (uploaderIds.length > 0) {
    const { data: ups } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", uploaderIds);
    (ups ?? []).forEach((p) =>
      docUploaderById.set(p.id, `${p.first_name} ${p.last_name}`),
    );
  }

  // Group questionnaire by section
  const qBySection = new Map<
    string,
    Array<{ question_label: string; answer_text: string | null }>
  >();
  (qresps ?? []).forEach((q) => {
    const arr = qBySection.get(q.section) ?? [];
    arr.push({ question_label: q.question_label, answer_text: q.answer_text });
    qBySection.set(q.section, arr);
  });

  const age = ageFromDob(patient.date_of_birth);

  type NoteRow = {
    id: string;
    content: string;
    tags: string[] | null;
    created_at: string;
    practitioner_id: string;
    practitioners: {
      profiles: { first_name: string; last_name: string };
      specialty: string;
    };
  };
  const typedNotes = (notes ?? []) as unknown as NoteRow[];

  return (
    <AppShell profile={me} specialty={specialty}>
      <RealtimeRefresh
        tables={[
          "alerts",
          "tasks",
          "notes",
          "appointments",
          "journey_steps",
          "practitioner_assignments",
        ]}
        channel={`patient-${patientId}`}
      />
      <Link
        href={"/patients" as never}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-coral"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        Tous les patients
      </Link>

      {/* Header */}
      <header className="mt-5 flex flex-wrap items-start gap-6">
        <Avatar
          firstName={pf.first_name}
          lastName={pf.last_name}
          size={88}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {pf.first_name} {pf.last_name}
          </h1>
          <p className="mt-1 text-ink-muted">
            {age != null && `${age} ans`}
            {patient.gender && ` · ${patient.gender}`}
            {patient.occupation && ` · ${patient.occupation}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
            {pf.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} strokeWidth={1.75} />
                {pf.phone}
              </span>
            )}
            {patient.height_cm && patient.weight_kg && (
              <span>
                {patient.height_cm} cm · {Number(patient.weight_kg)} kg
                {patient.blood_type && ` · groupe ${patient.blood_type}`}
              </span>
            )}
          </div>
        </div>
      </header>

      {patient.notes && (
        <p className="mt-5 rounded-md border border-line bg-surface-warm px-4 py-3 text-sm italic text-ink-muted">
          {patient.notes}
        </p>
      )}

      {/* Journey banner */}
      {journey && (
        <section className="mt-7 overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
          <div className="bg-coral-bg px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-coral">
              {SPORT_GOAL_LABELS[journey.sport_goal] ?? journey.sport_goal}
              {journey.race_date && ` · ${fmtDateLong(journey.race_date)}`}
              {journey.weeks_to_race != null &&
                ` · ${journey.weeks_to_race} semaines avant la course`}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">
              {journey.race_name}
            </h2>
          </div>
          <div className="grid gap-5 px-6 py-5 sm:grid-cols-4">
            <Stat
              label="Progression"
              value={`${journey.progress_pct ?? 0}%`}
            />
            <Stat
              label="Alertes ouvertes"
              value={`${openAlerts.length}`}
              tone={
                openAlerts.some((a) => a.severity === "urgent")
                  ? "rust"
                  : openAlerts.length > 0
                    ? "amber"
                    : "leaf"
              }
            />
            <Stat
              label="Douleurs actives"
              value={`${activePains.length}`}
              tone={activePains.length > 0 ? "amber" : "leaf"}
            />
            <Stat
              label="Étape en cours"
              value={journey.current_step_label ?? "—"}
              valueClass="text-base font-bold leading-tight"
            />
          </div>
        </section>
      )}

      {/* AI audit (full width) */}
      <div className="mt-7">
        <AIAudit patientId={patientId} />
      </div>

      {/* Two-column layout */}
      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        {/* LEFT (2 cols) — Parcours + Notes */}
        <div className="space-y-7 lg:col-span-2">
          {/* Active alerts (top of left column for visibility) */}
          {openAlerts.length > 0 && (
            <Section
              icon={<AlertTriangle size={18} strokeWidth={1.75} className="text-coral" />}
              title={`Alertes ouvertes (${openAlerts.length})`}
            >
              <ul className="space-y-3">
                {openAlerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-md border border-line bg-surface-warm p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={severityBadgeVariant(a.severity)}>
                          {ALERT_SEVERITY_LABELS[a.severity] ?? a.severity}
                        </Badge>
                        <p className="font-bold">{a.title}</p>
                      </div>
                      {a.message && (
                        <p className="mt-1 text-sm text-ink-muted">
                          {a.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-ink-light">
                        {fmtRelative(a.created_at)}
                        {a.source && ` · source : ${a.source}`}
                      </p>
                    </div>
                    <form action={resolveAlertAction}>
                      <input type="hidden" name="alert_id" value={a.id} />
                      <input type="hidden" name="patient_id" value={patientId} />
                      <button className="btn-secondary px-3! py-1.5! text-xs!">
                        Marquer résolue
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section
            icon={<Clock size={18} strokeWidth={1.75} className="text-coral" />}
            title="Parcours"
          >
            <Timeline
              steps={steps}
              renderActions={(step) => (
                <StepActions step={step} patientId={patientId} />
              )}
            />
          </Section>

          <Section
            icon={<Sparkles size={18} strokeWidth={1.75} className="text-coral" />}
            title={`Notes de suivi (${typedNotes.length})`}
          >
            <NewNoteForm patientId={patientId} />
            {typedNotes.length > 0 && (
              <ul className="mt-5 space-y-4">
                {typedNotes.map((n) => (
                  <NoteRow
                    key={n.id}
                    note={n}
                    patientId={patientId}
                    isAuthor={n.practitioner_id === me.id}
                  />
                ))}
              </ul>
            )}
          </Section>

          {/* Tasks */}
          <Section
            icon={<CheckCircle2 size={18} strokeWidth={1.75} className="text-coral" />}
            title={`Tâches du patient (${openTasks.length} en cours)`}
          >
            {openTasks.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Aucune tâche en cours.
              </p>
            ) : (
              <ul className="space-y-2">
                {openTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-line bg-surface-warm p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{t.title}</p>
                      {t.description && (
                        <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-ink-light">
                        Source : {TASK_SOURCE_LABELS[t.source] ?? t.source}
                        {t.due_at && ` · échéance ${fmtRelative(t.due_at)}`}
                      </p>
                    </div>
                    <Badge variant="coral">
                      {TASK_STATUS_LABELS[t.status] ?? t.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {doneTasks.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-coral">
                  {doneTasks.length} tâche(s) terminée(s)
                </summary>
                <ul className="mt-2 space-y-1.5 pl-2">
                  {doneTasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 text-sm text-ink-muted"
                    >
                      <CheckCircle2
                        size={14}
                        strokeWidth={2}
                        className="text-leaf"
                      />
                      <span className="line-through">{t.title}</span>
                      {t.completed_at && (
                        <span className="text-xs text-ink-light">
                          · {fmtRelative(t.completed_at)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Section>
        </div>

        {/* RIGHT (1 col) — health profile + practitioner team + RDV */}
        <div className="space-y-7">
          {/* Pain points */}
          {activePains.length > 0 && (
            <Section
              icon={<Heart size={18} strokeWidth={1.75} className="text-coral" />}
              title="Douleurs actives"
            >
              <ul className="space-y-2">
                {activePains.map((p) => (
                  <li key={p.id} className="rounded-md border border-line bg-surface-warm p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="font-bold">{p.body_zone}</p>
                      <span className="text-sm font-bold text-coral">
                        {p.severity}/10
                      </span>
                    </div>
                    {p.description && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {p.description}
                      </p>
                    )}
                    {p.started_on && (
                      <p className="mt-1 text-xs text-ink-light">
                        Depuis {fmtDateLong(p.started_on)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Health profile */}
          <Section
            icon={<Heart size={18} strokeWidth={1.75} className="text-coral" />}
            title="Profil santé"
          >
            <dl className="space-y-2 text-sm">
              <Field
                label="Allergies"
                value={patient.allergies ?? "Aucune connue"}
              />
              <Field
                label="Traitements"
                value={patient.medications ?? "Aucun"}
              />
              <Field
                label="Contact urgence"
                value={
                  patient.emergency_contact_name
                    ? `${patient.emergency_contact_name}${
                        patient.emergency_contact_phone
                          ? ` · ${patient.emergency_contact_phone}`
                          : ""
                      }`
                    : "—"
                }
              />
            </dl>
          </Section>

          {/* Practitioner team */}
          <Section
            icon={
              <Stethoscope size={18} strokeWidth={1.75} className="text-coral" />
            }
            title="Équipe de soins"
          >
            <ul className="space-y-3">
              {(assignments ?? []).map((a) => {
                const pp = (
                  a as unknown as {
                    practitioners: {
                      profiles: { first_name: string; last_name: string };
                      specialty: string;
                      cabinet_name: string | null;
                    } | null;
                  }
                ).practitioners;
                if (!pp) return null;
                return (
                  <li key={a.id} className="flex items-center gap-3">
                    <Avatar
                      firstName={pp.profiles.first_name}
                      lastName={pp.profiles.last_name}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {pp.profiles.first_name} {pp.profiles.last_name}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {SPECIALTY_LABELS[pp.specialty] ?? pp.specialty}
                      </p>
                    </div>
                    <RemoveAssignmentButton
                      assignmentId={a.id}
                      patientId={patientId}
                    />
                  </li>
                );
              })}
            </ul>
            <AddPractitionerInline
              patientId={patientId}
              candidates={practitionerCandidates}
            />
          </Section>

          <RemindersSection patientId={patientId} reminders={reminders} />

          {/* Documents */}
          <Section
            icon={
              <FileText
                size={18}
                strokeWidth={1.75}
                className="text-coral"
              />
            }
            title={`Documents (${docs?.length ?? 0})`}
          >
            <div className="mb-3">
              <UploadDocument patientId={patientId} />
            </div>
            {!docs || docs.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Aucun document pour l&apos;instant.
              </p>
            ) : (
              <div className="space-y-3">
                {docs.slice(0, 5).map((d) => (
                  <DocumentCard
                    key={d.id}
                    doc={d}
                    uploadedByName={
                      d.uploaded_by ? docUploaderById.get(d.uploaded_by) : null
                    }
                    compact
                  />
                ))}
                {docs.length > 5 && (
                  <p className="text-xs text-ink-light">
                    + {docs.length - 5} autre{docs.length - 5 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* Upcoming appointments */}
          <Section
            icon={
              <MapPin size={18} strokeWidth={1.75} className="text-coral" />
            }
            title={`RDV à venir (${upcomingAppts.length})`}
          >
            <NewAppointmentForm patientId={patientId} />
            {upcomingAppts.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun RDV programmé.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingAppts.map((a) => {
                  const pp = (
                    a as unknown as {
                      practitioners: {
                        profiles: { first_name: string; last_name: string };
                        specialty: string;
                      };
                    }
                  ).practitioners;
                  return (
                    <li
                      key={a.id}
                      className="rounded-md border border-line bg-surface-warm p-3"
                    >
                      <p className="text-sm font-bold">
                        {fmtDateTime(a.scheduled_at)}
                      </p>
                      <p className="text-xs text-ink-muted">{a.reason}</p>
                      <p className="mt-1 text-xs text-ink-light">
                        {pp.profiles.first_name} {pp.profiles.last_name} ·{" "}
                        {SPECIALTY_LABELS[pp.specialty] ?? pp.specialty}
                      </p>
                      <AppointmentActions
                        apptId={a.id}
                        patientId={patientId}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Past appointments collapsed */}
          {pastAppts.length > 0 && (
            <Section
              icon={
                <Clock size={18} strokeWidth={1.75} className="text-coral" />
              }
              title={`RDV passés (${pastAppts.length})`}
            >
              <ul className="space-y-2.5">
                {pastAppts.slice(0, 6).map((a) => {
                  const pp = (
                    a as unknown as {
                      practitioners: {
                        profiles: { first_name: string; last_name: string };
                        specialty: string;
                      };
                    }
                  ).practitioners;
                  return (
                    <li key={a.id} className="text-sm">
                      <p className="font-bold">{fmtDateTime(a.scheduled_at)}</p>
                      <p className="text-xs text-ink-muted">
                        {pp.profiles.first_name} {pp.profiles.last_name} ·{" "}
                        {a.reason}{" "}
                        <span className="text-ink-light">
                          ({APPOINTMENT_STATUS_LABELS[a.status] ?? a.status})
                        </span>
                      </p>
                      {a.summary && (
                        <p className="mt-0.5 text-xs italic text-ink-muted line-clamp-2">
                          « {a.summary} »
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>
      </div>

      {/* Questionnaire — full width below */}
      {qBySection.size > 0 && (
        <Section
          className="mt-8"
          icon={
            <Stethoscope size={18} strokeWidth={1.75} className="text-coral" />
          }
          title="Questionnaire médical"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from(qBySection.entries()).map(([section, items]) => (
              <div key={section}>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-light">
                  {section}
                </p>
                <dl className="mt-2 space-y-2.5">
                  {items.map((it) => (
                    <div key={it.question_label}>
                      <dt className="text-sm text-ink-muted">
                        {it.question_label}
                      </dt>
                      <dd className="text-sm font-bold">
                        {it.answer_text ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Section>
      )}
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
  className = "",
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-extrabold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
  valueClass,
}: {
  label: string;
  value: string;
  tone?: "leaf" | "amber" | "rust";
  valueClass?: string;
}) {
  const toneClass =
    tone === "rust"
      ? "text-rust"
      : tone === "amber"
        ? "text-amber"
        : tone === "leaf"
          ? "text-leaf"
          : "";
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-extrabold ${toneClass} ${valueClass ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-bold uppercase tracking-wider text-ink-light">
        {label}
      </dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}
