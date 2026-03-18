import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useReports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);

    const now = new Date();

    // ── 1. MRR History (last 6 months) ──
    const mrrHistory: MrrHistoryItem[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`;

      const { data: contracts } = await supabase
        .from("contracts")
        .select("value, client_id, start_date, end_date, status")
        .or(`end_date.is.null,end_date.gte.${d.toISOString().slice(0, 10)}`)
        .lte("start_date", endStr)
        .in("status", ["ativo", "pausado"]);

      const monthMrr = (contracts || []).reduce((s, c) => s + (Number(c.value) || 0), 0);
      const uniqueClients = new Set((contracts || []).map(c => c.client_id));
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      mrrHistory.push({ month: monthLabel, mrr: monthMrr, clients: uniqueClients.size });
    }

    // ── 2. Churn ──
    const { data: allContracts } = await supabase
      .from("contracts")
      .select("status, client_id, start_date, end_date");

    const activeContracts = (allContracts || []).filter(c => c.status === "ativo").length;
    const cancelledContracts = (allContracts || []).filter(c => c.status === "cancelado" || c.status === "encerrado").length;
    const totalContracts = (allContracts || []).length;
    const churnRate = totalContracts > 0 ? Math.round((cancelledContracts / totalContracts) * 100) : 0;

    const activeClientIds = new Set((allContracts || []).filter(c => c.status === "ativo").map(c => c.client_id));

    // ── 3. Fulfillment by Client ──
    const { data: checklists } = await supabase
      .from("delivery_checklists")
      .select("client_id, fulfillment_pct, clients(name)");

    const clientFulfillmentMap = new Map<string, { name: string; total: number; count: number }>();
    (checklists || []).forEach((cl: any) => {
      const key = cl.client_id;
      const existing = clientFulfillmentMap.get(key);
      if (existing) {
        existing.total += Number(cl.fulfillment_pct) || 0;
        existing.count += 1;
      } else {
        clientFulfillmentMap.set(key, {
          name: cl.clients?.name || "—",
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
    const { data: financialEntries } = await supabase
      .from("financial_entries")
      .select("client_id, type, value, status, clients(name)");

    const profitMap = new Map<string, { name: string; revenue: number; cost: number }>();
    (financialEntries || []).forEach((e: any) => {
      if (!e.client_id) return;
      const existing = profitMap.get(e.client_id) || { name: e.clients?.name || "—", revenue: 0, cost: 0 };
      const val = Number(e.value) || 0;
      if (e.type === "receita") existing.revenue += val;
      else if (e.type === "despesa") existing.cost += val;
      profitMap.set(e.client_id, existing);
    });

    // Add contract value
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

    // ── 5. Revenue by Month (last 6 months) ──
    const revenueByMonth: RevenueByMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

      const { data: entries } = await supabase
        .from("financial_entries")
        .select("type, value")
        .gte("due_date", monthStart)
        .lt("due_date", monthEnd);

      const receita = (entries || []).filter(e => e.type === "receita").reduce((s, e) => s + Number(e.value), 0);
      const despesa = (entries || []).filter(e => e.type === "despesa").reduce((s, e) => s + Number(e.value), 0);
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      revenueByMonth.push({ month: monthLabel, receita, despesa, lucro: receita - despesa });
    }

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

    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return { data, loading, refetch: fetchReports };
}
