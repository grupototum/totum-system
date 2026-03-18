import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExecutiveDashboardData {
  // Financial
  totalRevenue: number;
  mrr: number;
  receivables: number;
  overdueReceivables: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  revenueByClient: { name: string; value: number }[];
  revenueByService: { name: string; value: number }[];
  expensesByCategory: { name: string; value: number }[];
  // Operational
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  productivityByUser: { name: string; avatar?: string; total: number; completed: number; overdue: number }[];
  criticalTasks: { id: string; title: string; client: string; dueDate: string; responsible?: string }[];
  // Contracts
  activeContracts: number;
  defaultingContracts: number;
  contractFulfillment: { client: string; pct: number }[];
  // Strategic
  revenueForecast: number;
  topClients: { name: string; revenue: number; pct: number }[];
  revenueConcentration: number; // HHI-like
}

export function useExecutiveDashboard(period?: string) {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();

    // Determine date range
    const periodStart = period
      ? `${period}-01`
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const pDate = new Date(periodStart);
    const nextMonth = new Date(pDate.getFullYear(), pDate.getMonth() + 1, 1);
    const periodEnd = nextMonth.toISOString().split("T")[0];

    // Financial entries
    const { data: entries } = await supabase
      .from("financial_entries")
      .select("*, clients(name), financial_categories(name)")
      .gte("due_date", periodStart)
      .lt("due_date", periodEnd);

    const allEntries = entries || [];
    const income = allEntries.filter(e => e.type === "receber" && e.status === "pago");
    const totalRevenue = income.reduce((s, e) => s + Number(e.value), 0);
    const receivables = allEntries.filter(e => e.type === "receber" && e.status === "pendente").reduce((s, e) => s + Number(e.value), 0);
    const overdueReceivables = allEntries.filter(e => e.type === "receber" && e.status === "atrasado").reduce((s, e) => s + Number(e.value), 0);
    const paidExpenses = allEntries.filter(e => e.type === "pagar" && e.status === "pago");
    const totalExpenses = paidExpenses.reduce((s, e) => s + Number(e.value), 0);
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit; // simplified
    const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Revenue by client
    const revClientMap: Record<string, number> = {};
    income.forEach(e => {
      const name = (e as any).clients?.name || "Sem cliente";
      revClientMap[name] = (revClientMap[name] || 0) + Number(e.value);
    });
    const revenueByClient = Object.entries(revClientMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Expenses by category
    const expCatMap: Record<string, number> = {};
    paidExpenses.forEach(e => {
      const name = (e as any).financial_categories?.name || "Sem categoria";
      expCatMap[name] = (expCatMap[name] || 0) + Number(e.value);
    });
    const expensesByCategory = Object.entries(expCatMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // MRR from active contracts
    const { data: contracts } = await supabase
      .from("contracts")
      .select("value, client_id, clients(name), status")
      .eq("status", "ativo");
    const mrr = (contracts || []).reduce((s, c) => s + (Number(c.value) || 0), 0);
    const activeContracts = (contracts || []).length;

    // Defaulting contracts (with overdue entries)
    const defaultingContracts = allEntries.filter(e => e.type === "receber" && e.status === "atrasado" && e.contract_id).length;

    // Contract fulfillment
    const { data: checklists } = await supabase
      .from("delivery_checklists")
      .select("fulfillment_pct, clients(name)")
      .limit(100);
    const fulfillmentMap: Record<string, number[]> = {};
    (checklists || []).forEach((c: any) => {
      const name = c.clients?.name || "—";
      if (!fulfillmentMap[name]) fulfillmentMap[name] = [];
      fulfillmentMap[name].push(Number(c.fulfillment_pct) || 0);
    });
    const contractFulfillment = Object.entries(fulfillmentMap)
      .map(([client, pcts]) => ({ client, pct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) }))
      .sort((a, b) => a.pct - b.pct);

    // Tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, responsible_id, clients(name)");

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url");
    const profileMap = new Map<string, { name: string; avatar?: string }>();
    (profiles || []).forEach((p: any) => profileMap.set(p.user_id, { name: p.full_name, avatar: p.avatar_url }));

    const allTasks = tasks || [];
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === "concluido").length;
    const pendingTasks = allTasks.filter(t => t.status === "pendente").length;
    const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "concluido").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Productivity by user
    const userMap: Record<string, { name: string; avatar?: string; total: number; completed: number; overdue: number }> = {};
    allTasks.forEach(t => {
      const key = t.responsible_id || "unassigned";
      const prof = t.responsible_id ? profileMap.get(t.responsible_id) : null;
      if (!userMap[key]) {
        userMap[key] = { name: prof?.name || "Sem responsável", avatar: prof?.avatar, total: 0, completed: 0, overdue: 0 };
      }
      userMap[key].total++;
      if (t.status === "concluido") userMap[key].completed++;
      if (t.due_date && new Date(t.due_date) < now && t.status !== "concluido") userMap[key].overdue++;
    });
    const productivityByUser = Object.values(userMap).sort((a, b) => b.total - a.total);

    // Critical tasks
    const criticalTasks = allTasks
      .filter(t => (t.priority === "urgente" || t.priority === "alta") && t.status !== "concluido")
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        title: t.title,
        client: (t as any).clients?.name || "—",
        dueDate: t.due_date || "",
        responsible: t.responsible_id ? profileMap.get(t.responsible_id)?.name : undefined,
      }));

    // Strategic - top clients & concentration
    const topClients = revenueByClient.slice(0, 5).map(c => ({
      name: c.name,
      revenue: c.value,
      pct: totalRevenue > 0 ? Math.round((c.value / totalRevenue) * 100) : 0,
    }));
    const hhi = revenueByClient.reduce((s, c) => {
      const share = totalRevenue > 0 ? c.value / totalRevenue : 0;
      return s + share * share;
    }, 0);
    const revenueConcentration = Math.round(hhi * 10000); // basis points

    // Revenue forecast (simple: MRR projection)
    const revenueForecast = mrr;

    // Revenue by service (using categories for now)
    const revenueByService = revenueByClient.slice(0, 5);

    setData({
      totalRevenue, mrr, receivables, overdueReceivables, totalExpenses,
      grossProfit, netProfit, margin, revenueByClient, revenueByService,
      expensesByCategory,
      totalTasks, pendingTasks, completedTasks, overdueTasks, completionRate,
      productivityByUser, criticalTasks,
      activeContracts, defaultingContracts, contractFulfillment,
      revenueForecast, topClients, revenueConcentration,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
