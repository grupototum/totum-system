-- Agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  emoji TEXT DEFAULT '🤖',
  category TEXT,
  tasks INTEGER NOT NULL DEFAULT 0,
  daily_tasks INTEGER,
  success_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read agents" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage agents" ON public.agents FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent execution logs
CREATE TABLE public.logs_execucao_agente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agente_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resultado TEXT,
  duracao_ms INTEGER,
  erro TEXT,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.logs_execucao_agente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read agent logs" ON public.logs_execucao_agente FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert agent logs" ON public.logs_execucao_agente FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin manage agent logs" ON public.logs_execucao_agente FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_logs_execucao_agente_agente_id ON public.logs_execucao_agente(agente_id);