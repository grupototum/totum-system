-- Migration: 20260329150000_financial_refactor.sql

-- 1. Rename cost_centers to cost_registrations
ALTER TABLE IF EXISTS public.cost_centers RENAME TO cost_registrations;

-- 2. Add new columns to cost_registrations (Cadastro de Custo)
ALTER TABLE public.cost_registrations 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS nature TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS installments INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "interval" INT DEFAULT 1;

-- 3. Update expense_types to include nature
ALTER TABLE public.expense_types
  ADD COLUMN IF NOT EXISTS nature TEXT;

-- 4. Initial labels for existing data
UPDATE public.cost_registrations SET nature = 'fixo' WHERE nature IS NULL;
UPDATE public.expense_types SET nature = 'fixo' WHERE nature IS NULL;
