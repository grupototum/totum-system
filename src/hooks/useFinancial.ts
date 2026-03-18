import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { demoFinancialEntries } from "@/data/demoData";

export type FinancialEntryRow = Tables<"financial_entries"> & {
  clients?: { name: string } | null;
};

export function useFinancialEntries(month?: string) {
  const { isDemoMode } = useDemo();
  const [entries, setEntries] = useState<FinancialEntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      let filtered = demoFinancialEntries as FinancialEntryRow[];
      if (month) {
        filtered = filtered.filter(e => e.due_date.startsWith(month));
      }
      setEntries(filtered);
      setLoading(false);
      return;
    }
    setLoading(true);

    let query = supabase
      .from("financial_entries")
      .select("*, clients(name)")
      .order("due_date", { ascending: false });

    if (month) {
      query = query.gte("due_date", `${month}-01`).lte("due_date", `${month}-31`);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error("Error fetching financial entries:", error);
    } else {
      setEntries((data as FinancialEntryRow[]) || []);
    }
    setLoading(false);
  }, [month, isDemoMode]);

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
