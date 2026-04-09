-- Migration: Add ON DELETE CASCADE to foreign keys referencing clients

-- Drop existing constraints
ALTER TABLE public.financial_entries DROP CONSTRAINT IF EXISTS financial_entries_client_id_fkey;
ALTER TABLE public.asaas_payments DROP CONSTRAINT IF EXISTS asaas_payments_client_id_fkey;
ALTER TABLE public.asaas_subscriptions DROP CONSTRAINT IF EXISTS asaas_subscriptions_client_id_fkey;
ALTER TABLE public.asaas_customers DROP CONSTRAINT IF EXISTS asaas_customers_client_id_fkey;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_client_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_client_id_fkey;
ALTER TABLE public.delivery_checklists DROP CONSTRAINT IF EXISTS delivery_checklists_client_id_fkey;
ALTER TABLE public.client_observations DROP CONSTRAINT IF EXISTS client_observations_client_id_fkey;

-- Re-add constraints with ON DELETE CASCADE
ALTER TABLE public.financial_entries
  ADD CONSTRAINT financial_entries_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.asaas_payments
  ADD CONSTRAINT asaas_payments_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.asaas_subscriptions
  ADD CONSTRAINT asaas_subscriptions_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.asaas_customers
  ADD CONSTRAINT asaas_customers_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.delivery_checklists
  ADD CONSTRAINT delivery_checklists_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_observations
  ADD CONSTRAINT client_observations_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
