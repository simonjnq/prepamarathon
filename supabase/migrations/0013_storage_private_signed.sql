-- =============================================================
-- Bucket Storage 'documents' passé en PRIVÉ.
-- Avant : public + URLs persistées en clair → toute personne ayant
-- l'URL pouvait télécharger une ordonnance.
-- Après : bucket privé, lecture uniquement via signed URLs (1h),
-- générées server-side par les pages qui ont déjà fait l'autorisation
-- via RLS Postgres.
--
-- + Migration des URLs existantes : on extrait le path de chaque
--   file_url public pour ne stocker que le path. La colonne reste
--   appelée file_url pour compat (sémantique = path Storage).
-- =============================================================

-- Bucket privé
update storage.buckets set public = false where id = 'documents';

-- Lecture autorisée pour les utilisateurs assignés au patient ou pour
-- le patient lui-même. Le path commence par <patient_uuid>/...
drop policy if exists "documents_select" on storage.objects;
create policy "documents_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      -- Le patient lit ses propres docs (path = auth.uid()/...)
      (storage.foldername(name))[1] = auth.uid()::text
      -- OU un praticien assigné au patient désigné par le path
      or public.is_assigned_to(public.try_uuid((storage.foldername(name))[1]))
    )
  );

-- Migrer les URLs publiques existantes vers leur path Storage
update public.documents
set file_url = regexp_replace(file_url, '^.*?/object/public/documents/', '')
where file_url like '%/object/public/documents/%';

-- Pas de modif sur les autres policies storage (upload, delete) — déjà
-- restreintes en 0009/0011.
