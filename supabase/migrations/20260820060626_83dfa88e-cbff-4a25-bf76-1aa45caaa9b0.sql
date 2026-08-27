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