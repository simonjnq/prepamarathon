-- =============================================================
-- Verrouillage RGPD / secret professionnel
--
-- Avant : tout praticien voyait toutes les données de tous les
-- patients (is_practitioner() ouvert).
-- Après : un praticien ne voit / n'écrit que sur les patients
-- auxquels il est ACTIVEMENT assigné (table practitioner_assignments
-- avec active = true). Les patients restent confinés à leurs
-- propres données.
-- =============================================================

-- Helper sécurisé : "est-ce que l'utilisateur courant est assigné
-- activement à ce patient ?"
create or replace function public.is_assigned_to(p_patient uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.practitioner_assignments
    where practitioner_id = auth.uid()
      and patient_id = p_patient
      and active = true
  )
  or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper de cast sûr (utilisé pour le path Storage)
create or replace function public.try_uuid(s text)
returns uuid
language plpgsql
immutable
as $$
begin
  return s::uuid;
exception when others then
  return null;
end $$;

-- =============================================================
-- PROFILES : on autorise toujours l'annuaire des praticiens (pour
-- pouvoir inviter / voir l'équipe), mais un patient n'est visible
-- que par lui-même + ses praticiens assignés.
-- =============================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or role = 'practitioner'
    or (role = 'patient' and public.is_assigned_to(id))
  );

-- =============================================================
-- PATIENTS
-- =============================================================
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
  for select using (
    id = auth.uid() or public.is_assigned_to(id)
  );

-- =============================================================
-- JOURNEYS
-- =============================================================
drop policy if exists journeys_select on public.journeys;
create policy journeys_select on public.journeys
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

-- =============================================================
-- JOURNEY STEPS (via journey_id)
-- =============================================================
drop policy if exists steps_select on public.journey_steps;
create policy steps_select on public.journey_steps
  for select using (
    exists (
      select 1 from public.journeys j
      where j.id = journey_steps.journey_id
        and (j.patient_id = auth.uid() or public.is_assigned_to(j.patient_id))
    )
  );

drop policy if exists steps_practitioner_write on public.journey_steps;
create policy steps_practitioner_write on public.journey_steps
  for insert
  with check (
    public.is_practitioner()
    and exists (
      select 1 from public.journeys j
      where j.id = journey_steps.journey_id
        and public.is_assigned_to(j.patient_id)
    )
  );

drop policy if exists steps_practitioner_update on public.journey_steps;
create policy steps_practitioner_update on public.journey_steps
  for update using (
    public.is_practitioner()
    and exists (
      select 1 from public.journeys j
      where j.id = journey_steps.journey_id
        and public.is_assigned_to(j.patient_id)
    )
  )
  with check (
    public.is_practitioner()
    and exists (
      select 1 from public.journeys j
      where j.id = journey_steps.journey_id
        and public.is_assigned_to(j.patient_id)
    )
  );

-- =============================================================
-- PRACTITIONER ASSIGNMENTS
-- =============================================================
drop policy if exists assignments_select on public.practitioner_assignments;
create policy assignments_select on public.practitioner_assignments
  for select using (
    patient_id = auth.uid()
    or practitioner_id = auth.uid()
    or public.is_assigned_to(patient_id)
  );

drop policy if exists assignments_practitioner_write on public.practitioner_assignments;
create policy assignments_practitioner_write on public.practitioner_assignments
  for insert
  with check (
    public.is_practitioner()
    and public.is_assigned_to(patient_id)
  );

drop policy if exists assignments_practitioner_update on public.practitioner_assignments;
create policy assignments_practitioner_update on public.practitioner_assignments
  for update
  using (
    practitioner_id = auth.uid() or public.is_assigned_to(patient_id)
  )
  with check (
    practitioner_id = auth.uid() or public.is_assigned_to(patient_id)
  );

-- =============================================================
-- APPOINTMENTS
-- =============================================================
drop policy if exists appts_select on public.appointments;
create policy appts_select on public.appointments
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

drop policy if exists appts_practitioner_write on public.appointments;
create policy appts_practitioner_write on public.appointments
  for insert
  with check (
    practitioner_id = auth.uid()
    and public.is_practitioner()
    and public.is_assigned_to(patient_id)
  );

