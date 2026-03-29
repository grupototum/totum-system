-- Migration: 20260329160000_add_nature_to_entries.sql

-- 1. Add nature to financial_entries
ALTER TABLE public.financial_entries 
  ADD COLUMN IF NOT EXISTS nature TEXT CHECK (nature IN ('fixo', 'variavel'));

-- 2. Update existing entries (default to fixo if not specified)
UPDATE public.financial_entries SET nature = 'fixo' WHERE nature IS NULL;
