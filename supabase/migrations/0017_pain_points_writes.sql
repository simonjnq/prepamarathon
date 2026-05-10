-- =============================================================
-- Permet aux praticiens assignés de créer des pain_points pour
-- leurs patients (utilisé par la création auto via IA depuis une
-- note).
-- =============================================================

drop policy if exists pain_practitioner_write on public.pain_points;
create policy pain_practitioner_write on public.pain_points
  for insert
  with check (
    public.is_practitioner() and public.is_assigned_to(patient_id)
  );

drop policy if exists pain_practitioner_update on public.pain_points;
create policy pain_practitioner_update on public.pain_points
  for update
  using (public.is_assigned_to(patient_id))
  with check (public.is_assigned_to(patient_id));
