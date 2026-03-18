
-- Add financial fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN salary NUMERIC DEFAULT NULL,
  ADD COLUMN commission_value NUMERIC DEFAULT NULL,
  ADD COLUMN commission_type TEXT DEFAULT 'percentual';
