-- =============================================================
-- Verrouillage 'propriétaire seul' :
--   - Un RDV ne peut être modifié (statut, compte rendu) que par
--     le praticien qui le tient (practitioner_id = auth.uid()).
--   - Un document ne peut être modifié/supprimé que par celui qui
--     l'a uploadé (uploaded_by = auth.uid()).
-- Les notes (notes_author_update) sont déjà verrouillées à l'auteur.
-- =============================================================

drop policy if exists appts_practitioner_update on public.appointments;
create policy appts_practitioner_update on public.appointments
  for update
  using (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());

drop policy if exists docs_uploader_update on public.documents;
create policy docs_uploader_update on public.documents
  for update
  using (uploaded_by = auth.uid())
  with check (uploaded_by = auth.uid());

drop policy if exists docs_uploader_delete on public.documents;
create policy docs_uploader_delete on public.documents
  for delete
  using (uploaded_by = auth.uid());
