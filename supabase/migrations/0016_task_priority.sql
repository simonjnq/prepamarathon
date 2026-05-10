-- =============================================================
-- Priorité sur les tâches : un patient avec 8 tâches en cours doit
-- distinguer 'ECG préalable' de 'bien dormir'.
-- =============================================================

do $$ begin
  create type task_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

alter table public.tasks
  add column if not exists priority task_priority not null default 'normal';

-- Heuristique : tâches avec mots-clés cliniques élevés (RDV, prescription,
-- examen) → high ; tâches contenant "stop" "repos" "douleur" → urgent.
update public.tasks set priority = 'urgent'
where status in ('pending', 'in_progress')
  and (lower(title) like '%stop%' or lower(title) like '%repos%course%'
       or lower(title) like '%douleur%' or lower(title) like '%glace%');

update public.tasks set priority = 'high'
where status in ('pending', 'in_progress')
  and priority = 'normal'
  and (lower(title) like '%rendez-vous%' or lower(title) like '%programmer%'
       or lower(title) like '%bilan%' or lower(title) like '%test%'
       or lower(title) like '%prise de sang%' or lower(title) like '%examen%');
