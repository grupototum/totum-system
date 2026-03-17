import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, MinusCircle, Ban, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeliveryStatus = "delivered" | "partial" | "not_delivered" | "not_applicable" | "pending";

interface DeliveryItem {
  id: string;
  name: string;
  status: DeliveryStatus;
  justification: string;
  observation: string;
}

interface ClientChecklist {
  clientId: string;
  clientName: string;
  plan: string;
  period: string;
  items: DeliveryItem[];
  expanded: boolean;
}

const initialChecklists: ClientChecklist[] = [
  {
    clientId: "1",
    clientName: "TechVentures S.A.",
    plan: "Premium",
    period: "Mar 2026 · Semana 3",
    expanded: true,
    items: [
      { id: "1a", name: "4 artes para Instagram", status: "delivered", justification: "", observation: "" },
      { id: "1b", name: "2 artes para Stories", status: "partial", justification: "", observation: "" },
      { id: "1c", name: "Gestão de tráfego (Google Ads)", status: "delivered", justification: "", observation: "" },
      { id: "1d", name: "Relatório mensal de performance", status: "not_delivered", justification: "", observation: "" },
      { id: "1e", name: "Reunião de alinhamento", status: "delivered", justification: "", observation: "" },
      { id: "1f", name: "Otimização de campanhas", status: "pending", justification: "", observation: "" },
      { id: "1g", name: "Produção de 1 vídeo curto", status: "pending", justification: "", observation: "" },
    ],
  },
  {
    clientId: "2",
    clientName: "Nova Digital",
    plan: "Essencial",
    period: "Mar 2026 · Semana 3",
    expanded: false,
    items: [
      { id: "2a", name: "3 artes para Instagram", status: "delivered", justification: "", observation: "" },
      { id: "2b", name: "Gestão de tráfego (Meta Ads)", status: "delivered", justification: "", observation: "" },
      { id: "2c", name: "Relatório quinzenal", status: "pending", justification: "", observation: "" },
    ],
  },
];

const statusIcons: Record<DeliveryStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  delivered: { icon: CheckCircle2, color: "text-emerald-400", label: "Entregue" },
  partial: { icon: AlertCircle, color: "text-amber-400", label: "Parcial" },
  not_delivered: { icon: MinusCircle, color: "text-red-400", label: "Não entregue" },
  not_applicable: { icon: Ban, color: "text-white/30", label: "N/A" },
  pending: { icon: AlertCircle, color: "text-white/20", label: "Pendente" },
};

const statusOptions: DeliveryStatus[] = ["delivered", "partial", "not_delivered", "not_applicable"];

