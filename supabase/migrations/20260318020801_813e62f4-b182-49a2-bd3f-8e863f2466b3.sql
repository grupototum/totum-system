
-- Create revenue_types table
CREATE TABLE public.revenue_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin manage revenue_types" ON public.revenue_types FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Auth read revenue_types" ON public.revenue_types FOR SELECT TO authenticated USING (true);

-- Add FK columns to project_types
ALTER TABLE public.project_types
  ADD COLUMN service_type_id UUID REFERENCES public.service_types(id),
  ADD COLUMN revenue_type_id UUID REFERENCES public.revenue_types(id);
