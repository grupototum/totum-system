import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoFinancialEntries } from "@/data/demoData";

export type FinancialEntryRow = Tables<"financial_entries"> & {
  clients?: { name?: string | null; company_name?: string | null } | null;
  entry_class?: "receita" | "custo" | "despesa" | null;
  nature?: "fixo" | "variavel" | null;
};

const PAGE_SIZE = 25;

export function useFinancialEntries(filters?: { month?: string; startDate?: string; endDate?: string }, page = 1) {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  // `entries`: todos os lançamentos do período filtrado (sem paginação) — alimenta
  // os totais do dashboard e a visão kanban, que precisam do conjunto completo.
  const [entries, setEntries] = useState<FinancialEntryRow[]>([]);
  // `pagedEntries`: fatia de 25 itens para a tabela "Lançamentos", buscada via
  // .range() no servidor. totalCount vem do count: 'exact' da mesma query.
  const [pagedEntries, setPagedEntries] = useState<FinancialEntryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const applyFilters = useCallback(<T extends { gte: any; lte: any }>(query: T): T => {
    let q = query;
    if (filters?.month) {
      q = q.gte("due_date", `${filters.month}-01`).lte("due_date", `${filters.month}-31`);
    }
    if (filters?.startDate) {
      q = q.gte("due_date", filters.startDate);
    }
    if (filters?.endDate) {
      q = q.lte("due_date", filters.endDate);
    }
    return q;
  }, [filters?.month, filters?.startDate, filters?.endDate]);

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
      setTotalCount(filtered.length);
      const from = (page - 1) * PAGE_SIZE;
      setPagedEntries(filtered.slice(from, from + PAGE_SIZE));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Conjunto completo do período (sem limit artificial) — usado por
      // totais/kanban, que precisam enxergar todos os lançamentos filtrados.
      const fullQuery = applyFilters(
        supabase.from("financial_entries").select("*, clients(*)").order("due_date", { ascending: false }) as any
      );
      // Fatia paginada para a tabela, com contagem exata via count: 'exact'.
      const from = (page - 1) * PAGE_SIZE;
      const pagedQuery = applyFilters(
        supabase
          .from("financial_entries")
          .select("*, clients(*)", { count: "exact" })
          .order("due_date", { ascending: false }) as any
      ).range(from, from + PAGE_SIZE - 1);

      const [fullRes, pagedRes] = await Promise.all([fullQuery, pagedQuery]);
      if (fullRes.error) throw fullRes.error;
      if (pagedRes.error) throw pagedRes.error;

      // Remove lançamentos zerados residuais da API
      const validEntries = ((fullRes.data as FinancialEntryRow[]) || []).filter(e => Number(e.value) !== 0);
      setEntries(validEntries);
      setPagedEntries(((pagedRes.data as FinancialEntryRow[]) || []).filter(e => Number(e.value) !== 0));
      setTotalCount(pagedRes.count ?? validEntries.length);
    } catch (err) {
      console.error("Error fetching financial entries:", err);
    } finally {
      setLoading(false);
    }
    // applyFilters já memoiza filters.month/startDate/endDate como suas próprias deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyFilters, page, isDemoMode, tenant?.organization_id]);

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

  return { entries, pagedEntries, totalCount, pageSize: PAGE_SIZE, loading, summary, refetch: fetch };
}
