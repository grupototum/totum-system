-- ============================================================
-- API Keys — chaves de API por organização (REST v1)
-- Fase 1 da camada de API externa do Totum System.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,                       -- ex.: "totum_sk_a1b2c3d4" (visível na UI)
  key_hash TEXT NOT NULL UNIQUE,                  -- SHA-256 hex da chave completa
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[]  -- 'read' | 'write'
    CHECK (scopes <@ ARRAY['read','write']::TEXT[] AND array_length(scopes, 1) >= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Admins gerenciam as chaves da própria organização. Masters podem gerenciar qualquer org.
-- IMPORTANTE: o hook do front NUNCA seleciona key_hash (vide useApiKeys) — ele só fica exposto
-- a admins da própria org e, por ser SHA-256 sobre 128 bits de entropia, não é reversível.
DROP POLICY IF EXISTS "Org admins manage api_keys" ON public.api_keys;
CREATE POLICY "Org admins manage api_keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    AND (
      organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_master = true)
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND (
      organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_master = true)
    )
  );

-- updated_at trigger — garante a função padrão no schema public.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER set_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
