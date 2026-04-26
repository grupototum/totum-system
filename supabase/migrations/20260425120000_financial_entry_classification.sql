ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS entry_class TEXT CHECK (entry_class IN ('receita', 'custo', 'despesa'));

UPDATE public.financial_entries
SET entry_class = CASE
  WHEN type = 'receber' THEN 'receita'
  WHEN type = 'pagar' THEN 'despesa'
  ELSE entry_class
END
WHERE entry_class IS NULL;

ALTER TABLE public.financial_entries
  ALTER COLUMN entry_class SET DEFAULT 'despesa';
