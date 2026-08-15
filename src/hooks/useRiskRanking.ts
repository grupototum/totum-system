import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientRisk {
  name: string;
  fulfillment: number;
  pendingItems: number;
  status: "healthy" | "warning" | "critical";
}

export function useRiskRanking() {
  const [risks, setRisks] = useState<ClientRisk[]>([]);

  useEffect(() => {
    async function load() {
      const { data: checklists } = await supabase
        .from("delivery_checklists")
        .select("client_id, fulfillment_pct, clients(name)");

      const { data: items } = await supabase
        .from("delivery_checklist_items")
        .select("checklist_id, status, delivery_checklists(client_id)");

      const clientMap = new Map<string, { name: string; totalPct: number; count: number; pending: number }>();

      (checklists || []).forEach((cl: any) => {
        const key = cl.client_id;
        const existing = clientMap.get(key) || { name: cl.clients?.name || "—", totalPct: 0, count: 0, pending: 0 };
        existing.totalPct += Number(cl.fulfillment_pct) || 0;
        existing.count += 1;
        clientMap.set(key, existing);
      });

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

  return { risks };
}