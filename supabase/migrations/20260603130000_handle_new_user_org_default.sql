-- ============================================================
-- Corrige handle_new_user: signups sem organization_id no metadata
-- (ex.: login social via Google) deixavam de receber organização,
-- ficando com organization_id = NULL e travados pelo filtro multi-tenant.
--
-- Agora caem na org padrão Totum com status 'pendente' (aprovação do
-- admin em /usuarios). Signups com organization_id explícito seguem 'ativo'.
-- O ON CONFLICT preserva a org já existente em vez de sobrescrevê-la.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org uuid;
  v_status text;
BEGIN
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    v_org := (NEW.raw_user_meta_data->>'organization_id')::uuid;
    v_status := 'ativo';
  ELSE
    -- Org padrão (Totum). Pendente para aprovação manual do admin.
    v_org := 'c3d8f5a2-1b4e-4f9c-8e7d-6a5b2c1d0e9f';
    v_status := 'pendente';
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name, status, organization_id, client_id, is_master)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    v_status,
    v_org,
    COALESCE(NEW.raw_user_meta_data->>'client_id', 'totum'),
    COALESCE((NEW.raw_user_meta_data->>'is_master')::BOOLEAN, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    organization_id = COALESCE(public.profiles.organization_id, EXCLUDED.organization_id),
    client_id = COALESCE(EXCLUDED.client_id, public.profiles.client_id);

  IF v_status = 'pendente' THEN
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    SELECT p.user_id,
      'Novo cadastro pendente',
      'O usuário ' || COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email
      ) || ' aguarda aprovação.',
      'warning',
      'profile',
      NEW.id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'admin'
      AND p.status = 'ativo';
  END IF;

  RETURN NEW;
END;
$function$;
