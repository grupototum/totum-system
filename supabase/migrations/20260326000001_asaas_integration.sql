-- ============================================================
-- Integração Asaas - Tabelas e políticas
-- ============================================================

-- Tabela de configuração da integração Asaas
CREATE TABLE IF NOT EXISTS public.asaas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
  webhook_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_clients BOOLEAN NOT NULL DEFAULT true,
  sync_payments BOOLEAN NOT NULL DEFAULT true,
  auto_create_financial BOOLEAN NOT NULL DEFAULT true,
  default_billing_type TEXT NOT NULL DEFAULT 'BOLETO' CHECK (default_billing_type IN ('BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage asaas_config" ON public.asaas_config
  FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Auth read asaas_config" ON public.asaas_config
  FOR SELECT TO authenticated USING (true);

-- Tabela de mapeamento cliente Totum <-> Asaas
CREATE TABLE IF NOT EXISTS public.asaas_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  asaas_customer_id TEXT NOT NULL UNIQUE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'error', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage asaas_customers" ON public.asaas_customers
  FOR ALL TO authenticated USING (true);

-- Tabela de cobranças Asaas
CREATE TABLE IF NOT EXISTS public.asaas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  contract_id UUID REFERENCES public.contracts(id),
  financial_entry_id UUID REFERENCES public.financial_entries(id),
  value NUMERIC(12,2) NOT NULL,
  net_value NUMERIC(12,2),
  billing_type TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  description TEXT,
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  external_reference TEXT,
  asaas_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage asaas_payments" ON public.asaas_payments
  FOR ALL TO authenticated USING (true);

-- Tabela de log de webhooks recebidos
CREATE TABLE IF NOT EXISTS public.asaas_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  payment_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage asaas_webhook_logs" ON public.asaas_webhook_logs
  FOR ALL TO authenticated USING (true);

-- Adicionar coluna asaas_customer_id na tabela clients para referência rápida
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
