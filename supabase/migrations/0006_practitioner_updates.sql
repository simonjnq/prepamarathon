-- =============================================================
-- Permet aux praticiens de modifier les statuts de RDV, leurs propres
-- notes, et de modifier/désactiver les assignments.
-- =============================================================

drop policy if exists appts_practitioner_update on public.appointments;
create policy appts_practitioner_update on public.appointments
  for update
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists notes_author_update on public.notes;
create policy notes_author_update on public.notes
  for update
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

drop policy if exists assignments_practitioner_update on public.practitioner_assignments;
create policy assignments_practitioner_update on public.practitioner_assignments
  for update
  using (public.is_practitioner())
  with check (public.is_practitioner());
