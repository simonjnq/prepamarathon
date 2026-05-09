-- =============================================================
-- Permet aux praticiens de créer des étapes de parcours et des
-- assignments (utile quand on ajoute un RDV qui doit aussi
-- apparaître dans la timeline du patient).
-- =============================================================

drop policy if exists steps_practitioner_write on public.journey_steps;
create policy steps_practitioner_write on public.journey_steps
  for insert
  with check (public.is_practitioner());

drop policy if exists steps_practitioner_update on public.journey_steps;
create policy steps_practitioner_update on public.journey_steps
  for update
  using (public.is_practitioner())
  with check (public.is_practitioner());

drop policy if exists assignments_practitioner_write on public.practitioner_assignments;
create policy assignments_practitioner_write on public.practitioner_assignments
  for insert
  with check (public.is_practitioner());
