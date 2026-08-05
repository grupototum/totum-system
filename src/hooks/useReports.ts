import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientDisplayName } from "@/lib/clients";
import { useDemo } from "@/contexts/DemoContext";
import { demoReportsData } from "@/data/demoData";
import { toast } from "@/hooks/use-toast";

export interface MrrHistoryItem {
  month: string;
  mrr: number;
  clients: number;
}

export interface ChurnData {
  totalClientsStart: number;
  totalClientsEnd: number;
  cancelledContracts: number;
  churnRate: number;
  activeContracts: number;
}

export interface FulfillmentByClient {
  clientName: string;
  clientId: string;
  avgFulfillment: number;
  totalChecklists: number;
}

export interface ClientProfitability {
  clientName: string;
  clientId: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  contractValue: number;
}

export interface RevenueByMonth {
  month: string;
  receita: number;
  despesa: number;
  lucro: number;
}

export interface ReportsData {
  mrrHistory: MrrHistoryItem[];
  churn: ChurnData;
  fulfillmentByClient: FulfillmentByClient[];
  profitability: ClientProfitability[];
  revenueByMonth: RevenueByMonth[];
  currentMrr: number;
  forecastNext3: number;
}

export interface ReportsFilters {
  startDate: Date;
  endDate: Date;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (current <= last) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

export function useReports(filters?: ReportsFilters) {
  const { isDemoMode } = useDemo();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const startKey = filters ? toDateStr(filters.startDate) : "";
  const endKey = filters ? toDateStr(filters.endDate) : "";

  const fetchReports = useCallback(async () => {
    setLoading(true);

    if (isDemoMode) {
      setData(demoReportsData as ReportsData);
      setLoading(false);
      return;
    }

    try {
    const now = new Date();
    const rangeStart = filters?.startDate || new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const rangeEnd = filters?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const months = getMonthsBetween(rangeStart, rangeEnd);

    // Uma única busca de contratos, reutilizada pelo histórico de MRR e pelo churn
    // (antes eram N queries, uma por mês, no histórico de MRR)
    const { data: allContracts } = await supabase
      .from("contracts")
      .select("status, client_id, start_date, end_date, value");

    // ── 1. MRR History ──
    const mrrHistory: MrrHistoryItem[] = months.map((d) => {
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const endStr = toDateStr(endOfMonth);
      const startStr = toDateStr(d);
      const monthContracts = (allContracts || []).filter((c) =>
        ["ativo", "pausado"].includes(c.status) &&
        c.start_date <= endStr &&
        (!c.end_date || c.end_date >= startStr)
      );
      const monthMrr = monthContracts.reduce((s, c) => s + (Number(c.value) || 0), 0);
      const uniqueClients = new Set(monthContracts.map(c => c.client_id));
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      return { month: monthLabel, mrr: monthMrr, clients: uniqueClients.size };
    });

    // ── 2. Churn ──

    const activeContracts = (allContracts || []).filter(c => c.status === "ativo").length;
    const cancelledContracts = (allContracts || []).filter(c => c.status === "cancelado" || c.status === "encerrado").length;
    const totalContracts = (allContracts || []).length;
    const churnRate = totalContracts > 0 ? Math.round((cancelledContracts / totalContracts) * 100) : 0;
    const activeClientIds = new Set((allContracts || []).filter(c => c.status === "ativo").map(c => c.client_id));

    // ── 3. Fulfillment by Client ──
    let checklistQuery = supabase
      .from("delivery_checklists")
      .select("client_id, fulfillment_pct, period, clients(*)");

    if (filters) {
      const startPeriod = `${rangeStart.getFullYear()}-${String(rangeStart.getMonth() + 1).padStart(2, "0")}`;
      const endPeriod = `${rangeEnd.getFullYear()}-${String(rangeEnd.getMonth() + 1).padStart(2, "0")}`;
      checklistQuery = checklistQuery.gte("period", startPeriod).lte("period", endPeriod);
    }

    const { data: checklists } = await checklistQuery;

    const clientFulfillmentMap = new Map<string, { name: string; total: number; count: number }>();
    (checklists || []).forEach((cl: any) => {
      const key = cl.client_id;
      const existing = clientFulfillmentMap.get(key);
      if (existing) {
        existing.total += Number(cl.fulfillment_pct) || 0;
        existing.count += 1;
      } else {
        clientFulfillmentMap.set(key, {
          name: getClientDisplayName(cl.clients) || "—",
          total: Number(cl.fulfillment_pct) || 0,
          count: 1,
        });
      }
    });

    const fulfillmentByClient: FulfillmentByClient[] = Array.from(clientFulfillmentMap.entries())
      .map(([clientId, v]) => ({
        clientId,
        clientName: v.name,
        avgFulfillment: Math.round(v.total / v.count),
        totalChecklists: v.count,
      }))
      .sort((a, b) => a.avgFulfillment - b.avgFulfillment);

    // ── 4. Profitability by Client ──
    let financialQuery = supabase
      .from("financial_entries")
      .select("client_id, type, value, status, due_date, entry_class, clients(*)");

    if (filters) {
      financialQuery = financialQuery
        .gte("due_date", toDateStr(filters.startDate))
        .lte("due_date", toDateStr(filters.endDate));
    }

    const { data: financialEntries } = await financialQuery;

    const profitMap = new Map<string, { name: string; revenue: number; cost: number }>();
    (financialEntries || []).forEach((e: any) => {
      if (!e.client_id) return;
      const existing = profitMap.get(e.client_id) || { name: getClientDisplayName(e.clients) || "—", revenue: 0, cost: 0 };
      const val = Number(e.value) || 0;
      if (e.type === "receber") existing.revenue += val;
      else if (e.type === "pagar") existing.cost += val;
      profitMap.set(e.client_id, existing);
    });

    const contractsByClient = new Map<string, number>();
    (allContracts || []).forEach(c => {
      const prev = contractsByClient.get(c.client_id) || 0;
      contractsByClient.set(c.client_id, prev + (Number((c as any).value) || 0));
    });

    const profitability: ClientProfitability[] = Array.from(profitMap.entries())
      .map(([clientId, v]) => {
        const profit = v.revenue - v.cost;
        return {
          clientId,
          clientName: v.name,
          revenue: v.revenue,
          cost: v.cost,
          profit,
          margin: v.revenue > 0 ? Math.round((profit / v.revenue) * 100) : 0,
          contractValue: contractsByClient.get(clientId) || 0,
        };
      })
      .sort((a, b) => b.profit - a.profit);

    // ── 5. Revenue by Month ── (uma única query pro range inteiro, agrupada em JS)
    const lastMonth = months[months.length - 1] || rangeStart;
    const rangeEndExclusive = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1);
    const { data: rangeEntries } = await supabase
      .from("financial_entries")
      .select("type, value, due_date")
      .gte("due_date", toDateStr(months[0] || rangeStart))
      .lt("due_date", toDateStr(rangeEndExclusive));

    const revenueByMonth: RevenueByMonth[] = months.map((d) => {
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
      const entries = (rangeEntries || []).filter(e => e.due_date >= monthStart && e.due_date < monthEnd);

      const receita = entries.filter(e => e.type === "receber").reduce((s, e) => s + Number(e.value), 0);
      const despesa = entries.filter(e => e.type === "pagar").reduce((s, e) => s + Number(e.value), 0);
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      return { month: monthLabel, receita, despesa, lucro: receita - despesa };
    });

    const currentMrr = mrrHistory[mrrHistory.length - 1]?.mrr || 0;

    setData({
      mrrHistory,
      churn: {
        totalClientsStart: activeClientIds.size + cancelledContracts,
        totalClientsEnd: activeClientIds.size,
        cancelledContracts,
        churnRate,
        activeContracts,
      },
      fulfillmentByClient,
      profitability,
      revenueByMonth,
      currentMrr,
      forecastNext3: currentMrr * 3,
    });
    } catch (err) {
      console.error("Error fetching reports:", err);
      toast({ title: "Erro ao carregar relatórios", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey, isDemoMode]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return { data, loading, refetch: fetchReports };
}
