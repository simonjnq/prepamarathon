-- =============================================================
-- Fix : autoriser les patients à voir les profils des praticiens
-- (sinon les joins appointments→practitioners→profiles renvoient null
-- côté UI patient à cause des RLS).
-- =============================================================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.is_practitioner()
    or role = 'practitioner'
  );
