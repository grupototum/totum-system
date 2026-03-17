import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

const transactions = [
  { id: 1, description: "TechVentures S.A. - Plano Premium", type: "income", amount: 12500, date: "15/03/2026", status: "recebido" },
  { id: 2, description: "Salários - Equipe Criativa", type: "expense", amount: -18500, date: "05/03/2026", status: "pago" },
  { id: 3, description: "Nova Digital - Plano Essencial", type: "income", amount: 4800, date: "10/03/2026", status: "recebido" },
  { id: 4, description: "Google Ads - Créditos", type: "expense", amount: -8200, date: "01/03/2026", status: "pago" },
  { id: 5, description: "Innova Corp - Plano Pro", type: "income", amount: 7600, date: "12/03/2026", status: "recebido" },
  { id: 6, description: "Startup Labs - Plano Premium", type: "income", amount: 9200, date: "08/03/2026", status: "pendente" },
  { id: 7, description: "Ferramentas SaaS", type: "expense", amount: -2400, date: "01/03/2026", status: "pago" },
  { id: 8, description: "MegaStore - Plano Premium", type: "income", amount: 15000, date: "15/03/2026", status: "vencido" },
];

export default function Financial() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-white/50 mt-1">Março 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Receita Mensal" value="R$ 138.400" change="+12.3%" changeType="positive" icon={TrendingUp} />
        <MetricCard title="Despesas" value="R$ 68.000" change="+4.2%" changeType="negative" icon={TrendingDown} />
        <MetricCard title="Lucro Líquido" value="R$ 70.400" change="+8.1%" changeType="positive" icon={DollarSign} />
        <MetricCard title="Inadimplência" value="R$ 24.200" change="2 clientes" changeType="negative" icon={TrendingDown} pulse />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/[0.06]">
          <h3 className="font-heading text-base font-semibold">Movimentações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Descrição</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Data</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}>
                        {tx.type === "income" ? (
                          <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <span className="font-medium">{tx.description}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white/50 font-mono text-xs">{tx.date}</td>
                  <td className={`p-4 text-right font-mono font-medium ${
                    tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}R$ {Math.abs(tx.amount).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      tx.status === "recebido" || tx.status === "pago" ? "status-active" :
                      tx.status === "pendente" ? "status-paused" : "status-cancelled"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
