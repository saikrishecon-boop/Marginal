CREATE TABLE public.ai_provider_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('lovable','openai','anthropic','google','xai','groq','openrouter','mistral','deepseek','custom')),
  label text not null,
  api_key text not null,
  base_url text,
  model text not null,
  is_active boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE UNIQUE INDEX ai_provider_keys_single_active ON public.ai_provider_keys ((is_active)) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_provider_keys TO authenticated;
GRANT ALL ON public.ai_provider_keys TO service_role;

ALTER TABLE public.ai_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage AI provider keys"
ON public.ai_provider_keys FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;