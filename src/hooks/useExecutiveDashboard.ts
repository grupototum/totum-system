import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoExecutiveDashboardData } from "@/data/demoData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getClientDisplayName } from "@/lib/clients";

interface ExecutiveDashboardData {
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
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  productivityByUser: { name: string; avatar?: string; total: number; completed: number; overdue: number }[];
  criticalTasks: { id: string; title: string; client: string; dueDate: string; responsible?: string }[];
  activeContracts: number;
  defaultingContracts: number;
  contractFulfillment: { client: string; pct: number }[];
  revenueForecast: number;
  topClients: { name: string; revenue: number; pct: number }[];
  revenueConcentration: number;
  financialHistory: { month: string; revenue: number; costs: number; expenses: number }[];
}

export interface PeriodFilter {
  type: "month" | "custom";
  month?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

const EMPTY_DATA: ExecutiveDashboardData = {
  totalRevenue: 0, mrr: 0, receivables: 0, overdueReceivables: 0, totalExpenses: 0,
  grossProfit: 0, netProfit: 0, margin: 0, revenueByClient: [], revenueByService: [],
  expensesByCategory: [], totalTasks: 0, pendingTasks: 0, completedTasks: 0,
  overdueTasks: 0, completionRate: 0, productivityByUser: [], criticalTasks: [],
  activeContracts: 0, defaultingContracts: 0, contractFulfillment: [],
  revenueForecast: 0, topClients: [], revenueConcentration: 0, financialHistory: [],
};

export function useExecutiveDashboard(periodFilter: PeriodFilter) {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      setData(demoExecutiveDashboardData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setData(null);
        return;
      }

      const now = new Date();

      // --- Período ---
      let periodStart: string;
      let periodEnd: string;

      if (periodFilter.type === "custom" && periodFilter.startDate && periodFilter.endDate) {
        periodStart = periodFilter.startDate;
        periodEnd = periodFilter.endDate;
      } else {
        const month = periodFilter.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        periodStart = `${month}-01`;
        const pDate = new Date(periodStart);
        const nextMonth = new Date(pDate.getFullYear(), pDate.getMonth() + 1, 1);
        periodEnd = nextMonth.toISOString().split("T")[0];
      }

      // Histórico: 6 meses atrás — calculado aqui para usar no Promise.all
      const historyStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0];

      // Query de profiles com filtro de org (belt-and-suspenders sobre RLS)
      // Scope to current tenant org — master user bypasses RLS and would see all orgs
      let profilesQuery = supabase.from("profiles").select("user_id, full_name, avatar_url");
      if (tenant?.organization_id) profilesQuery = profilesQuery.eq("organization_id", tenant.organization_id);

      // --- Todas as queries em paralelo ---
      const [
        { data: entries },
        { data: contracts },
        { data: checklists },
        { data: tasks },
        { data: profileRows },
        { data: historyEntries },
      ] = await Promise.all([
        supabase
          .from("financial_entries")
          .select("*, clients(*), financial_categories(name)")
          .gte("due_date", periodStart)
          .lt("due_date", periodEnd),
        supabase
          .from("contracts")
          .select("value, client_id, clients(*), status")
          .eq("status", "ativo"),
        supabase
          .from("delivery_checklists")
          .select("fulfillment_pct, clients(*)")
          .limit(100),
        supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, responsible_id, clients(*)"),
        profilesQuery,
        supabase
          .from("financial_entries")
          .select("value, type, due_date, status")
          .gte("due_date", historyStart)
          .lt("due_date", periodEnd)
          .eq("status", "pago"),
      ]);

      // --- Métricas financeiras ---
      const allEntries = entries || [];
      const getEntryClass = (entry: any) => entry.entry_class || (entry.type === "receber" ? "receita" : "despesa");
      const getEntryNature = (entry: any) => entry.nature || "fixo";

      const income = allEntries.filter(e => e.type === "receber" && e.status === "pago");
      const totalRevenue = income.reduce((s, e) => s + Number(e.value), 0);
      const receivables = allEntries.filter(e => e.type === "receber" && e.status === "pendente").reduce((s, e) => s + Number(e.value), 0);
      const overdueReceivables = allEntries.filter(e => e.type === "receber" && e.status === "atrasado").reduce((s, e) => s + Number(e.value), 0);
      const paidExpenses = allEntries.filter(e => e.type === "pagar" && e.status === "pago");
      const totalExpenses = paidExpenses.reduce((s, e) => s + Number(e.value), 0);
      const grossProfit = totalRevenue - totalExpenses;
      const netProfit = grossProfit;
      const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

