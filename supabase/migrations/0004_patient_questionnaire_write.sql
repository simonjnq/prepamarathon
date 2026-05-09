-- =============================================================
-- Permet aux patients de modifier leurs propres réponses au questionnaire
-- (et d'en ajouter si besoin futur).
-- =============================================================

drop policy if exists qresp_patient_update on public.questionnaire_responses;
create policy qresp_patient_update on public.questionnaire_responses
  for update
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists qresp_patient_insert on public.questionnaire_responses;
create policy qresp_patient_insert on public.questionnaire_responses
  for insert
  with check (patient_id = auth.uid());
