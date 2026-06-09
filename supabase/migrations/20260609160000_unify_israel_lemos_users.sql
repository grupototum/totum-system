-- ============================================================
-- Unificação de usuários duplicados: Dev Admin, Israel, Israel Lemos
-- ============================================================
-- Objetivo: consolidar todos os perfis da mesma pessoa sob o nome
-- "Israel Lemos" e torná-lo disponível como responsável em tarefas.

DO $$
DECLARE
  main_profile_id UUID;
  main_user_id UUID;
  dup RECORD;
  affected_tables TEXT[] := ARRAY[
    'tasks',
    'subtasks',
    'projects',
    'task_goals',
    'delivery_checklist_items'
  ];
  tbl TEXT;
BEGIN
  -- 1. Identificar o perfil principal (Israel Lemos)
  SELECT id, user_id INTO main_profile_id, main_user_id
  FROM public.profiles
  WHERE full_name ILIKE 'Israel Lemos'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Se não encontrar um perfil exato, tentar criar a partir de outro
  IF main_profile_id IS NULL THEN
    SELECT id, user_id INTO main_profile_id, main_user_id
    FROM public.profiles
    WHERE full_name ILIKE 'Israel'
    ORDER BY created_at ASC
    LIMIT 1;

    IF main_profile_id IS NOT NULL THEN
      UPDATE public.profiles
      SET full_name = 'Israel Lemos',
          status = 'ativo'
      WHERE id = main_profile_id;
    END IF;
  ELSE
    -- Garantir que o perfil principal esteja ativo
    UPDATE public.profiles
    SET status = 'ativo'
    WHERE id = main_profile_id;
  END IF;

  -- Se ainda não encontrou nada, abortar
  IF main_profile_id IS NULL THEN
    RAISE NOTICE 'Nenhum perfil encontrado para Israel Lemos. Abortando.';
    RETURN;
  END IF;

  -- 2. Identificar e processar perfis duplicados
  FOR dup IN
    SELECT id, user_id, full_name
    FROM public.profiles
    WHERE (
      full_name ILIKE 'Dev Admin'
      OR full_name ILIKE 'Israel'
    )
    AND id <> main_profile_id
  LOOP
    RAISE NOTICE 'Processando duplicado: % (id=%)', dup.full_name, dup.id;

    -- 2a. Migrar todas as referências de responsible_id nas tabelas operacionais
    FOREACH tbl IN ARRAY affected_tables
    LOOP
      BEGIN
        EXECUTE format(
          'UPDATE public.%I SET responsible_id = $1 WHERE responsible_id = $2',
          tbl
        ) USING main_user_id, dup.user_id;
      EXCEPTION WHEN undefined_column THEN
        -- tabela não possui coluna responsible_id, ignorar
        NULL;
      END;
    END LOOP;

    -- 2b. Migrar referências em clients (assigned_user_id / responsible_id)
    -- Nota: a coluna pode variar entre assigned_user_id e responsible_id
    -- dependendo do estado da migração anterior. Tratamos ambas.
    BEGIN
      EXECUTE 'UPDATE public.clients SET assigned_user_id = $1 WHERE assigned_user_id = $2'
        USING main_user_id, dup.user_id;
    EXCEPTION WHEN undefined_column THEN
      -- coluna assigned_user_id não existe, ignorar
      NULL;
    END;

    BEGIN
      EXECUTE 'UPDATE public.clients SET responsible_id = $1 WHERE responsible_id = $2'
        USING main_user_id, dup.user_id;
    EXCEPTION WHEN undefined_column THEN
      -- coluna responsible_id não existe em clients, ignorar
      NULL;
    END;

    -- 2c. Migrar delivery_model_items.suggested_responsible_id
    BEGIN
      EXECUTE 'UPDATE public.delivery_model_items SET suggested_responsible_id = $1 WHERE suggested_responsible_id = $2'
        USING main_user_id, dup.user_id;
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;

    -- 2d. Remover o perfil duplicado
    DELETE FROM public.profiles WHERE id = dup.id;

    -- 2e. Remover o usuário duplicado do auth (opcional — comentado por segurança)
    -- DELETE FROM auth.users WHERE id = dup.user_id;
  END LOOP;

  -- 3. Garantir que o nome do perfil principal esteja correto
  UPDATE public.profiles
  SET full_name = 'Israel Lemos',
      status = 'ativo'
  WHERE id = main_profile_id;

  RAISE NOTICE 'Unificação concluída. Perfil principal: % (user_id=%)', main_profile_id, main_user_id;
END $$;
