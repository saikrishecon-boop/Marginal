CREATE TABLE public.mcq_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'AS Level Paper 1 practice',
  topic text,
  level text NOT NULL DEFAULT 'as',
  status text NOT NULL DEFAULT 'building',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  total integer NOT NULL DEFAULT 30,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcq_attempts TO authenticated;
GRANT ALL ON public.mcq_attempts TO service_role;

ALTER TABLE public.mcq_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY mcq_own ON public.mcq_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY mcq_read_staff ON public.mcq_attempts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER mcq_attempts_touch BEFORE UPDATE ON public.mcq_attempts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX mcq_attempts_user_created_idx ON public.mcq_attempts (user_id, created_at DESC);