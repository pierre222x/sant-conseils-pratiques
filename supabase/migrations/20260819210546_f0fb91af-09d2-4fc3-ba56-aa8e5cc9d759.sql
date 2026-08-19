CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  age INTEGER,
  antecedents TEXT,
  allergies TEXT,
  medicaments TEXT,
  consent_save BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  symptomes TEXT NOT NULL,
  duree TEXT,
  intensite INTEGER,
  evolution TEXT,
  age INTEGER,
  contexte JSONB NOT NULL DEFAULT '{}'::jsonb,
  resume TEXT,
  urgence TEXT NOT NULL DEFAULT 'faible',
  causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  conseils JSONB NOT NULL DEFAULT '[]'::jsonb,
  professionnel TEXT,
  signes_alerte JSONB NOT NULL DEFAULT '[]'::jsonb,
  fiable BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluations_own" ON public.evaluations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX evaluations_user_created_idx ON public.evaluations (user_id, created_at DESC);

CREATE TABLE public.analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.analysis_usage TO authenticated;
GRANT ALL ON public.analysis_usage TO service_role;
ALTER TABLE public.analysis_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analysis_usage_own" ON public.analysis_usage FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX analysis_usage_user_created_idx ON public.analysis_usage (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();