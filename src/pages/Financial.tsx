import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Loader2, Plus, CreditCard, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useFinancialEntries, FinancialEntryRow } from "@/hooks/useFinancial";
import { FinancialFormDialog } from "@/components/financial/FinancialFormDialog";
import { AsaasFinancialPanel } from "@/components/financial/AsaasFinancialPanel";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const statusCls: Record<string, string> = {
  pago: "status-active",
  pendente: "status-paused",
  atrasado: "status-cancelled",
  cancelado: "bg-muted/20 text-muted-foreground border-border",
};

const tabs = [
  { value: "lancamentos", label: "Lançamentos" },
  { value: "asaas", label: "Cobranças Asaas" },
] as const;

type TabValue = (typeof tabs)[number]["value"];
type ViewMode = "list" | "kanban";
type KanbanGroup = "status" | "type";

const kanbanStatusOrder = ["pendente", "pago", "atrasado", "cancelado"];
const kanbanTypeLabels: Record<string, string> = { receber: "A Receber", pagar: "A Pagar" };
const kanbanStatusLabels: Record<string, string> = { pendente: "Pendente", pago: "Pago", atrasado: "Atrasado", cancelado: "Cancelado" };

export default function Financial() {
  const { canViewFinancial } = usePermissions();
  const { entries, loading, summary, refetch } = useFinancialEntries(currentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("lancamentos");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [kanbanGroup, setKanbanGroup] = useState<KanbanGroup>("status");

  const monthLabel = format(now, "MMMM yyyy").replace(/^\w/, (c) => c.toUpperCase());

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const metrics = useMemo(() => {
    const paid = entries.filter(e => e.status === "pago");
    
    const receita = paid.filter(e => e.type === "receber").reduce((s, e) => s + Number(e.value), 0);
    
    // Custos (Agrupados por natureza)
    const custoFixo = paid.filter(e => e.type === "custo" && e.nature === "fixo").reduce((s, e) => s + Number(e.value), 0);
    const custoVar = paid.filter(e => e.type === "custo" && e.nature === "variavel").reduce((s, e) => s + Number(e.value), 0);
    
    // Despesas (Agrupadas por natureza)
    const despesaFixo = paid.filter(e => (e.type === "pagar" || e.type === "despesa") && e.nature === "fixo").reduce((s, e) => s + Number(e.value), 0);
    const despesaVar = paid.filter(e => (e.type === "pagar" || e.type === "despesa") && e.nature === "variavel").reduce((s, e) => s + Number(e.value), 0);
    
    const totalCustos = custoFixo + custoVar;
    const totalDespesas = despesaFixo + despesaVar;
    
    const lucroOp = receita - totalCustos;
    const resultadoLiq = lucroOp - totalDespesas;
    
    const inadimplencia = entries.filter(e => e.status === "atrasado").reduce((s, e) => s + Number(e.value), 0);
    const overdueCount = entries.filter(e => e.status === "atrasado").length;

    return {
      receita, custoFixo, custoVar, despesaFixo, despesaVar,
      totalCustos, totalDespesas, lucroOp, resultadoLiq,
      inadimplencia, overdueCount
    };
  }, [entries]);

  const chartDataComposition = [
    { name: "Custos", value: metrics.totalCustos, color: "#8b5cf6" },
    { name: "Despesas", value: metrics.totalDespesas, color: "#f43f5e" },
  ];

  const chartDataNature = [
    { name: "Fixo", value: metrics.custoFixo + metrics.despesaFixo, color: "#3b82f6" },
    { name: "Variável", value: metrics.custoVar + metrics.despesaVar, color: "#f59e0b" },
  ];

  const grouped = useMemo(() => {
    const groups: Record<string, FinancialEntryRow[]> = {};
    const keys = kanbanGroup === "status" ? kanbanStatusOrder : ["receber", "pagar"];
    keys.forEach(k => { groups[k] = []; });
    entries.forEach(e => {
      const g = kanbanGroup === "status" ? e.status : e.type;
      if (!groups[g]) groups[g] = [];
      groups[g].push(e);
    });
    return groups;
  }, [entries, kanbanGroup]);

  if (!canViewFinancial) {
    return <AccessDenied message="Você não tem permissão para acessar o módulo financeiro." />;
  }



  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">{monthLabel}</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
          <Plus className="h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Receita Recebida" value={fmt(metrics.receita)} icon={TrendingUp} changeType="positive" />
        <MetricCard title="Custos Fixos" value={fmt(metrics.custoFixo)} icon={ArrowUpRight} changeType="neutral" />
        <MetricCard title="Custos Variáveis" value={fmt(metrics.custoVar)} icon={ArrowUpRight} changeType="neutral" />
        <MetricCard title="Lucro Operacional" value={fmt(metrics.lucroOp)} icon={DollarSign} changeType={metrics.lucroOp >= 0 ? "positive" : "negative"} />
        
        <MetricCard title="Despesas Fixas" value={fmt(metrics.despesaFixo)} icon={TrendingDown} changeType="negative" />
        <MetricCard title="Despesas Variáveis" value={fmt(metrics.despesaVar)} icon={TrendingDown} changeType="negative" />
        <MetricCard title="Resultado Líquido" value={fmt(metrics.resultadoLiq)} icon={DollarSign} changeType={metrics.resultadoLiq >= 0 ? "positive" : "negative"} />
        <MetricCard title="Inadimplência" value={fmt(metrics.inadimplencia)} icon={TrendingDown} change={`${metrics.overdueCount} atrasado(s)`} changeType="negative" pulse={metrics.overdueCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" /> Composição de Gastos (Custo vs Despesa)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartDataComposition} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartDataComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v: any) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" /> Natureza Financeira (Fixo vs Variável)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartDataNature} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartDataNature.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v: any) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.value === "asaas" && <CreditCard className="h-3.5 w-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "lancamentos" && (
          <div className="flex items-center gap-2 pb-1">
            {viewMode === "kanban" && (
              <Select value={kanbanGroup} onValueChange={(v) => setKanbanGroup(v as KanbanGroup)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Por Status</SelectItem>
                  <SelectItem value="type">Por Tipo</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-1 bg-accent border border-border rounded-lg p-0.5">
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("kanban")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "kanban" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === "lancamentos" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : viewMode === "list" ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-heading text-base font-semibold">Movimentações</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimento</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Parcela</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum lançamento neste mês</td></tr>
                    ) : entries.map((tx) => {
                      const isIncome = tx.type === "receber";
                      return (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                           <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                                {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
                              </div>
                              <div>
                                <span className="font-medium block">{tx.description}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{tx.nature || "Fixo"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">{isIncome ? "Receita" : "Despesa"}</td>
                          <td className="p-4 text-muted-foreground font-heading text-xs">{format(new Date(tx.due_date), "dd/MM/yyyy")}</td>
                          <td className="p-4 text-xs text-muted-foreground">{(tx.clients as any)?.name || "—"}</td>
                          <td className={`p-4 text-right font-heading font-medium ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {isIncome ? "+" : "-"}{fmt(Number(tx.value))}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusCls[tx.status] || "status-paused"}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {tx.installment_number && tx.total_installments
                              ? `${tx.installment_number}/${tx.total_installments}`
                              : tx.recurrence === "unica" ? "—" : tx.recurrence}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            /* Kanban View */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Object.keys(grouped).length}, minmax(250px, 1fr))` }}>
              {Object.entries(grouped).map(([key, items]) => (
                <div key={key} className="glass-card rounded-xl p-4 space-y-3 min-h-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold capitalize">
                      {kanbanGroup === "status" ? kanbanStatusLabels[key] || key : kanbanTypeLabels[key] || key}
                    </h4>
                    <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(tx => {
                      const isIncome = tx.type === "receber";
                      return (
                        <div key={tx.id} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-heading font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                              {isIncome ? "+" : "-"}{fmt(Number(tx.value))}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(tx.due_date), "dd/MM")}</span>
                          </div>
                          {(tx.clients as any)?.name && (
                            <p className="text-[10px] text-muted-foreground">{(tx.clients as any).name}</p>
                          )}
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum lançamento</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {activeTab === "asaas" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <AsaasFinancialPanel />
        </motion.div>
      )}

      <FinancialFormDialog open={formOpen} onOpenChange={setFormOpen} onCreated={refetch} />
    </div>
  );
}
