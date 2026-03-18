
-- Add 'pendente' to user_status enum
ALTER TYPE public.user_status ADD VALUE IF NOT EXISTS 'pendente';

-- Update handle_new_user trigger to set new users as 'pendente'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    'pendente'
  );
  
  -- Create notification for admins about new user
  INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
  SELECT p.user_id, 'Novo cadastro pendente',
    'O usuário ' || COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || ' aguarda aprovação.',
    'warning', 'profile', NEW.id
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'admin' AND p.status = 'ativo';
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
