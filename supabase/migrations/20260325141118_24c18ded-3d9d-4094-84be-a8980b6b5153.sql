
-- Drop existing permissive SELECT policies on financial_entries and replace with permission-based ones
DROP POLICY IF EXISTS "Auth read financial_entries" ON public.financial_entries;

CREATE POLICY "Permission read financial_entries"
ON public.financial_entries
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'fin_geral.visualizar')
  OR has_permission(auth.uid(), 'fin_pagar.visualizar')
  OR has_permission(auth.uid(), 'fin_receber.visualizar')
);

-- Restrict contract value visibility: users need contract permission to see contracts
DROP POLICY IF EXISTS "Auth read contracts" ON public.contracts;

CREATE POLICY "Permission read contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'ctr_geral.visualizar')
);

-- Create access logging function for sensitive data access attempts
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  _user_id uuid,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _action text DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, detail)
  VALUES (_user_id, _action, _entity_type, _entity_id, 'Sensitive data access');
END;
$$;
