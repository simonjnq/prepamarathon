-- =============================================================
-- Bucket Storage 'documents' pour les vrais fichiers téléversés
-- (ordonnances, comptes rendus, examens). Public pour simplifier
-- la démo (URLs aléatoires non indexées).
-- =============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Praticiens : upload autorisé
drop policy if exists "documents_upload" on storage.objects;
create policy "documents_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.is_practitioner());

-- Praticiens : delete autorisé (correction d'erreur d'upload)
drop policy if exists "documents_delete" on storage.objects;
create policy "documents_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_practitioner());

-- Lecture publique (bucket public) : pas de policy SELECT nécessaire.
