import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClientRisk {
  name: string;
  fulfillment: number;
  pendingItems: number;
  status: "healthy" | "warning" | "critical";
}

export function RiskRanking() {
  const [risks, setRisks] = useState<ClientRisk[]>([]);

  useEffect(() => {
    async function load() {
      const { data: checklists } = await supabase
        .from("delivery_checklists")
        .select("client_id, fulfillment_pct, clients(name)");

      const { data: items } = await supabase
        .from("delivery_checklist_items")
        .select("checklist_id, status, delivery_checklists(client_id)");

      // Aggregate fulfillment by client
      const clientMap = new Map<string, { name: string; totalPct: number; count: number; pending: number }>();

      (checklists || []).forEach((cl: any) => {
        const key = cl.client_id;
        const existing = clientMap.get(key) || { name: cl.clients?.name || "—", totalPct: 0, count: 0, pending: 0 };
        existing.totalPct += Number(cl.fulfillment_pct) || 0;
        existing.count += 1;
        clientMap.set(key, existing);
      });

      // Count pending items per client
      (items || []).forEach((item: any) => {
        const clientId = (item.delivery_checklists as any)?.client_id;
        if (!clientId || item.status === "entregue" || item.status === "nao_aplicavel") return;
        const existing = clientMap.get(clientId);
        if (existing) existing.pending += 1;
      });

      const result: ClientRisk[] = Array.from(clientMap.values())
        .map((v) => {
          const fulfillment = v.count > 0 ? Math.round(v.totalPct / v.count) : 0;
          return {
            name: v.name,
            fulfillment,
            pendingItems: v.pending,
            status: fulfillment >= 90 ? "healthy" as const : fulfillment >= 70 ? "warning" as const : "critical" as const,
          };
        })
        .sort((a, b) => a.fulfillment - b.fulfillment)
        .slice(0, 8);

      setRisks(result);
    }
    load();
  }, []);

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
        {risks.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4">Nenhum checklist de entrega cadastrado</p>
        ) : risks.map((client, i) => (
          <div
            key={client.name + i}
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
