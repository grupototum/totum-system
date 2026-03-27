/**
 * Serviço de integração com a API do Asaas
 * Gerencia clientes, cobranças e webhooks
 */

import { supabase } from "@/integrations/supabase/client";

// Helper to bypass strict typing for Asaas tables not in generated types
const asaasDb = supabase as any;

// URL base da Edge Function proxy (resolve CORS)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sugulxjfkhibuddmoyzr.supabase.co";
const ASAAS_PROXY_URL = `${SUPABASE_URL}/functions/v1/asaas-proxy`;

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AsaasConfig {
  id: string;
  api_key: string;
  environment: "sandbox" | "production";
  webhook_token: string | null;
  is_active: boolean;
  sync_clients: boolean;
  sync_payments: boolean;
  auto_create_financial: boolean;
  default_billing_type: "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  cityName?: string;
  state?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  observations?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";
  value: number;
  netValue?: number;
  dueDate: string;
  description?: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  externalReference?: string;
  subscription?: string;
  paymentDate?: string;
}

export interface CreatePaymentInput {
  customer: string; // asaas_customer_id
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
}

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

// ─── HELPER: CHAMADAS À API ───────────────────────────────────────────────────

async function asaasRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  apiKey: string,
  body?: object,
  environment: "production" | "sandbox" = "production"
): Promise<any> {
  // Usa a Edge Function proxy para evitar CORS
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${ASAAS_PROXY_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "authorization": `Bearer ${session?.access_token || ""}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      "x-asaas-key": apiKey,
      "x-asaas-env": environment,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.errors?.[0]?.description || err.message || `Erro ${res.status}`);
  }

  return res.json();
}

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────

export async function getAsaasConfig(): Promise<AsaasConfig | null> {
  const { data } = await (supabase as any)
    .from("asaas_config")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();
  return data as AsaasConfig | null;
}

export async function saveAsaasConfig(config: Partial<AsaasConfig>): Promise<void> {
  const { data: existing } = await (supabase as any)
    .from("asaas_config")
    .select("id")
    .limit(1)
    .single();

  if (existing) {
    await (supabase as any).from("asaas_config").update({ ...config, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await (supabase as any).from("asaas_config").insert(config);
  }
}

export async function testAsaasConnection(apiKey: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const data = await asaasRequest("GET", "/myAccount", apiKey);
    return { ok: true, name: data.name };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export async function syncClientToAsaas(
  clientId: string,
  apiKey: string
): Promise<{ asaasId: string; created: boolean }> {
  // Buscar dados do cliente no Totum
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) throw new Error("Cliente não encontrado");

  // Verificar se já existe mapeamento
  const { data: existing } = await (supabase as any)
    .from("asaas_customers")
    .select("asaas_customer_id")
    .eq("client_id", clientId)
    .single();

  const customerPayload: Partial<AsaasCustomer> = {
    name: client.name,
    email: client.email || undefined,
    mobilePhone: client.phone?.replace(/\D/g, "") || undefined,
    cpfCnpj: client.document?.replace(/\D/g, "") || undefined,
    externalReference: clientId,
    observations: client.notes || undefined,
  };

  if (existing?.asaas_customer_id) {
    await asaasRequest("PUT", `/customers/${existing.asaas_customer_id}`, apiKey, customerPayload);
    await (supabase as any).from("asaas_customers").update({
      synced_at: new Date().toISOString(),
      sync_status: "synced",
      error_message: null,
    }).eq("client_id", clientId);
    return { asaasId: existing.asaas_customer_id, created: false };
  } else {
    const created = await asaasRequest("POST", "/customers", apiKey, customerPayload);
    await (supabase as any).from("asaas_customers").insert({
      client_id: clientId,
      asaas_customer_id: created.id,
      sync_status: "synced",
    });
    await (supabase as any).from("clients").update({ asaas_customer_id: created.id } as any).eq("id", clientId);
    return { asaasId: created.id, created: true };
  }
}

export async function syncAllClientsToAsaas(apiKey: string): Promise<SyncResult> {
  const result: SyncResult = { success: true, created: 0, updated: 0, errors: [] };

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, phone, document, notes")
    .eq("status", "ativo");

  if (!clients?.length) return result;

  for (const client of clients) {
    try {
      const { created } = await syncClientToAsaas(client.id, apiKey);
      if (created) result.created++;
      else result.updated++;
    } catch (e: any) {
      result.errors.push(`${client.name}: ${e.message}`);
      await (supabase as any).from("asaas_customers").upsert({
        client_id: client.id,
        asaas_customer_id: `error_${client.id}`,
        sync_status: "error",
        error_message: e.message,
      }, { onConflict: "client_id" });
    }
  }

  if (result.errors.length > 0) result.success = false;
  return result;
}

// ─── COBRANÇAS ────────────────────────────────────────────────────────────────

export async function createAsaasPayment(
  input: CreatePaymentInput,
  apiKey: string,
  contractId?: string,
  clientId?: string
): Promise<AsaasPayment> {
  const payment = await asaasRequest("POST", "/payments", apiKey, input);

  // Salvar no banco
  await (supabase as any).from("asaas_payments").insert({
    asaas_payment_id: payment.id,
    asaas_customer_id: input.customer,
    client_id: clientId || null,
    contract_id: contractId || null,
    value: payment.value,
    net_value: payment.netValue,
    billing_type: payment.billingType,
    status: payment.status,
    due_date: payment.dueDate,
    description: payment.description,
    invoice_url: payment.invoiceUrl,
    bank_slip_url: payment.bankSlipUrl,
    external_reference: input.externalReference,
    asaas_subscription_id: payment.subscription,
  });

  return payment;
}

export async function getAsaasPaymentsByClient(
  asaasCustomerId: string,
  apiKey: string
): Promise<AsaasPayment[]> {
  const data = await asaasRequest("GET", `/payments?customer=${asaasCustomerId}&limit=50`, apiKey);
  return data.data || [];
}

export async function syncPaymentsFromAsaas(apiKey: string): Promise<SyncResult> {
  const result: SyncResult = { success: true, created: 0, updated: 0, errors: [] };

  try {
    // Buscar cobranças dos últimos 90 dias
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceStr = since.toISOString().split("T")[0];

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const data = await asaasRequest(
        "GET",
        `/payments?dateCreated[ge]=${sinceStr}&limit=100&offset=${offset}`,
        apiKey
      );

      for (const payment of data.data || []) {
        // Buscar client_id pelo asaas_customer_id
        const { data: mapping } = await (supabase as any)
          .from("asaas_customers")
          .select("client_id")
          .eq("asaas_customer_id", payment.customer)
          .single();

        const { data: existing } = await (supabase as any)
          .from("asaas_payments")
          .select("id")
          .eq("asaas_payment_id", payment.id)
          .single();

        const paymentData = {
          asaas_customer_id: payment.customer,
          client_id: (mapping as any)?.client_id || null,
          value: payment.value,
          net_value: payment.netValue,
          billing_type: payment.billingType,
          status: payment.status,
          due_date: payment.dueDate,
          payment_date: payment.paymentDate || null,
          description: payment.description,
          invoice_url: payment.invoiceUrl,
          bank_slip_url: payment.bankSlipUrl,
          asaas_subscription_id: payment.subscription || null,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await (supabase as any).from("asaas_payments").update(paymentData).eq("asaas_payment_id", payment.id);
          result.updated++;
        } else {
          await (supabase as any).from("asaas_payments").insert({
            asaas_payment_id: payment.id,
            ...paymentData,
          });
          result.created++;
        }
      }

      hasMore = data.hasMore;
      offset += 100;
    }
  } catch (e: any) {
    result.success = false;
    result.errors.push(e.message);
  }

  return result;
}

// ─── WEBHOOK ──────────────────────────────────────────────────────────────────

export async function processWebhookEvent(
  event: string,
  payment: AsaasPayment,
  autoCreateFinancial: boolean
): Promise<void> {
  // Atualizar status da cobrança no banco
  await (supabase as any)
    .from("asaas_payments")
    .update({
      status: payment.status,
      payment_date: payment.paymentDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("asaas_payment_id", payment.id);

  // Se pagamento confirmado e auto_create_financial ativo
  if (event === "PAYMENT_RECEIVED" && autoCreateFinancial) {
    // Buscar cobrança no banco para obter client_id e contract_id
    const { data: asaasPayment } = await (supabase as any)
      .from("asaas_payments")
      .select("*, clients(id, name)")
      .eq("asaas_payment_id", payment.id)
      .single();

    if (asaasPayment && !(asaasPayment as any).financial_entry_id) {
      // Buscar categoria de receita padrão
      const { data: category } = await supabase
        .from("financial_categories")
        .select("id")
        .eq("type", "receita")
        .limit(1)
        .single();

      // Criar lançamento financeiro
      const { data: entry } = await supabase
        .from("financial_entries")
        .insert({
          type: "receber",
          category_id: category?.id || null,
          client_id: (asaasPayment as any).client_id,
          contract_id: (asaasPayment as any).contract_id,
          description: (asaasPayment as any).description || `Cobrança Asaas #${payment.id}`,
          value: (asaasPayment as any).value,
          due_date: (asaasPayment as any).due_date,
          payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
          status: "pago",
          recurrence: "unica",
          notes: `Sincronizado automaticamente do Asaas. ID: ${payment.id}`,
        })
        .select("id")
        .single();

      if (entry) {
        // Vincular lançamento à cobrança
        await (supabase as any)
          .from("asaas_payments")
          .update({ financial_entry_id: entry.id })
          .eq("asaas_payment_id", payment.id);
      }
    }
  }
}

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

