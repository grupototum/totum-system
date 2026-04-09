-- Migration: 20260329153000_rename_fk_columns.sql

-- 1. Rename cost_center_id to cost_registration_id in financial_entries
-- Note: This is an optional but recommended step for full consistency.
ALTER TABLE IF EXISTS public.financial_entries 
  RENAME COLUMN cost_center_id TO cost_registration_id;

-- 2. Update types.ts will be done in the next step.
