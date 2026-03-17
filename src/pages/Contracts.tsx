import { motion } from "framer-motion";
import { FileText, Calendar, RefreshCw } from "lucide-react";

const contracts = [
  { id: "1", client: "TechVentures S.A.", plan: "Premium", value: 12500, start: "01/01/2025", frequency: "Mensal", status: "ativo" },
  { id: "2", client: "Nova Digital", plan: "Essencial", value: 4800, start: "15/03/2025", frequency: "Mensal", status: "ativo" },
  { id: "3", client: "Startup Labs", plan: "Premium", value: 9200, start: "01/06/2025", frequency: "Mensal", status: "ativo" },
  { id: "4", client: "Innova Corp", plan: "Pro", value: 7600, start: "01/09/2025", frequency: "Mensal", status: "ativo" },
  { id: "5", client: "MegaStore", plan: "Premium", value: 15000, start: "01/04/2025", frequency: "Mensal", status: "inadimplente" },
  { id: "6", client: "HealthTech", plan: "Essencial", value: 3400, start: "01/02/2025", frequency: "Mensal", status: "cancelado" },
];

const statusMap: Record<string, string> = {
  ativo: "status-active",
  inadimplente: "status-overdue",
  cancelado: "status-cancelled",
  pausado: "status-paused",
};

export default function Contracts() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Contratos</h1>
        <p className="text-sm text-white/50 mt-1">{contracts.filter(c => c.status === "ativo").length} ativos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {contracts.map((contract) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusMap[contract.status]}`}>
                {contract.status}
              </span>
            </div>
            <h3 className="font-semibold mb-1">{contract.client}</h3>
            <p className="text-sm text-white/50 mb-4">{contract.plan}</p>
            <div className="space-y-2 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Início: {contract.start}
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> {contract.frequency}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <span className="font-mono text-lg font-bold">R$ {contract.value.toLocaleString("pt-BR")}</span>
              <span className="text-xs text-white/30 ml-1">/mês</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
