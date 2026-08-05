-- Production hotfix for fgosozxvhbdhqigwzqih.
-- Bug: cadastro de clientes falha com
--   "Could not find the 'additional_info' column of 'clients' in the schema cache"
-- The frontend (src/pages/NewClient.tsx, src/pages/EditClient.tsx) has always
-- sent an `additional_info` field for the client's onboarding form (etapa 5 —
-- "Informações adicionais"), but the column was never created on the live
-- `public.clients` table. Per B-025, local migration history is divergent
-- from the remote database, so this ships as a standalone patch (same
-- pattern as 20260513_remote_task_child_rls_hotfix.sql) instead of a normal
-- `supabase db push` migration.

BEGIN;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS additional_info text;

NOTIFY pgrst, 'reload schema';

COMMIT;
