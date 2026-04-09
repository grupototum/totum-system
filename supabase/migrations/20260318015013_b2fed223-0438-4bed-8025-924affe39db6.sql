
-- Add recurrence fields to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT NULL, -- diaria, semanal, mensal, personalizada
  ADD COLUMN IF NOT EXISTS recurrence_config jsonb DEFAULT NULL, -- { interval_days, week_days[], month_day }
  ADD COLUMN IF NOT EXISTS recurrence_end_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_generated_at timestamp with time zone DEFAULT NULL;

-- Index for finding recurring parent tasks
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON public.tasks (is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;
