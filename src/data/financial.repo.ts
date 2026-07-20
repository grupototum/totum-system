import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export async function listActiveFinancialCategories() {
  const { data, error } = await supabase
    .from("financial_categories")
    .select("id, name, type")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

export async function listActiveCostCenters() {
  const { data, error } = await supabase
    .from("cost_centers")
    .select("id, name")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

export async function listActiveExpenseTypes() {
  const { data, error } = await supabase
    .from("expense_types")
    .select("id, name")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

export async function createFinancialEntries(entries: TablesInsert<"financial_entries">[]) {
  const { error } = await supabase.from("financial_entries").insert(entries);
  if (error) throw error;
}

export async function countActiveFinancialCategories() {
  const { count, error } = await supabase.from("financial_categories").select("*", { count: "exact", head: true }).eq("is_active", true);
  if (error) throw error;
  return count || 0;
}

export async function countActiveBankAccounts() {
  const { count, error } = await supabase.from("bank_accounts").select("*", { count: "exact", head: true }).eq("is_active", true);
  if (error) throw error;
  return count || 0;
}

export async function countActiveExpenseTypes() {
  const { count, error } = await supabase.from("expense_types").select("*", { count: "exact", head: true }).eq("is_active", true);
  if (error) throw error;
  return count || 0;
}

export async function countActiveCostCenters() {
  const { count, error } = await supabase.from("cost_centers").select("*", { count: "exact", head: true }).eq("is_active", true);
  if (error) throw error;
  return count || 0;
}
