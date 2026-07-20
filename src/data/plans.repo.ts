import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// "Pacotes" (usePackages) são a tabela `plans` vista com seus itens de
// entrega (delivery_model_items) — mesmo padrão de tasks.repo.ts para filhos.
export type PackageRow = Tables<"plans"> & {
  items?: Tables<"delivery_model_items">[];
};

export async function listActivePlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, value, frequency")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

// "Pacote Estratégico" no form de contrato reaproveita a tabela `plans` com
// outro shape (total_sale = value) — legado, preservado como está.
export async function listActivePlansAsPackageOptions() {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, value, frequency")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data || []).map((p) => ({ id: p.id, name: p.name, total_sale: p.value }));
}

export async function listActivePackagesWithItems(): Promise<PackageRow[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*, items:delivery_model_items(*)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data as PackageRow[]) || [];
}

export async function createPackage(values: Partial<Tables<"plans">>) {
  const { error } = await supabase.from("plans").insert({ ...values, name: values.name || "Novo Pacote" } as any);
  if (error) throw error;
}

export async function updatePackage(id: string, values: Partial<Tables<"plans">>) {
  const { error } = await supabase.from("plans").update(values).eq("id", id);
  if (error) throw error;
}

export async function deactivatePackage(id: string) {
  const { error } = await supabase.from("plans").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function createDeliveryModelItem(item: {
  planId: string;
  name: string;
  taskType?: string;
  suggestedPriority?: string;
  sortOrder: number;
}) {
  const { error } = await supabase.from("delivery_model_items").insert({
    plan_id: item.planId,
    name: item.name,
    task_type: (item.taskType ?? "outro") as any,
    suggested_priority: (item.suggestedPriority ?? "media") as any,
    sort_order: item.sortOrder,
  });
  if (error) throw error;
}

export async function updateDeliveryModelItem(
  itemId: string,
  values: Partial<Pick<Tables<"delivery_model_items">, "name" | "task_type" | "suggested_priority" | "sort_order" | "suggested_responsible_id">>
) {
  const { error } = await supabase.from("delivery_model_items").update(values as any).eq("id", itemId);
  if (error) throw error;
}

export async function deleteDeliveryModelItem(itemId: string) {
  const { error } = await supabase.from("delivery_model_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function reorderDeliveryModelItems(planId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, idx) =>
    supabase.from("delivery_model_items").update({ sort_order: idx }).eq("id", id).eq("plan_id", planId)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
