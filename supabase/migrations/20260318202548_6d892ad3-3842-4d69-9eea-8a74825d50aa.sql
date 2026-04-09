ALTER TABLE public.project_template_tasks
ADD COLUMN IF NOT EXISTS subtasks jsonb DEFAULT '[]'::jsonb;