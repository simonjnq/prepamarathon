-- =============================================================
-- Table reminders : programmation de relances multicanales
-- (WhatsApp, SMS, email, notification in-app). En démo on ne fait
-- pas réellement l'envoi : on simule via le statut.
-- =============================================================

do $$ begin
  create type reminder_channel as enum ('whatsapp', 'sms', 'email', 'notification');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reminder_status as enum ('pending', 'sent', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  channel reminder_channel not null,
  message text not null,
  scheduled_at timestamptz not null,
  status reminder_status not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_reminders_patient on public.reminders(patient_id);
create index if not exists idx_reminders_pending on public.reminders(scheduled_at) where status = 'pending';

alter table public.reminders enable row level security;

drop policy if exists reminders_select on public.reminders;
create policy reminders_select on public.reminders
  for select using (patient_id = auth.uid() or public.is_practitioner());

drop policy if exists reminders_practitioner_write on public.reminders;
create policy reminders_practitioner_write on public.reminders
  for insert with check (public.is_practitioner());

drop policy if exists reminders_practitioner_update on public.reminders;
create policy reminders_practitioner_update on public.reminders
  for update
  using (public.is_practitioner())
  with check (public.is_practitioner());

do $$ begin
  alter publication supabase_realtime add table public.reminders;
exception when duplicate_object then null; end $$;
