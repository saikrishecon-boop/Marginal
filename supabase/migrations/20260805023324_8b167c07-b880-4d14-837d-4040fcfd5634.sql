CREATE TABLE public.custom_diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  section text NOT NULL DEFAULT 'Microeconomics',
  topic text NOT NULL DEFAULT 'Custom',
  level text NOT NULL DEFAULT 'AS & A Level',
  represents text NOT NULL DEFAULT '',
  why_used text NOT NULL DEFAULT '',
  when_to_draw text NOT NULL DEFAULT '',
  how_to_read text[] NOT NULL DEFAULT '{}',
  labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  mistakes text[] NOT NULL DEFAULT '{}',
  tips text[] NOT NULL DEFAULT '{}',
  real_world text[] NOT NULL DEFAULT '{}',
  related text[] NOT NULL DEFAULT '{}',
  exam_questions text[] NOT NULL DEFAULT '{}',
  spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_diagrams TO authenticated;
GRANT ALL ON public.custom_diagrams TO service_role;

ALTER TABLE public.custom_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_diagrams_read" ON public.custom_diagrams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_diagrams_admin_write" ON public.custom_diagrams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER custom_diagrams_touch BEFORE UPDATE ON public.custom_diagrams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();