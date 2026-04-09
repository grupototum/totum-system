
-- Company settings table (singleton)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text,
  email text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage company_settings" ON public.company_settings
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Auth read company_settings" ON public.company_settings
  FOR SELECT TO authenticated USING (true);

-- System settings table (singleton)
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL DEFAULT 'BRL',
  date_format text NOT NULL DEFAULT 'dd/MM/yyyy',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  default_task_status text NOT NULL DEFAULT 'pendente',
  default_task_priority text NOT NULL DEFAULT 'media',
  default_contract_rules jsonb NOT NULL DEFAULT '{}',
  default_checklist_rules jsonb NOT NULL DEFAULT '{}',
  default_recurrence_rules jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage system_settings" ON public.system_settings
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Auth read system_settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

-- Error logs table
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_type text NOT NULL,
  message text NOT NULL,
  technical_message text,
  context text,
  stack_trace text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read error_logs" ON public.error_logs
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Auth insert error_logs" ON public.error_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default rows
INSERT INTO public.company_settings (name) VALUES ('Grupo Totum');
INSERT INTO public.system_settings (currency) VALUES ('BRL');

-- Triggers for updated_at
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
