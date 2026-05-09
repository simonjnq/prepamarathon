-- =============================================================
-- Active la diffusion realtime sur les tables qui changent souvent
-- pendant la démo (signalements patient, tâches, RDV, notes, étapes,
-- assignments).
-- =============================================================

do $$ begin
  alter publication supabase_realtime add table public.alerts;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.appointments;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notes;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.journey_steps;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.practitioner_assignments;
exception when duplicate_object then null; end $$;