export default function Fulfillment() {
  const [checklists, setChecklists] = useState(initialChecklists);

  const toggleExpand = (clientId: string) => {
    setChecklists((prev) =>
      prev.map((c) => (c.clientId === clientId ? { ...c, expanded: !c.expanded } : c))
    );
  };

  const updateItemStatus = (clientId: string, itemId: string, status: DeliveryStatus) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.clientId === clientId
          ? {
              ...c,
              items: c.items.map((item) =>
                item.id === itemId ? { ...item, status, justification: status === "delivered" || status === "not_applicable" ? "" : item.justification } : item
              ),
            }
          : c
      )
    );
  };

  const updateJustification = (clientId: string, itemId: string, justification: string) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.clientId === clientId
          ? { ...c, items: c.items.map((item) => (item.id === itemId ? { ...item, justification } : item)) }
          : c
      )
    );
  };

  const getFulfillmentPercent = (items: DeliveryItem[]) => {
    const actionable = items.filter((i) => i.status !== "not_applicable" && i.status !== "pending");
    if (actionable.length === 0) return 0;
    const delivered = actionable.filter((i) => i.status === "delivered").length;
    return Math.round((delivered / actionable.length) * 100);
  };

  const canFinalize = (items: DeliveryItem[]) => {
    const pending = items.some((i) => i.status === "pending");
    const needsJustification = items.some(
      (i) => (i.status === "partial" || i.status === "not_delivered") && !i.justification.trim()
    );
    return !pending && !needsJustification;
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Entregas Contratuais</h1>
        <p className="text-sm text-white/50 mt-1">Checklists de entrega por cliente e período</p>
      </div>

      <div className="space-y-4">
        {checklists.map((checklist) => {
          const pct = getFulfillmentPercent(checklist.items);
          const finalizable = canFinalize(checklist.items);

          return (
            <motion.div
              key={checklist.clientId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => toggleExpand(checklist.clientId)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  {checklist.expanded ? (
                    <ChevronDown className="h-4 w-4 text-white/40" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  )}
                  <div className="text-left">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{checklist.clientName}</span>
                      <span className="text-xs text-white/30 px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04]">
                        {checklist.plan}
                      </span>
                    </div>
                    <span className="text-xs text-white/40 mt-0.5 block">{checklist.period}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono font-medium w-10 text-right">{pct}%</span>
                  </div>
                </div>
              </button>

              {/* Items */}
              <AnimatePresence>
                {checklist.expanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.06] px-5 py-3 space-y-1">
                      {checklist.items.map((item) => {
                        const statusInfo = statusIcons[item.status];
                        const Icon = statusInfo.icon;
                        const needsJustification =
                          (item.status === "partial" || item.status === "not_delivered") &&
                          !item.justification.trim();

                        return (
                          <div key={item.id}>
                            <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                              <Icon className={`h-4 w-4 shrink-0 ${statusInfo.color}`} />
                              <span className="flex-1 text-sm">{item.name}</span>

                              <div className="flex items-center gap-1">
                                {statusOptions.map((s) => {
                                  const si = statusIcons[s];
                                  const SIcon = si.icon;
                                  const active = item.status === s;
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => updateItemStatus(checklist.clientId, item.id, s)}
                                      className={`p-1.5 rounded-md transition-all text-xs ${
                                        active
                                          ? `${si.color} bg-white/[0.08]`
                                          : "text-white/20 hover:text-white/40 hover:bg-white/[0.04]"
                                      }`}
                                      title={si.label}
                                    >
                                      <SIcon className="h-3.5 w-3.5" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Justification - mandatory for partial/not delivered */}
                            <AnimatePresence>
                              {(item.status === "partial" || item.status === "not_delivered") && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className={`ml-10 mr-3 mb-2 rounded-lg overflow-hidden ${
                                    needsJustification ? "border-l-2 border-primary" : "border-l-2 border-white/10"
                                  }`}>
                                    <textarea
                                      value={item.justification}
                                      onChange={(e) => updateJustification(checklist.clientId, item.id, e.target.value)}
                                      placeholder="Justificativa obrigatória — Por que esta entrega não foi concluída?"
                                      className={`w-full p-3 text-sm bg-white/[0.03] border-0 resize-none placeholder:text-white/25 focus:outline-none focus:ring-0 min-h-[60px] ${
                                        needsJustification ? "ring-1 ring-primary/30" : ""
                                      }`}
                                    />
                                    {needsJustification && (
                                      <p className="px-3 pb-2 text-xs text-primary">
                                        Pendência de justificativa — campo obrigatório
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/[0.06] px-5 py-4 flex items-center justify-between">
                      <div className="text-xs text-white/40">
                        {checklist.items.filter((i) => i.status === "delivered").length} de{" "}
                        {checklist.items.filter((i) => i.status !== "not_applicable").length} entregas concluídas
                      </div>
                      <Button
                        disabled={!finalizable}
                        className={`rounded-full text-sm px-5 font-semibold ${
                          finalizable
                            ? "gradient-primary border-0 text-white shadow-lg shadow-red-500/20"
                            : "bg-white/[0.06] text-white/30 border border-white/[0.08] cursor-not-allowed"
                        }`}
                      >
                        Confirmar Entrega
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
