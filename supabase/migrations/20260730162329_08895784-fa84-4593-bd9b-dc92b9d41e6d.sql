CREATE EXTENSION IF NOT EXISTS vector;

-- ============ roles ============
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  school TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('teacher', 'admin')
  );
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ taxonomy ============
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'AS/A Level',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read" ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  paper TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_id, code)
);
GRANT SELECT ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_read" ON public.units FOR SELECT TO authenticated USING (true);

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  syllabus_ref TEXT,
  learning_outcomes TEXT[] NOT NULL DEFAULT '{}',
  difficulty INT NOT NULL DEFAULT 2,
  is_extension BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_read" ON public.topics FOR SELECT TO authenticated USING (true);
CREATE INDEX topics_unit_idx ON public.topics(unit_id);
CREATE INDEX topics_parent_idx ON public.topics(parent_id);

-- ============ knowledge base ============
CREATE TYPE public.doc_type AS ENUM (
  'coursebook', 'syllabus', 'mark_scheme', 'past_paper', 'examiner_report', 'notes', 'other'
);
CREATE TYPE public.ingest_status AS ENUM ('pending', 'processing', 'ready', 'failed');

CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  doc_type public.doc_type NOT NULL DEFAULT 'other',
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  source_name TEXT,
  storage_path TEXT,
  exam_series TEXT,
  version INT NOT NULL DEFAULT 1,
  content_hash TEXT,
  char_count INT NOT NULL DEFAULT 0,
  chunk_count INT NOT NULL DEFAULT 0,
  status public.ingest_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kd_read" ON public.knowledge_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "kd_write_staff" ON public.knowledge_documents FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX kd_hash_idx ON public.knowledge_documents(content_hash);
CREATE TRIGGER kd_touch BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  heading TEXT,
  token_estimate INT NOT NULL DEFAULT 0,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  embedding vector(3072),
  model_version TEXT NOT NULL DEFAULT 'google/gemini-embedding-2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_read" ON public.document_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "dc_write_staff" ON public.document_chunks FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX dc_doc_idx ON public.document_chunks(document_id);
CREATE INDEX dc_embedding_idx ON public.document_chunks
  USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

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
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
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

