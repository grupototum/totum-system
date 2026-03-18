import { useState } from "react";
import { useExecutiveDashboard, PeriodFilter } from "@/hooks/useExecutiveDashboard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Users, FileText,
  CheckCircle2, Clock, ListTodo, BarChart3, PieChart, Target, Loader2, CalendarIcon, HelpCircle,
} from "lucide-react";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "bg-primary/60", "bg-blue-500/60", "bg-emerald-500/60", "bg-amber-500/60",
  "bg-purple-500/60", "bg-pink-500/60", "bg-cyan-500/60", "bg-orange-500/60",
];

const TOOLTIPS: Record<string, string> = {
  "Faturamento": "Soma dos valores recebidos no período selecionado",
  "MRR": "Receita Mensal Recorrente baseada nos contratos ativos",
  "A receber": "Valores pendentes de pagamento pelos clientes",
  "Em atraso": "Valores vencidos e ainda não pagos",
  "Despesas": "Total de custos e despesas pagas no período",
  "Lucro bruto": "Faturamento menos despesas no período",
  "Margem": "Percentual de lucro em relação ao faturamento",
  "Total tarefas": "Quantidade total de tarefas cadastradas no período",
  "Pendentes": "Tarefas que ainda não foram iniciadas",
  "Concluídas": "Tarefas finalizadas no período",
  "Atrasadas": "Tarefas com prazo vencido e não concluídas",
  "Taxa conclusão": "Percentual de tarefas concluídas sobre o total",
  "Contratos ativos": "Número de contratos vigentes no momento",
  "Inadimplentes": "Contratos com parcelas em atraso",
  "Cumprimento médio": "Média de entregas realizadas vs planejadas nos contratos",
  "Previsão de faturamento": "Estimativa baseada no MRR dos contratos ativos",
  "Concentração de receita (HHI)": "Índice Herfindahl-Hirschman: mede dependência de poucos clientes. < 1.500 = diversificada, 1.500–2.500 = moderada, > 2.500 = alta concentração/risco",
};

const InfoTip = ({ label }: { label: string }) => {
  const tip = TOOLTIPS[label];
  if (!tip) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3 w-3 text-white/20 hover:text-white/50 cursor-help inline-block ml-1 shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs bg-[hsl(var(--popover))] text-popover-foreground">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
};

