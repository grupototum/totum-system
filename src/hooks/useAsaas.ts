import { useState, useEffect, useCallback } from "react";
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
  getAsaasPaymentsByClient,
  syncPaymentsFromAsaas,
  formatAsaasStatus,
  formatBillingType,
  type AsaasConfig,
  type CreatePaymentInput,
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
    mutationFn: (apiKey: string) => testAsaasConnection(apiKey),
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

// ─── ESTATÍSTICAS ─────────────────────────────────────────────────────────────

export function useAsaasStats() {
  return useQuery({
    queryKey: ["asaas_stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("asaas_payments")
        .select("status, value");

      if (!data) return { total: 0, received: 0, pending: 0, overdue: 0, totalValue: 0, receivedValue: 0 };

      const total = data.length;
      const received = data.filter(p => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status)).length;
      const pending = data.filter(p => p.status === "PENDING").length;
      const overdue = data.filter(p => p.status === "OVERDUE").length;
      const totalValue = data.reduce((s, p) => s + Number(p.value), 0);
      const receivedValue = data
        .filter(p => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status))
        .reduce((s, p) => s + Number(p.value), 0);

      return { total, received, pending, overdue, totalValue, receivedValue };
    },
  });
}

export { formatAsaasStatus, formatBillingType };
