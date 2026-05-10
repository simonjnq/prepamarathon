-- =============================================================
-- 1. case_messages : fil de discussion praticien-praticien centré
--    sur un patient. Visible uniquement par les praticiens
--    assignés activement au patient.
-- 2. Permissions documents : praticien + patient peuvent insérer.
-- 3. Storage : autoriser le patient à uploader dans son propre
--    dossier (auth.uid()/...).
-- =============================================================

-- 1. CASE MESSAGES ---------------------------------------------------
create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_case_messages_patient
  on public.case_messages(patient_id, created_at);

alter table public.case_messages enable row level security;

drop policy if exists case_messages_select on public.case_messages;
create policy case_messages_select on public.case_messages
  for select
  using (
    public.is_practitioner()
    and exists (
      select 1 from public.practitioner_assignments
      where patient_id = case_messages.patient_id
        and practitioner_id = auth.uid()
        and active = true
    )
  );

drop policy if exists case_messages_insert on public.case_messages;
create policy case_messages_insert on public.case_messages
  for insert
  with check (
    sender_id = auth.uid()
    and public.is_practitioner()
    and exists (
      select 1 from public.practitioner_assignments
      where patient_id = case_messages.patient_id
        and practitioner_id = auth.uid()
        and active = true
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.case_messages;
exception when duplicate_object then null; end $$;

-- 2. DOCUMENTS — INSERT PATIENT + PRACTITIONER ----------------------
drop policy if exists docs_practitioner_insert on public.documents;
create policy docs_practitioner_insert on public.documents
  for insert
  with check (public.is_practitioner());

drop policy if exists docs_patient_insert on public.documents;
create policy docs_patient_insert on public.documents
  for insert
  with check (
    patient_id = auth.uid() and uploaded_by = auth.uid()
  );

-- 3. STORAGE — patient peut uploader dans son dossier --------------
drop policy if exists "documents_upload_patient" on storage.objects;
create policy "documents_upload_patient" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
