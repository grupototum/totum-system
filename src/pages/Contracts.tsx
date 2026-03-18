import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, RefreshCw, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContracts } from "@/hooks/useContracts";
import { ContractFormDialog } from "@/components/contracts/ContractFormDialog";
import { format } from "date-fns";

const statusMap: Record<string, string> = {
  ativo: "status-active",
  pausado: "status-paused",
  cancelado: "status-cancelled",
  encerrado: "status-cancelled",
};

const freqLabels: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  personalizada: "Personalizada",
};

export default function Contracts() {
  const { contracts, loading, addContract } = useContracts();
  const [showForm, setShowForm] = useState(false);

  const activeCount = contracts.filter((c) => c.status === "ativo").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Contratos</h1>
          <p className="text-sm text-white/50 mt-1">{activeCount} ativos · {contracts.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
          <Plus className="h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 text-white/30">Nenhum contrato encontrado</div>
      ) : (
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
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusMap[contract.status] || "status-paused"}`}>
                  {contract.status}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{(contract.clients as any)?.name || "—"}</h3>
              <p className="text-sm text-white/50 mb-1">{contract.title}</p>
              <p className="text-xs text-white/30 mb-4">{(contract.plans as any)?.name || (contract.contract_types as any)?.name || ""}</p>
              <div className="space-y-2 text-xs text-white/40">
                {contract.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Início: {format(new Date(contract.start_date), "dd/MM/yyyy")}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" /> {freqLabels[contract.billing_frequency || "mensal"] || contract.billing_frequency}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <span className="font-mono text-lg font-bold">
                  {contract.value ? `R$ ${Number(contract.value).toLocaleString("pt-BR")}` : "—"}
                </span>
                <span className="text-xs text-white/30 ml-1">/mês</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ContractFormDialog open={showForm} onOpenChange={setShowForm} onSubmit={addContract} />
    </div>
  );
}
