import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { attachOrganizationId } from "@/lib/tenant";

export type ContractRow = Tables<"contracts"> & {
  clients?: { name: string } | null;
  plans?: { name: string } | null;
  contract_types?: { name: string } | null;
};

export async function listActiveContractsForDropdown() {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, title, client_id")
    .eq("status", "ativo")
    .order("title");
  if (error) throw error;
  return data || [];
}

// Usada pelo dashboard executivo (useExecutiveDashboard) — só contratos ativos com o cliente.
export async function listActiveContractsWithClients() {
  const { data, error } = await supabase
    .from("contracts")
    .select("value, client_id, clients(*), status")
    .eq("status", "ativo");
  if (error) throw error;
  return data || [];
}

export async function listActiveContractTypes() {
  const { data, error } = await supabase.from("contract_types").select("id, name").eq("is_active", true).order("name");
  if (error) throw error;
  return data || [];
}

export async function listContractsWithRelations(): Promise<ContractRow[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*, clients(name), plans(name), contract_types(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ContractRow[]) || [];
}

export async function createContract(values: Partial<Tables<"contracts">>, organizationId?: string) {
  const payload = attachOrganizationId(values as any, organizationId);
  const { error } = await supabase.from("contracts").insert(payload);
  if (error) throw error;
}

export async function updateContract(id: string, values: Partial<Tables<"contracts">>) {
  const { error } = await supabase.from("contracts").update(values).eq("id", id);
  if (error) throw error;
}

// Ao ativar um contrato vinculado a um plano, gera o checklist de entregas
// a partir do modelo do plano — mesma lógica que já existia em useContracts.
export async function generateDeliveriesForActivatedContract(params: {
  contractId: string;
  clientId: string;
  planId: string;
  billingFrequency?: string | null;
  organizationId?: string | null;
}) {
  const { contractId, clientId, planId, billingFrequency, organizationId } = params;

  const { data: modelItems, error: modelErr } = await supabase
    .from("delivery_model_items")
    .select("*")
    .eq("plan_id", planId);
  if (modelErr) throw modelErr;
  if (!modelItems || modelItems.length === 0) return 0;

  const { data: checklist, error: checklistErr } = await supabase
    .from("delivery_checklists")
    .insert({
      client_id: clientId,
      contract_id: contractId,
      plan_id: planId,
      period: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date()),
      frequency: billingFrequency || "mensal",
      fulfillment_pct: 0,
      organization_id: organizationId ?? null,
    })
    .select()
    .single();
  if (checklistErr) throw checklistErr;
  if (!checklist) return 0;

  const itemsToInsert = modelItems.map((it, idx) => ({
    checklist_id: checklist.id,
    name: it.name,
    delivery_model_item_id: it.id,
    // status: null é válido — "pendente" não está no enum
    sort_order: (it as any).sort_order ?? idx,
    responsible_id: (it as any).suggested_responsible_id ?? null,
  }));
  const { error: itemsErr } = await supabase.from("delivery_checklist_items").insert(itemsToInsert);
  if (itemsErr) throw itemsErr;

  return modelItems.length;
}
