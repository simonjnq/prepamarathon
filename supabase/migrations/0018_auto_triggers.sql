-- =============================================================
-- Automatisations niveau base de données :
--   A1) journey_steps → recompute auto journeys.progress_pct
--   A4) pain_point sev≥7 → alerte 'urgent' auto
--   D1) note praticien avec mot-clé urgence → alerte 'urgent' auto
--
-- Toutes les fonctions sont SECURITY DEFINER → bypass RLS.
-- =============================================================

-- ============================================================
-- A1 — progress_pct auto
-- ============================================================
create or replace function public.recompute_journey_progress(p_journey_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_done int;
begin
  select count(*) into v_total
    from public.journey_steps where journey_id = p_journey_id;
  select count(*) into v_done
    from public.journey_steps
    where journey_id = p_journey_id and status = 'done';

  update public.journeys
    set progress_pct = case
      when v_total = 0 then 0
      else round(100.0 * v_done / v_total)::int
    end
    where id = p_journey_id;
end $$;

create or replace function public.trg_journey_steps_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    perform public.recompute_journey_progress(NEW.journey_id);
  elsif (TG_OP = 'UPDATE') then
    if (OLD.status is distinct from NEW.status) then
      perform public.recompute_journey_progress(NEW.journey_id);
    end if;
    if (OLD.journey_id is distinct from NEW.journey_id) then
      perform public.recompute_journey_progress(OLD.journey_id);
    end if;
  elsif (TG_OP = 'DELETE') then
    perform public.recompute_journey_progress(OLD.journey_id);
  end if;
  return null;
end $$;

drop trigger if exists journey_steps_progress on public.journey_steps;
create trigger journey_steps_progress
  after insert or update or delete on public.journey_steps
  for each row execute function public.trg_journey_steps_progress();

-- Recompute initial pour tous les parcours
do $$
declare j record;
begin
  for j in select id from public.journeys loop
    perform public.recompute_journey_progress(j.id);
  end loop;
end $$;

-- ============================================================
-- A4 — pain_point sévérité ≥ 7 → alerte 'urgent' auto
-- ============================================================
create or replace function public.trg_pain_to_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (NEW.severity >= 7 and NEW.resolved_on is null) then
    insert into public.alerts (patient_id, severity, title, message, source)
    values (
      NEW.patient_id,
      'urgent',
      'Douleur sévère signalée : ' || NEW.body_zone,
      coalesce(NEW.description, '') ||
        ' (intensité ' || NEW.severity || '/10)',
      'auto_pain_severity'
    );
  end if;
  return NEW;
end $$;

drop trigger if exists pain_to_alert on public.pain_points;
create trigger pain_to_alert
  after insert on public.pain_points
  for each row execute function public.trg_pain_to_alert();

-- ============================================================
-- D1 — note avec mot-clé d'urgence → alerte 'urgent' auto
-- ============================================================
create or replace function public.trg_note_keyword_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lower text;
begin
  v_lower := lower(NEW.content);
  if (
    v_lower ~ '\murgent\M'
    or v_lower like '%en urgence%'
    or v_lower like '%arrêt immédiat%'
    or v_lower like '%arret immediat%'
    or v_lower like '%immédiatement%'
    or v_lower like '%immediatement%'
    or v_lower ~ '\mstop\M'
  ) then
    insert into public.alerts (patient_id, severity, title, message, source)
    values (
      NEW.patient_id,
      'urgent',
      'Note praticien — signal urgent détecté',
      left(NEW.content, 200),
      'auto_note_keyword'
    );
  end if;
  return NEW;
end $$;

drop trigger if exists note_keyword_alert on public.notes;
create trigger note_keyword_alert
  after insert on public.notes
  for each row execute function public.trg_note_keyword_alert();
