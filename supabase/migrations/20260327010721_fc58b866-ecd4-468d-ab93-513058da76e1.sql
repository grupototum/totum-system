
-- Add package pricing fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_package numeric DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

-- Add contract_products junction table for product-based contracts
CREATE TABLE IF NOT EXISTS public.contract_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  is_package boolean NOT NULL DEFAULT false,
  unit_price numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id, product_id)
);

ALTER TABLE public.contract_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage contract_products" ON public.contract_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rename "Plano Recorrente" label concept: add a label column to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS label text DEFAULT 'pacote';
