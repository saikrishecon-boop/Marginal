-- Private knowledge bucket access rules
CREATE POLICY "knowledge_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'knowledge');

CREATE POLICY "knowledge_insert_staff"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'knowledge' AND public.is_staff(auth.uid()));

CREATE POLICY "knowledge_update_staff"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'knowledge' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'knowledge' AND public.is_staff(auth.uid()));

CREATE POLICY "knowledge_delete_staff"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'knowledge' AND public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS essays_user_updated_idx
  ON public.essays (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS essay_versions_essay_idx
  ON public.essay_versions (essay_id, version DESC);

CREATE INDEX IF NOT EXISTS document_chunks_document_idx
  ON public.document_chunks (document_id, chunk_index);