export default function ExecutiveDashboard() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [selectValue, setSelectValue] = useState(currentMonth);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const isCustom = selectValue === "custom";

  const periodFilter: PeriodFilter = isCustom && customStart && customEnd
    ? {
        type: "custom",
        startDate: format(customStart, "yyyy-MM-dd"),
        endDate: format(customEnd, "yyyy-MM-dd"),
      }
    : { type: "month", month: selectValue === "custom" ? currentMonth : selectValue };

  const { data, loading } = useExecutiveDashboard(periodFilter);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  });

  if (loading || !data) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const finCards = [
    { label: "Faturamento", value: formatCurrency(data.totalRevenue), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "MRR", value: formatCurrency(data.mrr), icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "A receber", value: formatCurrency(data.receivables), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Em atraso", value: formatCurrency(data.overdueReceivables), icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Despesas", value: formatCurrency(data.totalExpenses), icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Lucro bruto", value: formatCurrency(data.grossProfit), icon: TrendingUp, color: data.grossProfit >= 0 ? "text-emerald-400" : "text-red-400", bg: data.grossProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
    { label: "Margem", value: `${data.margin}%`, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  const opsCards = [
    { label: "Total tarefas", value: data.totalTasks, icon: ListTodo, color: "text-white/70", bg: "bg-white/[0.06]" },
    { label: "Pendentes", value: data.pendingTasks, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Concluídas", value: data.completedTasks, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Atrasadas", value: data.overdueTasks, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Taxa conclusão", value: `${data.completionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  const totalExpenses = data.expensesByCategory.reduce((s, c) => s + c.value, 0);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-white/50 mt-1">Visão estratégica, financeira e operacional</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectValue} onValueChange={setSelectValue}>
            <SelectTrigger className="w-48 bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#271c1d] border-white/[0.1] text-white">
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs focus:bg-white/[0.06] focus:text-white capitalize">
                  {m.label}
                </SelectItem>
              ))}
              <SelectItem value="custom" className="text-xs focus:bg-white/[0.06] focus:text-white">
                📅 Personalizado
              </SelectItem>
            </SelectContent>
          </Select>

          {isCustom && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-[140px] justify-start text-left text-xs bg-white/[0.05] border-white/[0.1]",
                      !customStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {customStart ? format(customStart, "dd/MM/yyyy") : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    locale={ptBR}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-[140px] justify-start text-left text-xs bg-white/[0.05] border-white/[0.1]",
                      !customEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {customEnd ? format(customEnd, "dd/MM/yyyy") : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    locale={ptBR}
                    disabled={(date) => customStart ? date < customStart : false}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {/* FINANCIAL SECTION */}
      <section>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" /> Visão Financeira
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {finCards.map((m) => (
            <div key={m.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${m.bg}`}>
                  <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                </div>
              </div>
              <p className="text-lg font-heading font-bold truncate">{m.value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center">{m.label}<InfoTip label={m.label} /></p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Revenue by Client */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" /> Receita por Cliente
            </h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
              {data.revenueByClient.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Sem dados no período</p>
              ) : (
                data.revenueByClient.map((c) => {
                  const pct = data.totalRevenue > 0 ? Math.round((c.value / data.totalRevenue) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-xs truncate flex-1 min-w-0">{c.name}</span>
                      <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
                        <div className="h-full rounded-full bg-emerald-500/50" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-white/40 font-mono shrink-0 w-16 text-right">{formatCurrency(c.value)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Expenses by Category (Pie) */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChart className="h-3.5 w-3.5" /> Custos e Despesas
            </h3>
            {data.expensesByCategory.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">Sem dados no período</p>
            ) : (
              <div className="flex items-start gap-5">
                {/* Simple donut */}
                <div className="relative h-32 w-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
                    {(() => {
                      let offset = 0;
                      const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
                      return data.expensesByCategory.map((cat, i) => {
                        const pct = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
                        const el = (
                          <circle
                            key={cat.name}
                            r="15.9"
                            cx="18"
                            cy="18"
                            fill="transparent"
                            stroke={colors[i % colors.length]}
                            strokeWidth="3"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={`${-offset}`}
                            className="opacity-70"
                          />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-heading font-bold">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {data.expensesByCategory.slice(0, 8).map((cat, i) => {
                    const pct = totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-sm shrink-0 ${COLORS[i % COLORS.length]}`} />
                        <span className="text-[10px] text-white/60 truncate flex-1">{cat.name}</span>
                        <span className="text-[10px] text-white/40 font-mono shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* OPERATIONAL SECTION */}
      <section>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5" /> Visão Operacional
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {opsCards.map((m) => (
            <div key={m.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${m.bg}`}>
                  <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                </div>
              </div>
              <p className="text-xl font-heading font-bold">{m.value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center">{m.label}<InfoTip label={m.label} /></p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Productivity by User */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Produtividade por Usuário
            </h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
              {data.productivityByUser.map((r) => {
                const rate = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
                return (
                  <div key={r.name} className="flex items-center gap-3">
                    <Avatar className="h-6 w-6 shrink-0">
                      {r.avatar && <AvatarImage src={r.avatar} />}
                      <AvatarFallback className="text-[8px] bg-white/[0.1]">{r.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">{r.name}</span>
                        <span className="text-[10px] text-white/40 font-mono shrink-0 ml-2">{rate}% · {r.completed}/{r.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500/50 transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                    {r.overdue > 0 && (
                      <span className="text-[9px] text-red-400 font-mono shrink-0">{r.overdue} atr.</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Tasks */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Tarefas Críticas
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
              {data.criticalTasks.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Nenhuma tarefa crítica</p>
              ) : (
                data.criticalTasks.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.03]">
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOverdue ? "bg-red-500" : "bg-amber-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{t.title}</p>
                        <p className="text-[10px] text-white/30">{t.client} · {t.responsible || "Sem responsável"}</p>
                      </div>
                      {t.dueDate && (
                        <span className={`text-[10px] font-mono shrink-0 ${isOverdue ? "text-red-400" : "text-white/30"}`}>
                          {new Date(t.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTRACTS SECTION */}
      <section>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" /> Contratos e Entregas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10"><FileText className="h-3.5 w-3.5 text-emerald-400" /></div>
            </div>
            <p className="text-xl font-heading font-bold">{data.activeContracts}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center">Contratos ativos<InfoTip label="Contratos ativos" /></p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-red-500/10"><AlertTriangle className="h-3.5 w-3.5 text-red-400" /></div>
            </div>
            <p className="text-xl font-heading font-bold">{data.defaultingContracts}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center">Inadimplentes<InfoTip label="Inadimplentes" /></p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Target className="h-3.5 w-3.5 text-primary" /></div>
            </div>
            <p className="text-xl font-heading font-bold">
              {data.contractFulfillment.length > 0
                ? `${Math.round(data.contractFulfillment.reduce((s, c) => s + c.pct, 0) / data.contractFulfillment.length)}%`
                : "—"}
            </p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center">Cumprimento médio<InfoTip label="Cumprimento médio" /></p>
          </div>
        </div>

        {data.contractFulfillment.length > 0 && (
          <div className="glass-card rounded-xl p-5 mt-5">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Cumprimento por Cliente</h3>
            <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
              {data.contractFulfillment.map((c) => (
                <div key={c.client} className="flex items-center gap-3">
                  <span className="text-xs truncate flex-1 min-w-0">{c.client}</span>
                  <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full transition-all ${c.pct >= 80 ? "bg-emerald-500/50" : c.pct >= 50 ? "bg-amber-500/50" : "bg-red-500/50"}`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 font-mono shrink-0 w-10 text-right">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* STRATEGIC SECTION */}
      <section>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="h-3.5 w-3.5" /> Visão Estratégica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 flex items-center">Previsão de faturamento<InfoTip label="Previsão de faturamento" /></p>
            <p className="text-xl font-heading font-bold text-primary">{formatCurrency(data.revenueForecast)}</p>
            <p className="text-[10px] text-white/30 mt-1">Baseado nos contratos ativos</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 flex items-center">Concentração de receita (HHI)<InfoTip label="Concentração de receita (HHI)" /></p>
            <p className={`text-xl font-heading font-bold ${data.revenueConcentration > 2500 ? "text-red-400" : data.revenueConcentration > 1500 ? "text-amber-400" : "text-emerald-400"}`}>
              {data.revenueConcentration}
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              {data.revenueConcentration > 2500 ? "Alta concentração — risco" : data.revenueConcentration > 1500 ? "Moderada" : "Diversificada"}
            </p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Top clientes</p>
            <div className="space-y-2">
              {data.topClients.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 font-mono w-4">{i + 1}.</span>
                  <span className="text-xs truncate flex-1">{c.name}</span>
                  <span className="text-[10px] text-white/40 font-mono">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    </TooltipProvider>
  );
}
