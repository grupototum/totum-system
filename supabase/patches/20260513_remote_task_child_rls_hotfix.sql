-- Production hotfix for fgosozxvhbdhqigwzqih.
-- The remote database has divergent migration history and does not include the
-- tarefa_anexos tables or the is_org_member/is_org_admin helper functions used
-- by the local migration 20260512120000. This patch targets the live schema.

BEGIN;

CREATE OR REPLACE FUNCTION public.can_access_org(_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.is_master_user(), false)
    OR _organization_id = public.get_user_organization_id();
$$;

CREATE OR REPLACE FUNCTION public.can_access_client(_client_id UUID)
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
      AND public.can_access_org(client.organization_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_task(_task_id UUID)
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
      AND public.can_access_org(task.organization_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_delivery_checklist(_checklist_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_checklists checklist
    WHERE checklist.id = _checklist_id
      AND public.can_access_org(checklist.organization_id)
      AND (checklist.client_id IS NULL OR public.can_access_client(checklist.client_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_task_attachment_path(_path TEXT)
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
      AND public.can_access_org(task.organization_id)
  );
$$;

DROP POLICY IF EXISTS "Authenticated insert subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Tenant isolation on subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Org members can manage subtasks" ON public.subtasks;
CREATE POLICY "Org members can manage subtasks"
  ON public.subtasks FOR ALL TO authenticated
  USING (public.can_access_task(task_id))
  WITH CHECK (public.can_access_task(task_id));

DROP POLICY IF EXISTS "Authenticated insert task_checklist_items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Tenant isolation on task_checklist_items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Org members can manage task checklist items" ON public.task_checklist_items;
CREATE POLICY "Org members can manage task checklist items"
  ON public.task_checklist_items FOR ALL TO authenticated
  USING (public.can_access_task(task_id))
  WITH CHECK (public.can_access_task(task_id));

DROP POLICY IF EXISTS "Authenticated insert task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Tenant isolation on task_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can view task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can insert own task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can update own task comments" ON public.task_comments;
DROP POLICY IF EXISTS "Org members can delete own task comments" ON public.task_comments;
CREATE POLICY "Org members can view task comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (public.can_access_task(task_id));

CREATE POLICY "Org members can insert own task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (public.can_access_task(task_id) AND user_id = auth.uid());

CREATE POLICY "Org members can update own task comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (public.can_access_task(task_id) AND user_id = auth.uid())
  WITH CHECK (public.can_access_task(task_id) AND user_id = auth.uid());

CREATE POLICY "Org members can delete own task comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (public.can_access_task(task_id) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated insert task_history" ON public.task_history;
DROP POLICY IF EXISTS "Tenant isolation on task_history" ON public.task_history;
DROP POLICY IF EXISTS "Org members can view task history" ON public.task_history;
DROP POLICY IF EXISTS "Org members can insert task history" ON public.task_history;
CREATE POLICY "Org members can view task history"
  ON public.task_history FOR SELECT TO authenticated
  USING (public.can_access_task(task_id));

CREATE POLICY "Org members can insert task history"
  ON public.task_history FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_task(task_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated insert delivery_checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Tenant isolation on delivery_checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "delivery_checklists_select" ON public.delivery_checklists;
DROP POLICY IF EXISTS "delivery_checklists_insert" ON public.delivery_checklists;
DROP POLICY IF EXISTS "delivery_checklists_update" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Org members can view delivery checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Org members can insert delivery checklists" ON public.delivery_checklists;
DROP POLICY IF EXISTS "Org members can update delivery checklists" ON public.delivery_checklists;
CREATE POLICY "Org members can view delivery checklists"
  ON public.delivery_checklists FOR SELECT TO authenticated
  USING (
    public.can_access_org(organization_id)
    AND (client_id IS NULL OR public.can_access_client(client_id))
  );

CREATE POLICY "Org members can insert delivery checklists"
  ON public.delivery_checklists FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_org(organization_id)
    AND (client_id IS NULL OR public.can_access_client(client_id))
  );

CREATE POLICY "Org members can update delivery checklists"
  ON public.delivery_checklists FOR UPDATE TO authenticated
  USING (
    public.can_access_org(organization_id)
    AND (client_id IS NULL OR public.can_access_client(client_id))
  )
  WITH CHECK (
    public.can_access_org(organization_id)
    AND (client_id IS NULL OR public.can_access_client(client_id))
  );

DROP POLICY IF EXISTS "Authenticated insert delivery_checklist_items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Tenant isolation on delivery_checklist_items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_items_select" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_items_insert" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_items_update" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Org members can manage delivery checklist items" ON public.delivery_checklist_items;
CREATE POLICY "Org members can manage delivery checklist items"
  ON public.delivery_checklist_items FOR ALL TO authenticated
  USING (public.can_access_delivery_checklist(checklist_id))
  WITH CHECK (public.can_access_delivery_checklist(checklist_id));

DROP POLICY IF EXISTS "Authenticated read task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org members can read task attachment objects" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload task attachment objects" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update task attachment objects" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete task attachment objects" ON storage.objects;
CREATE POLICY "Org members can read task attachment objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND public.can_access_task_attachment_path(name)
  );

CREATE POLICY "Org members can upload task attachment objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND public.can_access_task_attachment_path(name)
  );

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

CREATE POLICY "Org members can delete task attachment objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (owner = auth.uid() OR public.is_master_user())
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
