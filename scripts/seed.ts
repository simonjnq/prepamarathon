/**
 * PrépaMarathon — seed runner.
 *
 *   npm run seed
 *
 * Idempotent: deletes any existing demo accounts (emails on the demo domain)
 * and rebuilds everything from scripts/seed-data.ts.
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DEMO_USER_PASSWORD
 *   DEMO_EMAIL_DOMAIN
 *
 * Run the SQL in supabase/migrations/0001_initial_schema.sql in the
 * Supabase SQL Editor *before* the first seed.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import {
  isoDate,
  isoDateTime,
  patients,
  practitioners,
  type AppointmentSeed,
} from "./seed-data";

loadEnv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.DEMO_USER_PASSWORD;
const DOMAIN = process.env.DEMO_EMAIL_DOMAIN ?? "prepa.test";

if (!SUPABASE_URL || !SERVICE_KEY || !PASSWORD) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_PASSWORD in .env.local",
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const log = (msg: string) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

async function deleteDemoAuthUsers() {
  log("Cleaning previous demo users…");
  // listUsers is paginated; loop until empty page.
  let page = 1;
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    if (!data.users.length) break;
    const targets = data.users.filter((u) =>
      (u.email ?? "").endsWith(`@${DOMAIN}`),
    );
    for (const user of targets) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) throw delErr;
      deleted += 1;
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  log(`  deleted ${deleted} previous demo auth user(s)`);
}

async function ensureUser(
  email: string,
  fullName: string,
): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD!,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user.id;
}

function emailFor(username: string) {
  return `${username}@${DOMAIN}`;
}

async function insert(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  options?: { returning?: boolean },
): Promise<unknown[]> {
  const payload = Array.isArray(rows) ? rows : [rows];
  if (payload.length === 0) return [];
  // Untyped client — schema isn't generated, so we assert the shape.
  const query = supabase.from(table).insert(payload as never);
  const { data, error } = options?.returning
    ? await query.select()
    : await query;
  if (error) throw new Error(`insert ${table}: ${error.message}`);
  return (data as unknown[]) ?? [];
}

async function seedPractitioners(): Promise<Map<string, string>> {
  log(`Seeding ${practitioners.length} practitioners…`);
  const ids = new Map<string, string>();
  for (const p of practitioners) {
    const email = emailFor(p.username);
    const id = await ensureUser(email, `${p.firstName} ${p.lastName}`);
    ids.set(p.username, id);

    await insert("profiles", {
      id,
      role: "practitioner",
      first_name: p.firstName,
      last_name: p.lastName,
      email,
      username: p.username,
      phone: p.phone,
    });

    await insert("practitioners", {
      id,
      specialty: p.specialty,
      title: p.title,
      bio: p.bio,
      rpps: p.rpps,
      cabinet_name: p.cabinet,
      city: p.city,
      years_experience: p.yearsExperience,
    });
  }
  return ids;
}

async function seedPatients(): Promise<Map<string, string>> {
  log(`Seeding ${patients.length} patients…`);
  const ids = new Map<string, string>();
  for (const p of patients) {
    const email = emailFor(p.username);
    const id = await ensureUser(email, `${p.firstName} ${p.lastName}`);
    ids.set(p.username, id);

    await insert("profiles", {
      id,
      role: "patient",
      first_name: p.firstName,
      last_name: p.lastName,
      email,
      username: p.username,
      phone: p.phone,
    });

    await insert("patients", {
      id,
      date_of_birth: p.dob,
      gender: p.gender,
      height_cm: p.height,
      weight_kg: p.weight,
      blood_type: p.bloodType ?? null,
      occupation: p.occupation,
      allergies: p.allergies ?? null,
      medications: p.medications ?? null,
      emergency_contact_name: p.emergencyName,
      emergency_contact_phone: p.emergencyPhone,
      notes: p.bio ?? null,
    });
  }
  return ids;
}

async function seedRelations(
  patientIds: Map<string, string>,
  practitionerIds: Map<string, string>,
) {
  log("Seeding journeys, steps, appointments, notes, tasks, alerts…");

  for (const p of patients) {
    const patientId = patientIds.get(p.username)!;
    const practitionerLookup = (username?: string) =>
      username ? practitionerIds.get(username) ?? null : null;

    // 1. Journey
    const [journey] = (await insert(
      "journeys",
      {
        patient_id: patientId,
        sport_goal: p.journey.sportGoal,
        race_name: p.journey.raceName,
        race_date: p.journey.raceDate,
        status: p.journey.status,
        current_step_label: p.journey.currentStepLabel,
        progress_pct: p.journey.progressPct,
        weeks_to_race: p.journey.weeksToRace,
        started_at: isoDateTime(-p.journey.startedDaysAgo, 9),
      },
      { returning: true },
    )) as Array<{ id: string }>;
    const journeyId = journey.id;

    // 2. Steps
    if (p.steps.length) {
      await insert(
        "journey_steps",
        p.steps.map((s) => ({
          journey_id: journeyId,
          order_idx: s.order,
          title: s.title,
          description: s.description ?? null,
          category: s.category,
          status: s.status,
          practitioner_id: practitionerLookup(s.practitioner),
          scheduled_at:
            s.scheduledOffset != null ? isoDate(s.scheduledOffset) : null,
          completed_at:
            s.completedOffset != null
              ? isoDateTime(s.completedOffset, 12)
              : null,
        })),
      );
    }

    // 3. Practitioner assignments
    if (p.assignments.length) {
      await insert(
        "practitioner_assignments",
        p.assignments.map((a) => ({
          patient_id: patientId,
          practitioner_id: practitionerIds.get(a.practitioner)!,
          role_in_journey: a.role,
          started_at: isoDate(a.startedOffset),
          active: true,
        })),
      );
    }

    // 4. Appointments — keep IDs to link notes
    const apptRows: AppointmentSeed[] = p.appointments;
    let apptIds: string[] = [];
    if (apptRows.length) {
      const inserted = (await insert(
        "appointments",
        apptRows.map((a) => ({
          patient_id: patientId,
          practitioner_id: practitionerIds.get(a.practitioner)!,
          scheduled_at: isoDateTime(a.daysOffset, a.hour, a.minute ?? 0),
          duration_min: a.duration,
          location: a.location,
          status: a.status,
          reason: a.reason,
          summary: a.summary ?? null,
        })),
        { returning: true },
      )) as Array<{ id: string }>;
      apptIds = inserted.map((row) => row.id);
    }

    // 5. Notes
    const noteRows: Array<Record<string, unknown>> = [];
    const noteApptMap: Array<number | undefined> = [];
    for (const n of p.notes) {
      noteRows.push({
        patient_id: patientId,
        practitioner_id: practitionerIds.get(n.practitioner)!,
        appointment_id:
          n.appointmentIdx != null ? apptIds[n.appointmentIdx] ?? null : null,
        content: n.content,
        tags: n.tags ?? [],
        created_at: isoDateTime(n.daysOffset, 19),
      });
      noteApptMap.push(n.appointmentIdx);
    }
    let noteIds: string[] = [];
    if (noteRows.length) {
      const inserted = (await insert("notes", noteRows, {
        returning: true,
      })) as Array<{ id: string }>;
      noteIds = inserted.map((row) => row.id);
    }
    void noteIds; // kept for potential linking

    // 6. Tasks
    if (p.tasks.length) {
      await insert(
        "tasks",
        p.tasks.map((t) => ({
          patient_id: patientId,
          title: t.title,
          description: t.description ?? null,
          status: t.status,
          source: t.source,
          source_practitioner_id: practitionerLookup(t.sourcePractitioner),
          due_at: t.dueOffset != null ? isoDate(t.dueOffset) : null,
          completed_at:
            t.completedOffset != null
              ? isoDateTime(t.completedOffset, 18)
              : null,
        })),
      );
    }

    // 7. Alerts
    if (p.alerts.length) {
      await insert(
        "alerts",
        p.alerts.map((a) => ({
          patient_id: patientId,
          severity: a.severity,
          title: a.title,
          message: a.message,
          source: a.source ?? null,
          resolved_at:
            a.resolvedOffset != null ? isoDateTime(a.resolvedOffset, 12) : null,
          created_at: isoDateTime(a.daysOffset, 9),
        })),
      );
    }

    // 8. Pain points
    if (p.pains.length) {
      await insert(
        "pain_points",
        p.pains.map((pp) => ({
          patient_id: patientId,
          body_zone: pp.bodyZone,
          severity: pp.severity,
          description: pp.description ?? null,
          started_on: isoDate(pp.startedOffset),
          resolved_on:
            pp.resolvedOffset != null ? isoDate(pp.resolvedOffset) : null,
        })),
      );
    }

    // 9. Questionnaire
    if (p.questionnaire.length) {
      await insert(
        "questionnaire_responses",
        p.questionnaire.map((q) => ({
          patient_id: patientId,
          section: q.section,
          question_key: q.key,
          question_label: q.label,
          answer_text: q.answer,
        })),
      );
    }
  }
}

async function main() {
  log(`Connecting to ${SUPABASE_URL}`);
  await deleteDemoAuthUsers();
  const practitionerIds = await seedPractitioners();
  const patientIds = await seedPatients();
  await seedRelations(patientIds, practitionerIds);

  log(`✔ Seed complete — ${practitioners.length} practitioners, ${patients.length} patients.`);
  log(`  Login domain: @${DOMAIN}`);
  log(`  Shared password: ${PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
