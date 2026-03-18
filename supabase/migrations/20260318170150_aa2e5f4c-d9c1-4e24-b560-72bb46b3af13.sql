-- Add 'arquivado' to task_status enum
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'arquivado';

-- Add archive_after_days to system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS archive_after_days integer NOT NULL DEFAULT 30;