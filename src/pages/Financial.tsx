import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useFinancialEntries } from "@/hooks/useFinancial";
import { format } from "date-fns";

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const statusCls: Record<string, string> = {
  pago: "status-active",
  pendente: "status-paused",
  atrasado: "status-cancelled",
  cancelado: "bg-white/5 text-white/30 border-white/10",
};

export default function Financial() {
  const { entries, loading, summary } = useFinancialEntries(currentMonth);

  const monthLabel = format(now, "MMMM yyyy").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-white/50 mt-1">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Receita Recebida" value={`R$ ${summary.income.toLocaleString("pt-BR")}`} change={`${entries.filter(e => e.type === "receita").length} lançamentos`} changeType="positive" icon={TrendingUp} />
        <MetricCard title="Despesas Pagas" value={`R$ ${summary.expense.toLocaleString("pt-BR")}`} change={`${entries.filter(e => e.type === "despesa").length} lançamentos`} changeType="negative" icon={TrendingDown} />
        <MetricCard title="Resultado" value={`R$ ${summary.profit.toLocaleString("pt-BR")}`} change={summary.profit >= 0 ? "Positivo" : "Negativo"} changeType={summary.profit >= 0 ? "positive" : "negative"} icon={DollarSign} />
        <MetricCard title="Inadimplência" value={`R$ ${summary.overdue.toLocaleString("pt-BR")}`} change={`${summary.overdueCount} atrasado(s)`} changeType="negative" icon={TrendingDown} pulse={summary.overdueCount > 0} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-white/[0.06]">
            <h3 className="font-heading text-base font-semibold">Movimentações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Descrição</th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Vencimento</th>
                  <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                  <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-white/30">Nenhum lançamento neste mês</td></tr>
                ) : entries.map((tx) => {
                  const isIncome = tx.type === "receita";
                  return (
                    <tr key={tx.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            {isIncome ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-400" />}
                          </div>
                          <div>
                            <span className="font-medium">{tx.description}</span>
                            {(tx.clients as any)?.name && (
                              <p className="text-[11px] text-white/30">{(tx.clients as any).name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-white/50 font-mono text-xs">{format(new Date(tx.due_date), "dd/MM/yyyy")}</td>
                      <td className={`p-4 text-right font-mono font-medium ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
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
    </div>
  );
}
