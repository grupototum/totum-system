import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface ClientRisk {
  name: string;
  fulfillment: number;
  pendingItems: number;
  status: "healthy" | "warning" | "critical";
}

const mockRisks: ClientRisk[] = [
  { name: "TechVentures S.A.", fulfillment: 42, pendingItems: 7, status: "critical" },
  { name: "Nova Digital", fulfillment: 65, pendingItems: 4, status: "warning" },
  { name: "Startup Labs", fulfillment: 78, pendingItems: 2, status: "warning" },
  { name: "Innova Corp", fulfillment: 91, pendingItems: 1, status: "healthy" },
  { name: "DigitalPlus", fulfillment: 95, pendingItems: 0, status: "healthy" },
  { name: "Agro Connect", fulfillment: 100, pendingItems: 0, status: "healthy" },
];

export function RiskRanking() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="font-heading text-base font-semibold mb-1">Ranking de Risco Operacional</h3>
      <p className="text-xs text-white/40 mb-5">Ordenado por % de cumprimento contratual</p>

      <div className="space-y-1">
        {mockRisks.map((client, i) => (
          <div
            key={client.name}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-xs text-white/30 w-4 font-mono">{i + 1}</span>

            <div className={`h-2 w-2 rounded-full shrink-0 ${
              client.status === "critical" ? "bg-red-500" :
              client.status === "warning" ? "bg-amber-500" : "bg-emerald-500"
            }`} />

            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">{client.name}</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {client.pendingItems > 0 && (
                <span className="text-xs text-amber-400/80 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {client.pendingItems}
                </span>
              )}
              <div className="w-20">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        client.fulfillment >= 90 ? "bg-emerald-500" :
                        client.fulfillment >= 70 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${client.fulfillment}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white/60 w-8 text-right">
                    {client.fulfillment}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
