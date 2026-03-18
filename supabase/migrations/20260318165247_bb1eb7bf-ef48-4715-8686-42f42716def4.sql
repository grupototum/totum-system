
-- Add marketing_analysis to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS marketing_analysis text;

-- Client observations table
CREATE TABLE public.client_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read client_observations" ON public.client_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert client_observations" ON public.client_observations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin delete client_observations" ON public.client_observations FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Task templates
CREATE TABLE public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read task_templates" ON public.task_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert task_templates" ON public.task_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update task_templates" ON public.task_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete task_templates" ON public.task_templates FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TABLE public.task_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage task_template_items" ON public.task_template_items FOR ALL TO authenticated USING (true);

-- Project templates
CREATE TABLE public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read project_templates" ON public.project_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert project_templates" ON public.project_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update project_templates" ON public.project_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete project_templates" ON public.project_templates FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TABLE public.project_template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_template_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage project_template_tasks" ON public.project_template_tasks FOR ALL TO authenticated USING (true);

-- Task dependencies
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage task_dependencies" ON public.task_dependencies FOR ALL TO authenticated USING (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
