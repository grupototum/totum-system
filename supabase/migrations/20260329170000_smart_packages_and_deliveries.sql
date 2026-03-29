-- Migration: Smart Packages and Deliveries
-- Date: 2026-03-29 17:00:00

-- 1. Updates to products for human-effort pricing
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS professional_monthly_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_hours_worked numeric DEFAULT 160,
ADD COLUMN IF NOT EXISTS time_spent_hours numeric DEFAULT 0;

-- 2. Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    loyalty_enabled boolean DEFAULT false,
    loyalty_months integer DEFAULT 12,
    total_cost numeric DEFAULT 0,
    total_sale numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp WITH time zone DEFAULT now(),
    updated_at timestamp WITH time zone DEFAULT now()
);

-- 3. Create package_items table
CREATE TABLE IF NOT EXISTS public.package_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    created_at timestamp WITH time zone DEFAULT now()
);

-- 4. Update contracts to link to a package
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.packages(id);

-- 5. Create contract_deliveries table
CREATE TABLE IF NOT EXISTS public.contract_deliveries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    package_id uuid REFERENCES public.packages(id),
    status text DEFAULT 'Pendente',
    planned_date date,
    actual_date date,
    notes text,
    created_at timestamp WITH time zone DEFAULT now(),
    updated_at timestamp WITH time zone DEFAULT now()
);

-- Enums/Policies (Simplified for now, assuming standard RLS)
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_deliveries ENABLE ROW LEVEL SECURITY;

-- Basic SELECT policies for authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated select on packages') THEN
        CREATE POLICY "Allow authenticated select on packages" ON public.packages FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated select on package_items') THEN
        CREATE POLICY "Allow authenticated select on package_items" ON public.package_items FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated select on contract_deliveries') THEN
        CREATE POLICY "Allow authenticated select on contract_deliveries" ON public.contract_deliveries FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
