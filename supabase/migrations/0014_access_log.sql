-- =============================================================
-- Journal d'audit (RGPD article 32 + secret professionnel) :
-- toute consultation d'un dossier patient est tracée. La trace est
-- visible par le patient lui-même et les praticiens assignés.
-- L'insertion se fait via une RPC security definer pour éviter de
-- multiplier les policies INSERT et garder le contrôle sur les
-- valeurs (actor_id forcé à auth.uid()).
-- =============================================================

create table if not exists public.access_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,
  action text not null,
  resource text,
  created_at timestamptz not null default now()
);
create index if not exists idx_access_log_patient
  on public.access_log(patient_id, created_at desc);
create index if not exists idx_access_log_actor
  on public.access_log(actor_id, created_at desc);

alter table public.access_log enable row level security;

drop policy if exists access_log_select on public.access_log;
create policy access_log_select on public.access_log
  for select using (
    actor_id = auth.uid()
    or patient_id = auth.uid()
    or public.is_assigned_to(patient_id)
  );

-- INSERT seulement via la RPC ci-dessous (security definer)
drop policy if exists access_log_insert on public.access_log;
-- Pas de policy d'insert direct : on passe par la RPC.

create or replace function public.log_access(
  p_patient_id uuid,
  p_action text,
  p_resource text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.access_log (actor_id, patient_id, action, resource)
  values (auth.uid(), p_patient_id, p_action, p_resource);
end $$;

-- L'utilisateur authentifié peut appeler la RPC
grant execute on function public.log_access(uuid, text, text) to authenticated;
