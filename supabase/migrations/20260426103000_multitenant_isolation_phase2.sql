-- Multi-tenant isolation hardening for operational tables

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_organization_id ON public.contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_organization_id ON public.financial_entries(organization_id);

CREATE OR REPLACE FUNCTION public.current_default_organization_id(_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.user_id = COALESCE(_user_id, auth.uid())
        AND p.organization_id IS NOT NULL
      LIMIT 1
    ),
    (
      SELECT membership.organization_id
      FROM public.organization_memberships membership
      WHERE membership.user_id = COALESCE(_user_id, auth.uid())
        AND membership.status = 'ativo'
      ORDER BY membership.is_owner DESC, membership.created_at
      LIMIT 1
    ),
    (
      SELECT org.id
      FROM public.organizations org
      WHERE org.slug = 'totum'
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_operational_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_org_id UUID;
  client_org_id UUID;
  contract_org_id UUID;
  project_org_id UUID;
  resolved_org_id UUID;
BEGIN
  default_org_id := public.current_default_organization_id();

  IF TG_TABLE_NAME = 'clients' THEN
    NEW.organization_id := COALESCE(NEW.organization_id, default_org_id);

    IF NEW.organization_id IS NULL THEN
      RAISE EXCEPTION 'organization_id is required for clients';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.client_id IS NOT NULL THEN
    SELECT organization_id INTO client_org_id
    FROM public.clients
    WHERE id = NEW.client_id;
  END IF;

  IF NEW.contract_id IS NOT NULL THEN
    SELECT organization_id INTO contract_org_id
    FROM public.contracts
    WHERE id = NEW.contract_id;
  END IF;

  IF TG_TABLE_NAME = 'tasks' AND NEW.project_id IS NOT NULL THEN
    SELECT organization_id INTO project_org_id
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;

  resolved_org_id := COALESCE(project_org_id, contract_org_id, client_org_id, NEW.organization_id, default_org_id);

  IF resolved_org_id IS NULL THEN
    RAISE EXCEPTION 'organization_id could not be resolved for %', TG_TABLE_NAME;
  END IF;

  IF client_org_id IS NOT NULL AND resolved_org_id <> client_org_id THEN
    RAISE EXCEPTION 'organization mismatch between % and client', TG_TABLE_NAME;
  END IF;

  IF contract_org_id IS NOT NULL AND resolved_org_id <> contract_org_id THEN
    RAISE EXCEPTION 'organization mismatch between % and contract', TG_TABLE_NAME;
  END IF;

  IF project_org_id IS NOT NULL AND resolved_org_id <> project_org_id THEN
    RAISE EXCEPTION 'organization mismatch between % and project', TG_TABLE_NAME;
  END IF;

  NEW.organization_id := resolved_org_id;
  RETURN NEW;
END;
$$;

WITH default_org AS (
  SELECT public.current_default_organization_id() AS id
)
UPDATE public.clients client
SET organization_id = COALESCE(client.organization_id, default_org.id)
FROM default_org
WHERE client.organization_id IS NULL;

UPDATE public.contracts contract
SET organization_id = client.organization_id
FROM public.clients client
WHERE contract.client_id = client.id
  AND (contract.organization_id IS NULL OR contract.organization_id <> client.organization_id);

WITH default_org AS (
  SELECT public.current_default_organization_id() AS id
)
UPDATE public.contracts contract
SET organization_id = default_org.id
FROM default_org
WHERE contract.organization_id IS NULL;

UPDATE public.projects project
SET organization_id = COALESCE(src.client_org_id, src.contract_org_id)
FROM (
  SELECT
    p.id AS project_id,
    client.organization_id AS client_org_id,
    contract.organization_id AS contract_org_id
  FROM public.projects p
  JOIN public.clients client
    ON client.id = p.client_id
  LEFT JOIN public.contracts contract
    ON contract.id = p.contract_id
) src
WHERE project.id = src.project_id
  AND (
    project.organization_id IS NULL
    OR project.organization_id <> COALESCE(src.client_org_id, src.contract_org_id)
  );

WITH default_org AS (
  SELECT public.current_default_organization_id() AS id
)
UPDATE public.projects project
SET organization_id = default_org.id
FROM default_org
WHERE project.organization_id IS NULL;

UPDATE public.tasks task
SET organization_id = COALESCE(src.client_org_id, src.contract_org_id, src.project_org_id)
FROM (
  SELECT
    t.id AS task_id,
    client.organization_id AS client_org_id,
    contract.organization_id AS contract_org_id,
    project.organization_id AS project_org_id
  FROM public.tasks t
  JOIN public.clients client
    ON client.id = t.client_id
  LEFT JOIN public.contracts contract
    ON contract.id = t.contract_id
  LEFT JOIN public.projects project
    ON project.id = t.project_id
) src
WHERE task.id = src.task_id
  AND (
    task.organization_id IS NULL
    OR task.organization_id <> COALESCE(src.client_org_id, src.contract_org_id, src.project_org_id)
  );

WITH default_org AS (
  SELECT public.current_default_organization_id() AS id
)
UPDATE public.tasks task
SET organization_id = default_org.id
FROM default_org
WHERE task.organization_id IS NULL;

UPDATE public.financial_entries entry
SET organization_id = client.organization_id
FROM public.clients client
WHERE entry.client_id = client.id
  AND (entry.organization_id IS NULL OR entry.organization_id <> client.organization_id);

UPDATE public.financial_entries entry
SET organization_id = contract.organization_id
FROM public.contracts contract
WHERE entry.contract_id = contract.id
  AND (entry.organization_id IS NULL OR entry.organization_id <> contract.organization_id);

WITH default_org AS (
  SELECT public.current_default_organization_id() AS id
)
UPDATE public.financial_entries entry
SET organization_id = default_org.id
FROM default_org
WHERE entry.organization_id IS NULL;

ALTER TABLE public.clients
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.contracts
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.projects
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.tasks
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.financial_entries
  ALTER COLUMN organization_id SET NOT NULL;

DROP TRIGGER IF EXISTS sync_clients_organization_id ON public.clients;
CREATE TRIGGER sync_clients_organization_id
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.sync_operational_organization_id();

DROP TRIGGER IF EXISTS sync_contracts_organization_id ON public.contracts;
CREATE TRIGGER sync_contracts_organization_id
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.sync_operational_organization_id();

DROP TRIGGER IF EXISTS sync_projects_organization_id ON public.projects;
CREATE TRIGGER sync_projects_organization_id
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.sync_operational_organization_id();

DROP TRIGGER IF EXISTS sync_tasks_organization_id ON public.tasks;
CREATE TRIGGER sync_tasks_organization_id
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.sync_operational_organization_id();

DROP TRIGGER IF EXISTS sync_financial_entries_organization_id ON public.financial_entries;
CREATE TRIGGER sync_financial_entries_organization_id
  BEFORE INSERT OR UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.sync_operational_organization_id();

DROP POLICY IF EXISTS "Auth users can view clients" ON public.clients;
CREATE POLICY "Org members can view clients"
  ON public.clients FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth users can insert clients" ON public.clients;
CREATE POLICY "Org members can insert clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth users can update clients" ON public.clients;
CREATE POLICY "Org members can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Org admins can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read contracts" ON public.contracts;
CREATE POLICY "Org members can view contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert contracts" ON public.contracts;
CREATE POLICY "Org members can insert contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth update contracts" ON public.contracts;
CREATE POLICY "Org members can update contracts"
  ON public.contracts FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin delete contracts" ON public.contracts;
CREATE POLICY "Org admins can delete contracts"
  ON public.contracts FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read projects" ON public.projects;
CREATE POLICY "Org members can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert projects" ON public.projects;
CREATE POLICY "Org members can insert projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth update projects" ON public.projects;
CREATE POLICY "Org members can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin delete projects" ON public.projects;
CREATE POLICY "Org admins can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read tasks" ON public.tasks;
CREATE POLICY "Org members can view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert tasks" ON public.tasks;
CREATE POLICY "Org members can insert tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth update tasks" ON public.tasks;
CREATE POLICY "Org members can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth delete tasks" ON public.tasks;
CREATE POLICY "Org members can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth read financial_entries" ON public.financial_entries;
CREATE POLICY "Org members can view financial entries"
  ON public.financial_entries FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth insert financial_entries" ON public.financial_entries;
CREATE POLICY "Org members can insert financial entries"
  ON public.financial_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Auth update financial_entries" ON public.financial_entries;
CREATE POLICY "Org members can update financial entries"
  ON public.financial_entries FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin delete financial_entries" ON public.financial_entries;
CREATE POLICY "Org admins can delete financial entries"
  ON public.financial_entries FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id) OR public.is_admin(auth.uid()));
