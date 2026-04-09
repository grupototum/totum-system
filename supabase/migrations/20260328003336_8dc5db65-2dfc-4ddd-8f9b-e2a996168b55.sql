
-- Asaas Configuration
CREATE TABLE public.asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'sandbox')),
  webhook_token text,
  is_active boolean NOT NULL DEFAULT true,
  sync_clients boolean NOT NULL DEFAULT true,
  sync_payments boolean NOT NULL DEFAULT true,
  auto_create_financial boolean NOT NULL DEFAULT true,
  default_billing_type text NOT NULL DEFAULT 'BOLETO' CHECK (default_billing_type IN ('BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Asaas Customer Mapping (links local clients to Asaas customers)
CREATE TABLE public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  asaas_customer_id text NOT NULL,
  sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  error_message text,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

CREATE INDEX idx_asaas_customers_client_id ON public.asaas_customers(client_id);
CREATE INDEX idx_asaas_customers_asaas_id ON public.asaas_customers(asaas_customer_id);

-- Asaas Payments (cobranças)
CREATE TABLE public.asaas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id text NOT NULL UNIQUE,
  asaas_customer_id text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  financial_entry_id uuid REFERENCES public.financial_entries(id) ON DELETE SET NULL,
  value numeric(12,2) NOT NULL,
  net_value numeric(12,2),
  billing_type text NOT NULL DEFAULT 'BOLETO',
  status text NOT NULL DEFAULT 'PENDING',
  due_date date NOT NULL,
  payment_date date,
  description text,
  invoice_url text,
  bank_slip_url text,
  pix_qr_code text,
  pix_qr_code_url text,
  external_reference text,
  installment_count integer,
  installment_value numeric(12,2),
  discount_value numeric(12,2),
  discount_type text,
  interest_value numeric(6,4),
  fine_value numeric(6,4),
  asaas_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asaas_payments_client ON public.asaas_payments(client_id);
CREATE INDEX idx_asaas_payments_status ON public.asaas_payments(status);
CREATE INDEX idx_asaas_payments_due_date ON public.asaas_payments(due_date);

-- Asaas Subscriptions (assinaturas recorrentes)
CREATE TABLE public.asaas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_subscription_id text NOT NULL UNIQUE,
  asaas_customer_id text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  billing_type text NOT NULL DEFAULT 'BOLETO',
  value numeric(12,2) NOT NULL,
  cycle text NOT NULL DEFAULT 'MONTHLY' CHECK (cycle IN ('WEEKLY','BIWEEKLY','MONTHLY','BIMONTHLY','QUARTERLY','SEMIANNUALLY','YEARLY')),
  next_due_date date,
  end_date date,
  max_payments integer,
  description text,
  external_reference text,
  status text NOT NULL DEFAULT 'ACTIVE',
  discount_value numeric(12,2),
  discount_type text,
  interest_value numeric(6,4),
  fine_value numeric(6,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asaas_subs_client ON public.asaas_subscriptions(client_id);

-- Asaas Webhook Logs
CREATE TABLE public.asaas_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payment_id text,
  payload jsonb NOT NULL DEFAULT '{}',
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asaas_webhook_event ON public.asaas_webhook_logs(event);

-- RLS Policies
ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage Asaas data
CREATE POLICY "Authenticated users can manage asaas_config" ON public.asaas_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage asaas_customers" ON public.asaas_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage asaas_payments" ON public.asaas_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage asaas_subscriptions" ON public.asaas_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read webhook logs" ON public.asaas_webhook_logs FOR SELECT TO authenticated USING (true);

-- Service role for webhook function
CREATE POLICY "Service role full access asaas_payments" ON public.asaas_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access asaas_webhook_logs" ON public.asaas_webhook_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Updated at triggers
CREATE TRIGGER update_asaas_config_updated_at BEFORE UPDATE ON public.asaas_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asaas_customers_updated_at BEFORE UPDATE ON public.asaas_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asaas_payments_updated_at BEFORE UPDATE ON public.asaas_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asaas_subscriptions_updated_at BEFORE UPDATE ON public.asaas_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