export function formatAsaasStatus(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendente", color: "text-amber-500" },
    RECEIVED: { label: "Recebido", color: "text-emerald-500" },
    CONFIRMED: { label: "Confirmado", color: "text-emerald-500" },
    OVERDUE: { label: "Vencido", color: "text-red-500" },
    REFUNDED: { label: "Estornado", color: "text-muted-foreground" },
    RECEIVED_IN_CASH: { label: "Rec. em dinheiro", color: "text-emerald-500" },
    REFUND_REQUESTED: { label: "Estorno solicitado", color: "text-amber-500" },
    CHARGEBACK_REQUESTED: { label: "Chargeback", color: "text-red-500" },
    CHARGEBACK_DISPUTE: { label: "Disputa", color: "text-red-500" },
    AWAITING_CHARGEBACK_REVERSAL: { label: "Aguardando reversão", color: "text-amber-500" },
    DUNNING_REQUESTED: { label: "Em cobrança", color: "text-amber-500" },
    DUNNING_RECEIVED: { label: "Cobrança recebida", color: "text-emerald-500" },
    AWAITING_RISK_ANALYSIS: { label: "Análise de risco", color: "text-amber-500" },
  };
  return map[status] || { label: status, color: "text-muted-foreground" };
}

export function formatBillingType(type: string): string {
  const map: Record<string, string> = {
    BOLETO: "Boleto",
    PIX: "Pix",
    CREDIT_CARD: "Cartão de Crédito",
    UNDEFINED: "Indefinido",
  };
  return map[type] || type;
}
