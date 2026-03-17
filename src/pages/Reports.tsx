import { motion } from "framer-motion";
import { BarChart3, FileText, Download } from "lucide-react";

const reports = [
  { name: "Receita Mensal", description: "Faturamento por cliente e produto", icon: BarChart3 },
  { name: "MRR & Churn", description: "Receita recorrente e taxa de cancelamento", icon: BarChart3 },
  { name: "Cumprimento Contratual", description: "% de entregas por cliente e período", icon: FileText },
  { name: "Pendências e Justificativas", description: "Entregas não concluídas e motivos", icon: FileText },
  { name: "Rentabilidade por Cliente", description: "Lucro, custo e margem por cliente", icon: BarChart3 },
  { name: "Previsão de Faturamento", description: "Projeção baseada em contratos ativos", icon: BarChart3 },
];

export default function Reports() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-white/50 mt-1">Análises e inteligência operacional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((report) => (
          <motion.div
            key={report.name}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <report.icon className="h-5 w-5 text-primary" />
              </div>
              <Download className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
            </div>
            <h3 className="font-semibold mb-1">{report.name}</h3>
            <p className="text-sm text-white/40">{report.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
