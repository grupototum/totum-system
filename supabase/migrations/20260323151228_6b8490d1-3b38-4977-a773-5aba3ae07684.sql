
CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_types text[] NOT NULL DEFAULT '{}',
  total_records integer NOT NULL DEFAULT 0,
  financial_count integer NOT NULL DEFAULT 0,
  client_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  rolled_back_at timestamptz
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth manage import_batches" ON public.import_batches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);

CREATE OR REPLACE FUNCTION public.rollback_import(_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.financial_entries WHERE import_batch_id = _batch_id;
  DELETE FROM public.clients WHERE import_batch_id = _batch_id;
  UPDATE public.import_batches SET status = 'rolled_back', rolled_back_at = now() WHERE id = _batch_id;
END;
$$;
