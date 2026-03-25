import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useFinancialEntries } from "@/hooks/useFinancial";
import { FinancialFormDialog } from "@/components/financial/FinancialFormDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { format } from "date-fns";

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const statusCls: Record<string, string> = {
  pago: "status-active",
  pendente: "status-paused",
  atrasado: "status-cancelled",
  cancelado: "bg-white/5 text-muted-foreground border-border",
};

export default function Financial() {
  const { canViewFinancial, hasPermission } = usePermissions();
  const { entries, loading, summary, refetch } = useFinancialEntries(currentMonth);
  const [formOpen, setFormOpen] = useState(false);

  if (!canViewFinancial) {
    return <AccessDenied message="Você não tem permissão para acessar o módulo financeiro. Solicite acesso a um administrador." />;
  }

  const monthLabel = format(now, "MMMM yyyy").replace(/^\w/, (c) => c.toUpperCase());

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
        <MetricCard title="Receita Recebida" value={`R$ ${summary.income.toLocaleString("pt-BR")}`} change={`${entries.filter(e => e.type === "receber").length} lançamentos`} changeType="positive" icon={TrendingUp} />
        <MetricCard title="Despesas Pagas" value={`R$ ${summary.expense.toLocaleString("pt-BR")}`} change={`${entries.filter(e => e.type === "pagar").length} lançamentos`} changeType="negative" icon={TrendingDown} />
        <MetricCard title="Resultado" value={`R$ ${summary.profit.toLocaleString("pt-BR")}`} change={summary.profit >= 0 ? "Positivo" : "Negativo"} changeType={summary.profit >= 0 ? "positive" : "negative"} icon={DollarSign} />
        <MetricCard title="Inadimplência" value={`R$ ${summary.overdue.toLocaleString("pt-BR")}`} change={`${summary.overdueCount} atrasado(s)`} changeType="negative" icon={TrendingDown} pulse={summary.overdueCount > 0} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-heading text-base font-semibold">Movimentações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimento</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum lançamento neste mês</td></tr>
                ) : entries.map((tx) => {
                  const isIncome = tx.type === "receber";
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-400" />}
                          </div>
                          <div>
                            <span className="font-medium">{tx.description}</span>
                            {(tx.clients as any)?.name && (
                              <p className="text-[11px] text-muted-foreground">{(tx.clients as any).name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground font-heading text-xs">{format(new Date(tx.due_date), "dd/MM/yyyy")}</td>
                      <td className={`p-4 text-right font-heading font-medium ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                        {isIncome ? "+" : "-"}R$ {Number(tx.value).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusCls[tx.status] || "status-paused"}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <FinancialFormDialog open={formOpen} onOpenChange={setFormOpen} onCreated={refetch} />
    </div>
  );
}
