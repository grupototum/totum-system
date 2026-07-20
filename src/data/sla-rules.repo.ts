import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function listActiveSlaRules(): Promise<Tables<"sla_rules">[]> {
  const { data, error } = await supabase.from("sla_rules").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return data || [];
}

// Usadas pela tela de gestão de SLAs (useSlaRules) — todas, não só ativas.
export async function listAllSlaRules(): Promise<Tables<"sla_rules">[]> {
  const { data, error } = await supabase.from("sla_rules").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSlaRule(rule: Omit<Tables<"sla_rules">, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase.from("sla_rules").insert(rule);
  if (error) throw error;
}

export async function updateSlaRule(id: string, rule: Omit<Tables<"sla_rules">, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase.from("sla_rules").update(rule).eq("id", id);
  if (error) throw error;
}

export async function deleteSlaRule(id: string) {
  const { error } = await supabase.from("sla_rules").delete().eq("id", id);
  if (error) throw error;
}