-- ============ calibration anchors ============
CREATE TABLE public.calibration_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  essay_text TEXT NOT NULL,
  mark INT NOT NULL,
  max_mark INT NOT NULL DEFAULT 12,
  band_label TEXT NOT NULL DEFAULT 'top',
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calibration_anchors TO authenticated;
GRANT ALL ON public.calibration_anchors TO service_role;
ALTER TABLE public.calibration_anchors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anchors_read_staff" ON public.calibration_anchors FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "anchors_write_staff" ON public.calibration_anchors FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ essays ============
CREATE TABLE public.essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  max_mark INT NOT NULL DEFAULT 12,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  latest_mark INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.essays TO authenticated;
GRANT ALL ON public.essays TO service_role;
ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "essays_own" ON public.essays FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "essays_read_staff" ON public.essays FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER essays_touch BEFORE UPDATE ON public.essays
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.essay_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  essay_text TEXT NOT NULL,
  grading JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_mark INT,
  ao1_awarded INT,
  ao2_awarded INT,
  ao3_awarded INT,
  confidence NUMERIC,
  audited BOOLEAN NOT NULL DEFAULT false,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (essay_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.essay_versions TO authenticated;
GRANT ALL ON public.essay_versions TO service_role;
ALTER TABLE public.essay_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev_own" ON public.essay_versions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ev_read_staff" ON public.essay_versions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE INDEX ev_essay_idx ON public.essay_versions(essay_id);

-- ============ ai usage ============
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  latency_ms INT,
  ok BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_read_admin" ON public.ai_usage_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ seed taxonomy (Cambridge 9708) ============
INSERT INTO public.subjects (code, name, level) VALUES ('9708', 'Economics', 'AS/A Level');

INSERT INTO public.units (subject_id, code, name, paper, position)
SELECT s.id, v.code, v.name, v.paper, v.position FROM public.subjects s,
(VALUES
  ('1', 'Basic economic ideas and resource allocation', 'AS', 1),
  ('2', 'The price system and the microeconomy', 'AS', 2),
  ('3', 'Government microeconomic intervention', 'AS', 3),
  ('4', 'The macroeconomy', 'AS', 4),
  ('5', 'Government macroeconomic intervention', 'AS', 5),
  ('6', 'The price system and the microeconomy (A Level)', 'A2', 6),
  ('7', 'Government microeconomic intervention (A Level)', 'A2', 7),
  ('8', 'The macroeconomy (A Level)', 'A2', 8),
  ('9', 'Government macroeconomic intervention (A Level)', 'A2', 9)
) AS v(code, name, paper, position)
WHERE s.code = '9708';

INSERT INTO public.topics (unit_id, code, name, syllabus_ref, difficulty, position)
SELECT u.id, v.code, v.name, v.ref, v.difficulty, v.position
FROM public.units u
JOIN (VALUES
  ('1', '1.1', 'Scarcity, choice and opportunity cost', '1.1', 1, 1),
  ('1', '1.2', 'Economic methodology', '1.2', 1, 2),
  ('1', '1.3', 'Factors of production', '1.3', 1, 3),
  ('1', '1.4', 'Resource allocation in different economic systems', '1.4', 2, 4),
  ('1', '1.5', 'Production possibility curves', '1.5', 2, 5),
  ('1', '1.6', 'Classification of goods and services', '1.6', 2, 6),
  ('2', '2.1', 'Demand and supply curves', '2.1', 1, 1),
  ('2', '2.2', 'Price elasticity, income elasticity and cross elasticity of demand', '2.2', 3, 2),
  ('2', '2.3', 'Price elasticity of supply', '2.3', 2, 3),
  ('2', '2.4', 'The interaction of demand and supply', '2.4', 2, 4),
  ('2', '2.5', 'Consumer and producer surplus', '2.5', 2, 5),
  ('3', '3.1', 'Reasons for government intervention in markets', '3.1', 2, 1),
  ('3', '3.2', 'Methods and effects of government intervention in markets', '3.2', 3, 2),
  ('3', '3.3', 'Addressing income and wealth inequality', '3.3', 3, 3),
  ('4', '4.1', 'National income statistics', '4.1', 2, 1),
  ('4', '4.2', 'Introduction to the circular flow of income', '4.2', 2, 2),
  ('4', '4.3', 'Aggregate demand and aggregate supply analysis', '4.3', 3, 3),
  ('4', '4.4', 'Economic growth', '4.4', 2, 4),
  ('4', '4.5', 'Unemployment', '4.5', 2, 5),
  ('4', '4.6', 'Price stability', '4.6', 3, 6),
  ('5', '5.1', 'Government macroeconomic policy objectives', '5.1', 2, 1),
  ('5', '5.2', 'Fiscal policy', '5.2', 3, 2),
  ('5', '5.3', 'Monetary policy', '5.3', 3, 3),
  ('5', '5.4', 'Supply-side policy', '5.4', 3, 4),
  ('6', '6.1', 'Utility', '6.1', 3, 1),
  ('6', '6.2', 'Indifference curves and budget lines', '6.2', 4, 2),
  ('6', '6.3', 'Efficiency and market failure', '6.3', 4, 3),
  ('6', '6.4', 'Private costs and benefits, externalities and social costs and benefits', '6.4', 3, 4),
  ('6', '6.5', 'Types of cost, revenue and profit, short-run and long-run production', '6.5', 4, 5),
  ('6', '6.6', 'Different market structures', '6.6', 4, 6),
  ('6', '6.7', 'Growth and survival of firms', '6.7', 3, 7),
  ('6', '6.8', 'Differing objectives and policies of firms', '6.8', 3, 8),
  ('7', '7.1', 'Government policies to achieve efficient resource allocation and correct market failure', '7.1', 4, 1),
  ('7', '7.2', 'Equity and redistribution of income and wealth', '7.2', 3, 2),
  ('7', '7.3', 'Labour market forces and government intervention', '7.3', 4, 3),
  ('8', '8.1', 'The circular flow of income', '8.1', 3, 1),
  ('8', '8.2', 'Economic growth and sustainability', '8.2', 3, 2),
  ('8', '8.3', 'Employment and unemployment', '8.3', 3, 3),
  ('8', '8.4', 'Money and banking', '8.4', 4, 4),
  ('9', '9.1', 'Government macroeconomic policy objectives (A Level)', '9.1', 3, 1),
  ('9', '9.2', 'Links between macroeconomic problems and their interrelatedness', '9.2', 4, 2),
  ('9', '9.3', 'Effectiveness of policy options to meet all macroeconomic objectives', '9.3', 4, 3)
) AS v(unit_code, code, name, ref, difficulty, position) ON u.code = v.unit_code;