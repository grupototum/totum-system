-- Corrige RLS de api_keys: masters (is_master=true) também podem gerenciar,
-- pois is_admin() retorna false para eles (master vem de profiles.is_master).
-- Antes: is_admin(uid) AND (org_match OR is_master)  ← master bloqueado
-- Depois: (is_admin(uid) OR is_master) AND (org_match OR is_master) ← master liberado
DROP POLICY IF EXISTS "Org admins manage api_keys" ON public.api_keys;

CREATE POLICY "Org admins manage api_keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (
    (
      public.is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_master = true)
    )
    AND (
      organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_master = true)
    )
  )
  WITH CHECK (
    (
      public.is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_master = true)
    )
    AND (
      organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_master = true)
    )
  );
