-- =============================================================
-- PrépaMarathon — Initial schema
-- Run this once in the Supabase SQL Editor before seeding.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------------
do $$ begin
  create type user_role as enum ('patient', 'practitioner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type practitioner_specialty as enum (
    'medecin_du_sport',
    'kinesitherapeute',
    'osteopathe',
    'nutritionniste',
    'podologue',
    'cardiologue',
    'psychologue',
    'coach'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type sport_goal as enum (
    'marathon',
    'semi_marathon',
    '10km',
    '5km',
    'running',
    'reprise'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type journey_status as enum ('active', 'completed', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type step_status as enum ('done', 'in_progress', 'upcoming');
exception when duplicate_object then null; end $$;

do $$ begin
  create type step_category as enum (
    'medical',
    'kine',
    'osteo',
    'nutrition',
    'training',
    'control',
    'podologie',
    'cardio',
    'mental'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending', 'in_progress', 'done', 'snoozed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_source as enum ('practitioner', 'system', 'patient', 'ai');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('info', 'warning', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_type as enum (
    'ordonnance',
    'compte_rendu',
    'recommandation',
    'examen',
    'autre'
  );
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------
-- TABLES
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  username text unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);

create table if not exists public.practitioners (
  id uuid primary key references public.profiles(id) on delete cascade,
  specialty practitioner_specialty not null,
  title text,
  bio text,
  rpps text,
  cabinet_name text,
  city text default 'Paris',
  years_experience int,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth date,
  gender text,
  height_cm int,
  weight_kg numeric(5,2),
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text,
  medications text,
  blood_type text,
  occupation text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  sport_goal sport_goal not null,
  race_name text,
  race_date date,
  status journey_status not null default 'active',
  current_step_label text,
  progress_pct int default 0,
  weeks_to_race int,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_journeys_patient on public.journeys(patient_id);
create index if not exists idx_journeys_status on public.journeys(status);

create table if not exists public.journey_steps (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  order_idx int not null,
  title text not null,
  description text,
  category step_category not null,
  status step_status not null default 'upcoming',
  practitioner_id uuid references public.practitioners(id) on delete set null,
  scheduled_at date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_journey_steps_journey on public.journey_steps(journey_id);

create table if not exists public.practitioner_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  role_in_journey text,
  started_at date not null default current_date,
  active boolean not null default true,
  unique (patient_id, practitioner_id)
);
create index if not exists idx_assignments_practitioner on public.practitioner_assignments(practitioner_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_min int default 30,
  location text,
  status appointment_status not null default 'scheduled',
  reason text,
  summary text,
  created_at timestamptz not null default now()
);
create index if not exists idx_appointments_patient on public.appointments(patient_id);
create index if not exists idx_appointments_practitioner on public.appointments(practitioner_id);
create index if not exists idx_appointments_scheduled on public.appointments(scheduled_at);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  content text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_notes_patient on public.notes(patient_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'pending',
  source task_source not null default 'practitioner',
  source_practitioner_id uuid references public.practitioners(id) on delete set null,
  source_note_id uuid references public.notes(id) on delete set null,
  due_at date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_tasks_patient on public.tasks(patient_id);
create index if not exists idx_tasks_status on public.tasks(status);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  severity alert_severity not null default 'info',
  title text not null,
  message text,
  source text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_alerts_patient on public.alerts(patient_id);

create table if not exists public.pain_points (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  body_zone text not null,
  severity int check (severity between 0 and 10),
  description text,
  started_on date,
  resolved_on date,
  created_at timestamptz not null default now()
);
create index if not exists idx_pain_patient on public.pain_points(patient_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  type document_type not null default 'autre',
  title text not null,
  description text,
  file_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_documents_patient on public.documents(patient_id);

create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  section text not null,
  question_key text not null,
  question_label text not null,
  answer_text text,
  answered_at timestamptz not null default now(),
  unique (patient_id, question_key)
);
create index if not exists idx_qresponses_patient on public.questionnaire_responses(patient_id);

-- -------------------------------------------------------------
-- HELPERS
-- -------------------------------------------------------------
create or replace function public.is_practitioner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('practitioner', 'admin')
  );
$$;

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.practitioners enable row level security;
alter table public.patients enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_steps enable row level security;
alter table public.practitioner_assignments enable row level security;
alter table public.appointments enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.alerts enable row level security;
alter table public.pain_points enable row level security;
alter table public.documents enable row level security;
alter table public.questionnaire_responses enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_practitioner());

drop policy if exists practitioners_select on public.practitioners;
create policy practitioners_select on public.practitioners
  for select using (auth.uid() is not null);

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
  for select using (id = auth.uid() or public.is_practitioner());

drop policy if exists journeys_select on public.journeys;
create policy journeys_select on public.journeys
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists steps_select on public.journey_steps;
create policy steps_select on public.journey_steps
  for select using (
    public.is_practitioner()
    or exists (
      select 1 from public.journeys j
      where j.id = journey_steps.journey_id and j.patient_id = auth.uid()
    )
  );

drop policy if exists assignments_select on public.practitioner_assignments;
create policy assignments_select on public.practitioner_assignments
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists appts_select on public.appointments;
create policy appts_select on public.appointments
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists alerts_select on public.alerts;
create policy alerts_select on public.alerts
  for select using (public.is_practitioner());

drop policy if exists pain_select on public.pain_points;
create policy pain_select on public.pain_points
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists docs_select on public.documents;
create policy docs_select on public.documents
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists qresp_select on public.questionnaire_responses;
create policy qresp_select on public.questionnaire_responses
  for select using (patient_id = auth.uid() or public.is_practitioner());

-- Patients can mark their own tasks done.
drop policy if exists tasks_patient_update on public.tasks;
create policy tasks_patient_update on public.tasks
  for update using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- Practitioners can write notes/appointments/tasks/alerts.
drop policy if exists notes_practitioner_write on public.notes;
create policy notes_practitioner_write on public.notes
  for insert with check (public.is_practitioner());

drop policy if exists appts_practitioner_write on public.appointments;
create policy appts_practitioner_write on public.appointments
  for insert with check (public.is_practitioner());

drop policy if exists tasks_practitioner_write on public.tasks;
create policy tasks_practitioner_write on public.tasks
  for insert with check (public.is_practitioner());

drop policy if exists alerts_practitioner_write on public.alerts;
create policy alerts_practitioner_write on public.alerts
  for insert with check (public.is_practitioner());