drop policy if exists appts_practitioner_update on public.appointments;
create policy appts_practitioner_update on public.appointments
  for update
  using (public.is_assigned_to(patient_id))
  with check (public.is_assigned_to(patient_id));

-- =============================================================
-- NOTES
-- =============================================================
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

drop policy if exists notes_practitioner_write on public.notes;
create policy notes_practitioner_write on public.notes
  for insert
  with check (
    practitioner_id = auth.uid()
    and public.is_practitioner()
    and public.is_assigned_to(patient_id)
  );

drop policy if exists notes_author_update on public.notes;
create policy notes_author_update on public.notes
  for update
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

-- =============================================================
-- TASKS
-- =============================================================
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

drop policy if exists tasks_practitioner_write on public.tasks;
create policy tasks_practitioner_write on public.tasks
  for insert
  with check (
    public.is_practitioner() and public.is_assigned_to(patient_id)
  );

-- patient_update existante reste valable.

-- =============================================================
-- ALERTS
-- =============================================================
drop policy if exists alerts_select on public.alerts;
create policy alerts_select on public.alerts
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

drop policy if exists alerts_practitioner_write on public.alerts;
create policy alerts_practitioner_write on public.alerts
  for insert
  with check (
    public.is_practitioner() and public.is_assigned_to(patient_id)
  );

-- alerts_patient_self_write existante reste valable.

drop policy if exists alerts_practitioner_update on public.alerts;
create policy alerts_practitioner_update on public.alerts
  for update
  using (public.is_assigned_to(patient_id))
  with check (public.is_assigned_to(patient_id));

-- =============================================================
-- PAIN POINTS
-- =============================================================
drop policy if exists pain_select on public.pain_points;
create policy pain_select on public.pain_points
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

-- =============================================================
-- DOCUMENTS (incl. appointment_id ajouté plus bas)
-- =============================================================
drop policy if exists docs_select on public.documents;
create policy docs_select on public.documents
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

drop policy if exists docs_practitioner_insert on public.documents;
create policy docs_practitioner_insert on public.documents
  for insert
  with check (
    public.is_practitioner() and public.is_assigned_to(patient_id)
  );

-- docs_patient_insert reste valable (patient_id = auth.uid()).

-- =============================================================
-- QUESTIONNAIRE RESPONSES
-- =============================================================
drop policy if exists qresp_select on public.questionnaire_responses;
create policy qresp_select on public.questionnaire_responses
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

-- =============================================================
-- REMINDERS
-- =============================================================
drop policy if exists reminders_select on public.reminders;
create policy reminders_select on public.reminders
  for select using (
    patient_id = auth.uid() or public.is_assigned_to(patient_id)
  );

drop policy if exists reminders_practitioner_write on public.reminders;
create policy reminders_practitioner_write on public.reminders
  for insert
  with check (
    public.is_practitioner() and public.is_assigned_to(patient_id)
  );

drop policy if exists reminders_practitioner_update on public.reminders;
create policy reminders_practitioner_update on public.reminders
  for update
  using (public.is_assigned_to(patient_id))
  with check (public.is_assigned_to(patient_id));

-- =============================================================
-- STORAGE — restreindre l'upload aux praticiens assignés à ce patient
-- (le path doit commencer par <patient_id> qui sert de cloison)
-- =============================================================
drop policy if exists "documents_upload" on storage.objects;
create policy "documents_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and public.is_practitioner()
    and public.is_assigned_to(public.try_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "documents_delete" on storage.objects;
create policy "documents_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and public.is_practitioner()
    and public.is_assigned_to(public.try_uuid((storage.foldername(name))[1]))
  );

-- documents_upload_patient existante reste valable (path commence
-- par auth.uid()).

-- Lecture du Storage : on garde le bucket public pour la démo car
-- les URLs intègrent un UUID aléatoire non énumérable. En prod
-- réelle (HDS), basculer sur :
--   update storage.buckets set public = false where id = 'documents';
-- + générer des signed URLs (storage.from(...).createSignedUrl(path, 3600)).

-- =============================================================
-- PER-APPOINTMENT DOCS / NOTES : ajout d'une FK appointment_id
-- (nullable) sur documents pour rattacher un fichier à un RDV.
-- notes.appointment_id existe déjà.
-- =============================================================
alter table public.documents
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null;
create index if not exists idx_documents_appointment on public.documents(appointment_id);
