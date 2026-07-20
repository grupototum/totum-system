// Camada de acesso a dados de `delivery_checklists`/`delivery_checklist_items`
// (a criação na ativação do contrato mora em contracts.repo.ts, que já
// existia; aqui ficam listagem/edição usadas pelo Client Hub).
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function listChecklistsForClient(clientId: string) {
  const { data, error } = await supabase
    .from("delivery_checklists")
    .select("*, plans(name), delivery_checklist_items(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Amostra usada pelo dashboard executivo (useExecutiveDashboard) pra calcular fulfillment médio por cliente.
export async function listChecklistFulfillmentSample(limit = 100) {
  const { data, error } = await supabase
    .from("delivery_checklists")
    .select("fulfillment_pct, clients(*)")
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function updateChecklistItemStatus(itemId: string, updates: Partial<Tables<"delivery_checklist_items">>) {
  const { error } = await supabase.from("delivery_checklist_items").update(updates).eq("id", itemId);
  if (error) throw error;
}

export async function updateChecklistItemJustification(itemId: string, justification: string) {
  const { error } = await supabase.from("delivery_checklist_items").update({ justification }).eq("id", itemId);
  if (error) throw error;
}

export async function finalizeChecklist(checklistId: string, values: { fulfillmentPct: number; completedBy: string | null }) {
  const { error } = await supabase
    .from("delivery_checklists")
    .update({
      fulfillment_pct: values.fulfillmentPct,
      completed_at: new Date().toISOString(),
      completed_by: values.completedBy,
    })
    .eq("id", checklistId);
  if (error) throw error;
}
