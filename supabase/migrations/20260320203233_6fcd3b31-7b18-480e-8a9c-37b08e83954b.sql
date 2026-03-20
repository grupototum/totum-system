
-- POP (Standard Operating Procedures) tables
CREATE TABLE public.pops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  description TEXT,
  expected_outcome TEXT,
  linked_task_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pop_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pop_id UUID NOT NULL REFERENCES public.pops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pop_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pop_id UUID NOT NULL REFERENCES public.pops(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SLA Rules table
CREATE TABLE public.sla_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'media',
  max_response_minutes INTEGER NOT NULL DEFAULT 60,
  max_resolution_minutes INTEGER NOT NULL DEFAULT 480,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add pop_id and sla_id to tasks table
ALTER TABLE public.tasks ADD COLUMN pop_id UUID REFERENCES public.pops(id);
ALTER TABLE public.tasks ADD COLUMN sla_id UUID REFERENCES public.sla_rules(id);
ALTER TABLE public.tasks ADD COLUMN sla_response_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN sla_resolution_deadline TIMESTAMP WITH TIME ZONE;

-- RLS for pops
ALTER TABLE public.pops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read pops" ON public.pops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert pops" ON public.pops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update pops" ON public.pops FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete pops" ON public.pops FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- RLS for pop_steps
ALTER TABLE public.pop_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage pop_steps" ON public.pop_steps FOR ALL TO authenticated USING (true);

-- RLS for pop_checklist_items
ALTER TABLE public.pop_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage pop_checklist_items" ON public.pop_checklist_items FOR ALL TO authenticated USING (true);

-- RLS for sla_rules
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read sla_rules" ON public.sla_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert sla_rules" ON public.sla_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sla_rules" ON public.sla_rules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete sla_rules" ON public.sla_rules FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_pops_updated_at BEFORE UPDATE ON public.pops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sla_rules_updated_at BEFORE UPDATE ON public.sla_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