      const revClientMap: Record<string, number> = {};
      income.forEach(e => {
        const name = getClientDisplayName((e as any).clients) || "Sem cliente";
        revClientMap[name] = (revClientMap[name] || 0) + Number(e.value);
      });
      const revenueByClient = Object.entries(revClientMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const expCatMap: Record<string, number> = {
        "Custo Fixo": 0,
        "Custo Variável": 0,
        "Despesa Fixa": 0,
        "Despesa Variável": 0,
      };
      allEntries.filter(e => e.type === "pagar" && e.status === "pago").forEach((e: any) => {
        const prefix = getEntryClass(e) === "custo" ? "Custo" : "Despesa";
        const suffix = getEntryNature(e) === "variavel" ? "Variável" : "Fixa";
        const cat = `${prefix} ${suffix}`;
        expCatMap[cat] = (expCatMap[cat] || 0) + Number(e.value);
      });
      const expensesByCategory = Object.entries(expCatMap)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // --- Contratos ---
      const mrr = (contracts || []).reduce((s, c) => s + (Number(c.value) || 0), 0);
      const activeContracts = (contracts || []).length;
      const defaultingContracts = allEntries.filter(e => e.type === "receber" && e.status === "atrasado" && e.contract_id).length;

      // --- Fulfillment de checklists ---
      const fulfillmentMap: Record<string, number[]> = {};
      (checklists || []).forEach((c: any) => {
        const name = getClientDisplayName(c.clients) || "—";
        if (!fulfillmentMap[name]) fulfillmentMap[name] = [];
        fulfillmentMap[name].push(Number(c.fulfillment_pct) || 0);
      });
      const contractFulfillment = Object.entries(fulfillmentMap)
        .map(([client, pcts]) => ({ client, pct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) }))
        .sort((a, b) => a.pct - b.pct);

      // --- Tarefas ---
      const profileMap = new Map<string, { name: string; avatar?: string }>();
      (profileRows || []).forEach((p: any) => profileMap.set(p.user_id, { name: p.full_name, avatar: p.avatar_url }));

      const allTasks = tasks || [];
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === "concluido").length;
      const pendingTasks = allTasks.filter(t => t.status === "pendente").length;
      const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "concluido").length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

      const criticalTasks = allTasks
        .filter(t => (t.priority === "urgente" || t.priority === "alta") && t.status !== "concluido")
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          title: t.title,
          client: getClientDisplayName((t as any).clients) || "—",
          dueDate: t.due_date || "",
          responsible: t.responsible_id ? profileMap.get(t.responsible_id)?.name : undefined,
        }));

      // --- Concentração de receita ---
      const topClients = revenueByClient.slice(0, 5).map(c => ({
        name: c.name,
        revenue: c.value,
        pct: totalRevenue > 0 ? Math.round((c.value / totalRevenue) * 100) : 0,
      }));
      const hhi = revenueByClient.reduce((s, c) => {
        const share = totalRevenue > 0 ? c.value / totalRevenue : 0;
        return s + share * share;
      }, 0);
      const revenueConcentration = Math.round(hhi * 10000);
      const revenueForecast = mrr;
      const revenueByService = revenueByClient.slice(0, 5);

      // --- Histórico financeiro (6 meses) ---
      const historyMap: Record<string, { revenue: number; costs: number; expenses: number }> = {};
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        historyMap[m] = { revenue: 0, costs: 0, expenses: 0 };
      }
      (historyEntries || []).forEach(e => {
        const m = e.due_date.substring(0, 7);
        if (historyMap[m]) {
          if (e.type === "receber") historyMap[m].revenue += Number(e.value);
          else if ((e as any).entry_class === "custo") historyMap[m].costs += Number(e.value);
          else historyMap[m].expenses += Number(e.value);
        }
      });
      const financialHistory = Object.keys(historyMap).sort().map(m => ({
        month: format(new Date(m + "-01"), "MMM/yy", { locale: ptBR }),
        ...historyMap[m],
      }));

      setData({
        totalRevenue, mrr, receivables, overdueReceivables, totalExpenses,
        grossProfit, netProfit, margin, revenueByClient, revenueByService,
        expensesByCategory,
        totalTasks, pendingTasks, completedTasks, overdueTasks, completionRate,
        productivityByUser, criticalTasks,
        activeContracts, defaultingContracts, contractFulfillment,
        revenueForecast, topClients, revenueConcentration,
        financialHistory,
      });
    } catch (err) {
      console.error("[ExecutiveDashboard] Erro ao carregar dados:", err);
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }, [periodFilter, isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
