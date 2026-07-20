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

// Usadas pela importação de dados (useImportData) para casar categoria/conta pelo nome.
export async function listFinancialCategoriesForMatching() {
  const { data, error } = await supabase.from("financial_categories").select("id, name");
  if (error) throw error;
  return data || [];
}

export async function listBankAccountsForMatching() {
  const { data, error } = await supabase.from("bank_accounts").select("id, name");
  if (error) throw error;
  return data || [];
}

// Usadas pelo dashboard executivo (useExecutiveDashboard).
export async function listFinancialEntriesForPeriod(periodStart: string, periodEnd: string) {
  const { data, error } = await supabase
    .from("financial_entries")
    .select("*, clients(*), financial_categories(name)")
    .gte("due_date", periodStart)
    .lt("due_date", periodEnd);
  if (error) throw error;
  return data || [];
}

export async function listPaidFinancialEntriesForHistory(historyStart: string, periodEnd: string) {
  const { data, error } = await supabase
    .from("financial_entries")
    .select("value, type, due_date, status, entry_class")
    .gte("due_date", historyStart)
    .lt("due_date", periodEnd)
    .eq("status", "pago");
  if (error) throw error;
  return data || [];
}
