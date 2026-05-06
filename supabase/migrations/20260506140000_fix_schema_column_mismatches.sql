-- Fix 1: financial_entries: renomear 'amount' para 'value'
-- (todo o código Lovable usa .value, DB criou como amount)
ALTER TABLE public.financial_entries RENAME COLUMN amount TO value;

-- Fix 2: delivery_checklists: adicionar colunas que o código espera
-- (nova schema removeu essas colunas mas o código ainda as usa)
ALTER TABLE public.delivery_checklists
  ADD COLUMN IF NOT EXISTS fulfillment_pct  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period           text,
  ADD COLUMN IF NOT EXISTS completed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Fix 3: profiles: política de UPDATE para usuário editar o próprio perfil
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 4: resolve_organization_by_host: garantir acesso anônimo/autenticado
GRANT EXECUTE ON FUNCTION public.resolve_organization_by_host(text) TO anon, authenticated;

-- Fix 5: Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
