-- =============================================================
-- Permet aux patients d'insérer une alerte les concernant
-- (signalement type "j'ai encore mal", "j'ai pas pu prendre RDV").
-- L'alerte remonte ensuite côté praticien.
-- =============================================================

drop policy if exists alerts_patient_self_write on public.alerts;
create policy alerts_patient_self_write on public.alerts
  for insert
  with check (patient_id = auth.uid());
