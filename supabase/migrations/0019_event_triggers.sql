-- =============================================================
-- Triggers événementiels
--   D2) signalement patient sévère → aggrave les douleurs actives
--   D4) pain_point créé/modifié → met à jour le questionnaire
--   D5) nouvel assignment praticien → alerte info pour le patient
-- D3 (badge 'Patient à risque') est purement UI, pas de migration.
-- =============================================================

-- ============================================================
-- D2 — patient signale → escalade des pain_points
-- ============================================================
create or replace function public.trg_patient_alert_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (NEW.source = 'patient' and NEW.severity = 'urgent') then
    update public.pain_points
      set severity = least(severity + 1, 10)
      where patient_id = NEW.patient_id and resolved_on is null;
  end if;
  return NEW;
end $$;

drop trigger if exists patient_alert_escalation on public.alerts;
create trigger patient_alert_escalation
  after insert on public.alerts
  for each row execute function public.trg_patient_alert_escalation();

-- ============================================================
-- D4 — pain_point écrit → met à jour questionnaire_responses pain_current
-- ============================================================
create or replace function public.trg_pain_to_questionnaire()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zones text;
  v_patient uuid;
begin
  v_patient := coalesce(NEW.patient_id, OLD.patient_id);

  select string_agg(body_zone || ' (' || severity || '/10)', ', ')
    into v_zones
    from public.pain_points
    where patient_id = v_patient and resolved_on is null;

  update public.questionnaire_responses
    set answer_text = coalesce(v_zones, 'Non'),
        answered_at = now()
    where patient_id = v_patient and question_key = 'pain_current';
  return NEW;
end $$;

drop trigger if exists pain_to_questionnaire on public.pain_points;
create trigger pain_to_questionnaire
  after insert or update or delete on public.pain_points
  for each row execute function public.trg_pain_to_questionnaire();

-- ============================================================
-- D5 — nouvel assignment praticien → alerte info pour le patient
-- ============================================================
create or replace function public.trg_assignment_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_last text;
  v_specialty text;
begin
  if (NEW.active = true) then
    select p.first_name, p.last_name, pr.specialty
      into v_first, v_last, v_specialty
      from public.profiles p
      left join public.practitioners pr on pr.id = p.id
      where p.id = NEW.practitioner_id;

    insert into public.alerts (patient_id, severity, title, message, source)
    values (
      NEW.patient_id,
      'info',
      'Nouveau praticien dans votre équipe',
      coalesce(v_first || ' ' || v_last, 'Un praticien') ||
        ' vient de rejoindre votre équipe de soins.',
      'auto_new_assignment'
    );
  end if;
  return NEW;
end $$;

drop trigger if exists assignment_notify on public.practitioner_assignments;
create trigger assignment_notify
  after insert on public.practitioner_assignments
  for each row execute function public.trg_assignment_notify();
