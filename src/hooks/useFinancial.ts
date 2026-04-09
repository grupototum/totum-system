import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { demoFinancialEntries } from "@/data/demoData";

export type FinancialEntryRow = Tables<"financial_entries"> & {
  clients?: { name: string } | null;
};

export function useFinancialEntries(filters?: { month?: string; startDate?: string; endDate?: string }) {
  const { isDemoMode } = useDemo();
  const [entries, setEntries] = useState<FinancialEntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      let filtered = demoFinancialEntries as FinancialEntryRow[];
      // Remove lançamentos zerados
      filtered = filtered.filter(e => Number(e.value) !== 0);

      if (filters?.month) {
        filtered = filtered.filter(e => e.due_date.startsWith(filters.month!));
      }
      if (filters?.startDate) {
        filtered = filtered.filter(e => e.due_date >= filters.startDate!);
      }
      if (filters?.endDate) {
        filtered = filtered.filter(e => e.due_date <= filters.endDate!);
      }
      setEntries(filtered);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from("financial_entries")
        .select("*, clients(name)")
        .order("due_date", { ascending: false });

      if (filters?.month) {
        query = query.gte("due_date", `${filters.month}-01`).lte("due_date", `${filters.month}-31`);
      }
      if (filters?.startDate) {
        query = query.gte("due_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("due_date", filters.endDate);
      }

      const { data, error } = await query.limit(300);
      if (error) throw error;
      
      // Remove 183 lançamentos zerados residualmente da API
      const validEntries = ((data as FinancialEntryRow[]) || []).filter(e => Number(e.value) !== 0);
      setEntries(validEntries);
    } catch (err) {
      console.error("Error fetching financial entries:", err);
    } finally {
      setLoading(false);
    }
  }, [filters?.month, filters?.startDate, filters?.endDate, isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const summary = useMemo(() => {
    const income = entries
      .filter((e) => e.type === "receber" && (e.status === "pago"))
      .reduce((s, e) => s + Number(e.value), 0);
    const expense = entries
      .filter((e) => e.type === "pagar" && (e.status === "pago"))
      .reduce((s, e) => s + Number(e.value), 0);
    const overdue = entries
      .filter((e) => e.status === "atrasado")
      .reduce((s, e) => s + Number(e.value), 0);
    const overdueCount = entries.filter((e) => e.status === "atrasado").length;

    return { income, expense, profit: income - expense, overdue, overdueCount };
  }, [entries]);

  return { entries, loading, summary, refetch: fetch };
}
