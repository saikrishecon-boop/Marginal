-- Search respects normal access rules (chunks are already readable by signed-in users)
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(3072),
  match_count INT DEFAULT 8,
  filter_doc_types public.doc_type[] DEFAULT NULL,
  filter_topic_id UUID DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  doc_type public.doc_type,
  heading TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT
    c.id, d.id, d.title, d.doc_type, c.heading, c.content,
    1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072))
  FROM public.document_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND d.status = 'ready'
    AND (filter_doc_types IS NULL OR d.doc_type = ANY(filter_doc_types))
    AND (filter_topic_id IS NULL OR c.topic_id = filter_topic_id OR d.topic_id = filter_topic_id)
  ORDER BY c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO authenticated, service_role;