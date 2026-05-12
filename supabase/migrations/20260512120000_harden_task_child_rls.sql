-- Harden RLS for task child records and task attachment storage.
-- Parent operational tables were scoped in 20260426103000; these children must
-- inherit the same organization boundary instead of allowing every auth user.

CREATE OR REPLACE FUNCTION public.can_access_client(_client_id UUID, _admin_only BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients client
    WHERE client.id = _client_id
      AND (
        public.is_admin(auth.uid())
        OR CASE
          WHEN _admin_only THEN public.is_org_admin(client.organization_id)
          ELSE public.is_org_member(client.organization_id)
        END
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_task(_task_id UUID, _admin_only BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks task
    WHERE task.id = _task_id
      AND (
        public.is_admin(auth.uid())
        OR CASE
          WHEN _admin_only THEN public.is_org_admin(task.organization_id)
          ELSE public.is_org_member(task.organization_id)
        END
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_task_attachment_path(_path TEXT, _admin_only BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks task
    WHERE task.id::text = split_part(COALESCE(_path, ''), '/', 1)
      AND (
        public.is_admin(auth.uid())
        OR CASE
          WHEN _admin_only THEN public.is_org_admin(task.organization_id)
          ELSE public.is_org_member(task.organization_id)
        END
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_delivery_checklist(_checklist_id UUID, _admin_only BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_checklists checklist
    JOIN public.clients client
      ON client.id = checklist.client_id
    WHERE checklist.id = _checklist_id
      AND (
        public.is_admin(auth.uid())
        OR CASE
          WHEN _admin_only THEN public.is_org_admin(client.organization_id)
          ELSE public.is_org_member(client.organization_id)
        END
      )
  );
$$;

-- Keep the migration safe to re-apply in local resets or interrupted deploys.
DROP POLICY IF EXISTS "Org members can manage subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Org members can manage task checklist items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Org members can view task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can insert own task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can update own task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org admins can delete task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can view task history" ON public.task_history;
DROP POLICY IF EXISTS "Org members can insert task history" ON public.task_history;
DROP POLICY IF EXISTS "Org members can view delivery checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Org members can insert delivery checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Org members can update delivery checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Org members can manage delivery checklist items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Org members can view task attachments" ON public.tarefa_anexos;
DROP POLICY IF EXISTS "Org members can insert own task attachments" ON public.tarefa_anexos;
DROP POLICY IF EXISTS "Owners or org admins can delete task attachments" ON public.tarefa_anexos;
DROP POLICY IF EXISTS "Org members can view task attachment history" ON public.tarefa_anexos_historico;
DROP POLICY IF EXISTS "Org members can insert task attachment history" ON public.tarefa_anexos_historico;
DROP POLICY IF EXISTS "Org members can read task attachment objects" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload task attachment objects" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update task attachment objects" ON storage.objects;
DROP POLICY IF EXISTS "Owners or org admins can delete task attachment objects" ON storage.objects;

-- Task children inherit access from tasks.organization_id.
DROP POLICY IF EXISTS "Auth manage subtasks" ON public.subtasks;
CREATE POLICY "Org members can manage subtasks"
  ON public.subtasks FOR ALL TO authenticated
  USING (public.can_access_task(task_id))
  WITH CHECK (public.can_access_task(task_id));

DROP POLICY IF EXISTS "Auth manage task_checklist" ON public.task_checklist_items;
CREATE POLICY "Org members can manage task checklist items"
  ON public.task_checklist_items FOR ALL TO authenticated
  USING (public.can_access_task(task_id))
  WITH CHECK (public.can_access_task(task_id));

DROP POLICY IF EXISTS "Auth manage task_comments" ON public.task_comments;
CREATE POLICY "Org members can view task comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (public.can_access_task(task_id));

CREATE POLICY "Org members can insert own task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (public.can_access_task(task_id) AND user_id = auth.uid());

CREATE POLICY "Org members can update own task comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (public.can_access_task(task_id) AND (user_id = auth.uid() OR public.can_access_task(task_id, true)))
  WITH CHECK (public.can_access_task(task_id) AND (user_id = auth.uid() OR public.can_access_task(task_id, true)));

CREATE POLICY "Org admins can delete task comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.can_access_task(task_id, true));

DROP POLICY IF EXISTS "Auth read task_history" ON public.task_history;
CREATE POLICY "Org members can view task history"
  ON public.task_history FOR SELECT TO authenticated
  USING (public.can_access_task(task_id));

DROP POLICY IF EXISTS "Auth insert task_history" ON public.task_history;
CREATE POLICY "Org members can insert task history"
  ON public.task_history FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_task(task_id)
    AND (user_id IS NULL OR user_id = auth.uid() OR public.can_access_task(task_id, true))
  );

-- Delivery checklist rows are scoped through their client organization.
DROP POLICY IF EXISTS "Auth read delivery_checklists" ON public.delivery_checklists;
CREATE POLICY "Org members can view delivery checklists"
  ON public.delivery_checklists FOR SELECT TO authenticated
  USING (public.can_access_client(client_id));

DROP POLICY IF EXISTS "Auth insert delivery_checklists" ON public.delivery_checklists;
CREATE POLICY "Org members can insert delivery checklists"
  ON public.delivery_checklists FOR INSERT TO authenticated
  WITH CHECK (public.can_access_client(client_id));

DROP POLICY IF EXISTS "Auth update delivery_checklists" ON public.delivery_checklists;
CREATE POLICY "Org members can update delivery checklists"
  ON public.delivery_checklists FOR UPDATE TO authenticated
  USING (public.can_access_client(client_id))
  WITH CHECK (public.can_access_client(client_id));

DROP POLICY IF EXISTS "Auth manage delivery_checklist_items" ON public.delivery_checklist_items;
CREATE POLICY "Org members can manage delivery checklist items"
  ON public.delivery_checklist_items FOR ALL TO authenticated
  USING (
    public.can_access_delivery_checklist(checklist_id)
    AND (task_id IS NULL OR public.can_access_task(task_id))
  )
  WITH CHECK (
    public.can_access_delivery_checklist(checklist_id)
    AND (task_id IS NULL OR public.can_access_task(task_id))
  );

-- Task attachment metadata inherits access from the related task.
DROP POLICY IF EXISTS "anexos select auth" ON public.tarefa_anexos;
CREATE POLICY "Org members can view task attachments"
  ON public.tarefa_anexos FOR SELECT TO authenticated
  USING (public.can_access_task(tarefa_id));

DROP POLICY IF EXISTS "anexos insert auth" ON public.tarefa_anexos;
CREATE POLICY "Org members can insert own task attachments"
  ON public.tarefa_anexos FOR INSERT TO authenticated
  WITH CHECK (public.can_access_task(tarefa_id) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "anexos delete owner or admin" ON public.tarefa_anexos;
CREATE POLICY "Owners or org admins can delete task attachments"
  ON public.tarefa_anexos FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_access_task(tarefa_id, true));

DROP POLICY IF EXISTS "hist select auth" ON public.tarefa_anexos_historico;
CREATE POLICY "Org members can view task attachment history"
  ON public.tarefa_anexos_historico FOR SELECT TO authenticated
  USING (public.can_access_task(tarefa_id));

DROP POLICY IF EXISTS "hist insert auth" ON public.tarefa_anexos_historico;
CREATE POLICY "Org members can insert task attachment history"
  ON public.tarefa_anexos_historico FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_task(tarefa_id)
    AND (user_id IS NULL OR user_id = auth.uid() OR public.can_access_task(tarefa_id, true))
  );

-- Storage paths are written as "{task_id}/{uuid}.{ext}" by useTaskAttachments.
DROP POLICY IF EXISTS "task-attachments read auth" ON storage.objects;
CREATE POLICY "Org members can read task attachment objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND public.can_access_task_attachment_path(name)
  );

DROP POLICY IF EXISTS "task-attachments insert auth" ON storage.objects;
CREATE POLICY "Org members can upload task attachment objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND public.can_access_task_attachment_path(name)
  );

DROP POLICY IF EXISTS "task-attachments update auth" ON storage.objects;
CREATE POLICY "Org members can update task attachment objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND public.can_access_task_attachment_path(name)
  )
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND public.can_access_task_attachment_path(name)
  );

DROP POLICY IF EXISTS "task-attachments delete owner or admin" ON storage.objects;
CREATE POLICY "Owners or org admins can delete task attachment objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (owner = auth.uid() OR public.can_access_task_attachment_path(name, true))
  );

NOTIFY pgrst, 'reload schema';
