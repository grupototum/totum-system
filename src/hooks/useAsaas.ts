import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  getAsaasConfig,
  saveAsaasConfig,
  testAsaasConnection,
  syncClientToAsaas,
  syncAllClientsToAsaas,
  createAsaasPayment,
  syncPaymentsFromAsaas,
  createAsaasSubscription,
  deleteAsaasPayment,
  refundAsaasPayment,
  deleteAsaasSubscription,
  getAsaasPixQrCode,
  formatAsaasStatus,
  formatBillingType,
  formatCycle,
  type AsaasConfig,
  type CreatePaymentInput,
  type CreateSubscriptionInput,
  type SyncResult,
} from "@/services/asaasService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

export function useAsaasConfig() {
  return useQuery({
    queryKey: ["asaas_config"],
    queryFn: getAsaasConfig,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveAsaasConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<AsaasConfig>) => saveAsaasConfig(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas_config"] });
      toast({ title: "Configuração salva", description: "Integração Asaas atualizada com sucesso." });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    },
  });
}

export function useTestAsaasConnection() {
  return useMutation({
    mutationFn: ({ apiKey, environment }: { apiKey: string; environment?: "production" | "sandbox" }) =>
      testAsaasConnection(apiKey, environment),
    onSuccess: (result) => {
      if (result.ok) {
        toast({ title: "Conexão bem-sucedida", description: `Conta: ${result.name}` });
      } else {
        toast({ title: "Falha na conexão", description: result.error, variant: "destructive" });
      }
    },
  });
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export function useSyncClientToAsaas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, apiKey }: { clientId: string; apiKey: string }) =>
      syncClientToAsaas(clientId, apiKey),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["asaas_customers"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: result.created ? "Cliente criado no Asaas" : "Cliente sincronizado",
        description: `ID Asaas: ${result.asaasId}`,
      });
    },
    onError: (e: any) => {
      toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
    },
  });
}

export function useSyncAllClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apiKey: string) => syncAllClientsToAsaas(apiKey),
    onSuccess: (result: SyncResult) => {
      qc.invalidateQueries({ queryKey: ["asaas_customers"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Sincronização concluída",
        description: `${result.created} criados, ${result.updated} atualizados${result.errors.length > 0 ? `, ${result.errors.length} erros` : ""}`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });
    },
    onError: (e: any) => {
      toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
    },
  });
}

export function useAsaasCustomerMapping(clientId?: string) {
  return useQuery({
    queryKey: ["asaas_customers", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data } = await supabase
        .from("asaas_customers")
        .select("*")
        .eq("client_id", clientId)
        .single();
      return data;
    },
    enabled: !!clientId,
  });
}

// ─── COBRANÇAS ────────────────────────────────────────────────────────────────

export function useCreateAsaasPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      apiKey,
      contractId,
      clientId,
    }: {
      input: CreatePaymentInput;
      apiKey: string;
      contractId?: string;
      clientId?: string;
    }) => createAsaasPayment(input, apiKey, contractId, clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas_payments"] });
      toast({ title: "Cobrança criada", description: "Cobrança gerada com sucesso no Asaas." });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao criar cobrança", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteAsaasPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, apiKey }: { paymentId: string; apiKey: string }) =>
      deleteAsaasPayment(paymentId, apiKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas_payments"] });
      toast({ title: "Cobrança excluída" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    },
  });
}

export function useRefundAsaasPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, apiKey, value }: { paymentId: string; apiKey: string; value?: number }) =>
      refundAsaasPayment(paymentId, apiKey, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas_payments"] });
      toast({ title: "Estorno solicitado" });
    },
    onError: (e: any) => {
      toast({ title: "Erro no estorno", description: e.message, variant: "destructive" });
    },
  });
}

export function useGetPixQrCode() {
  return useMutation({
    mutationFn: async ({ paymentId, apiKey }: { paymentId: string; apiKey: string }) =>
      getAsaasPixQrCode(paymentId, apiKey),
  });
}

export function useAsaasPaymentsByClient(clientId?: string) {
  return useQuery({
    queryKey: ["asaas_payments", "client", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data } = await supabase
        .from("asaas_payments")
        .select("*")
        .eq("client_id", clientId)
        .order("due_date", { ascending: false });
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useAsaasPayments(filters?: { status?: string; clientId?: string }) {
  return useQuery({
    queryKey: ["asaas_payments", filters],
    queryFn: async () => {
      let query = supabase
        .from("asaas_payments")
        .select("*, clients(name)")
        .order("due_date", { ascending: false })
        .limit(200);

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.clientId) query = query.eq("client_id", filters.clientId);

      const { data } = await query;
      return data || [];
    },
  });
}

export function useSyncPaymentsFromAsaas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apiKey: string) => syncPaymentsFromAsaas(apiKey),
    onSuccess: (result: SyncResult) => {
      qc.invalidateQueries({ queryKey: ["asaas_payments"] });
      qc.invalidateQueries({ queryKey: ["financial_entries"] });
      toast({
        title: "Cobranças sincronizadas",
        description: `${result.created} novas, ${result.updated} atualizadas${result.errors.length > 0 ? `, ${result.errors.length} erros` : ""}`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });
    },
    onError: (e: any) => {
      toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
    },
  });
}

// ─── ASSINATURAS ──────────────────────────────────────────────────────────────

export function useCreateAsaasSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      apiKey,
      contractId,
      clientId,
    }: {
      input: CreateSubscriptionInput;
      apiKey: string;
      contractId?: string;
      clientId?: string;
    }) => createAsaasSubscription(input, apiKey, contractId, clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas_subscriptions"] });
      toast({ title: "Assinatura criada", description: "Assinatura recorrente criada no Asaas." });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao criar assinatura", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteAsaasSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, apiKey }: { subscriptionId: string; apiKey: string }) =>
      deleteAsaasSubscription(subscriptionId, apiKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas_subscriptions"] });
      toast({ title: "Assinatura cancelada" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" });
    },
  });
}

export function useAsaasSubscriptions(clientId?: string) {
  return useQuery({
    queryKey: ["asaas_subscriptions", clientId],
    queryFn: async () => {
      let query = supabase
        .from("asaas_subscriptions")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (clientId) query = query.eq("client_id", clientId);

      const { data } = await query;
      return data || [];
    },
  });
}

// ─── ESTATÍSTICAS ─────────────────────────────────────────────────────────────

export function useAsaasStats() {
  return useQuery({
    queryKey: ["asaas_stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("asaas_payments")
        .select("status, value");

      if (!data) return { total: 0, received: 0, pending: 0, overdue: 0, totalValue: 0, receivedValue: 0 };

      const items = data as any[];
      const total = items.length;
      const received = items.filter((p) => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status)).length;
      const pending = items.filter((p) => p.status === "PENDING").length;
      const overdue = items.filter((p) => p.status === "OVERDUE").length;
      const totalValue = items.reduce((s, p) => s + Number(p.value), 0);
      const receivedValue = items
        .filter((p) => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status))
        .reduce((s, p) => s + Number(p.value), 0);

      return { total, received, pending, overdue, totalValue, receivedValue };
    },
  });
}

export { formatAsaasStatus, formatBillingType, formatCycle };
