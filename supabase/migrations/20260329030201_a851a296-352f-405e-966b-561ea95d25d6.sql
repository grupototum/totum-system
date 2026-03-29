
CREATE TABLE public.task_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_count integer NOT NULL DEFAULT 1,
  current_count integer NOT NULL DEFAULT 0,
  goal_type text NOT NULL DEFAULT 'completion',
  period text NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  responsible_id uuid,
  client_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage task_goals" ON public.task_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
