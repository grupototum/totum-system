import { DollarSign, Users, ClipboardCheck, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RiskRanking } from "@/components/dashboard/RiskRanking";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const recentActivity = [
  { action: "Checklist finalizado", client: "Innova Corp", time: "há 2h", type: "success" },
  { action: "Justificativa pendente", client: "TechVentures S.A.", time: "há 3h", type: "warning" },
  { action: "Novo contrato ativado", client: "GreenTech", time: "há 5h", type: "info" },
  { action: "Pagamento recebido", client: "DigitalPlus", time: "há 6h", type: "success" },
  { action: "Entrega parcial", client: "Nova Digital", time: "há 8h", type: "warning" },
];

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard Operacional</h1>
        <p className="text-sm text-white/50 mt-1">
          Sua agência sob controle. <span className="text-emerald-400 font-medium">94.2%</span> das entregas concluídas este mês.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value="R$ 138.400"
          change="+12.3%"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Clientes Ativos"
          value="47"
          change="+3"
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Cumprimento Contratual"
          value="94.2%"
          change="+2.1%"
          changeType="positive"
          icon={ClipboardCheck}
        />
        <MetricCard
          title="Lucro Líquido"
          value="R$ 70.400"
          change="-1.8%"
          changeType="negative"
          icon={TrendingUp}
          pulse
        />
      </div>

      {/* Charts + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>
        <div className="lg:col-span-2">
          <RiskRanking />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-base font-semibold">Atividade Recente</h3>
            <Link to="/entregas" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  item.type === "success" ? "bg-emerald-500" :
                  item.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{item.action}</span>
                  <span className="text-white/40 text-sm"> — {item.client}</span>
                </div>
                <span className="text-xs text-white/30 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-heading text-base font-semibold mb-5">Alertas</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/[0.08] border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">3 checklists pendentes</p>
                <p className="text-xs text-white/40 mt-0.5">Prazo: sexta-feira</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">2 clientes inadimplentes</p>
                <p className="text-xs text-white/40 mt-0.5">Faturas vencidas há +15 dias</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">5 justificativas sem resolução</p>
                <p className="text-xs text-white/40 mt-0.5">Entregas parciais não resolvidas</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
