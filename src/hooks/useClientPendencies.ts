import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoTasks, demoDeliveryChecklists } from "@/data/demoData";

export interface LateTask {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
}

export interface IncompleteDelivery {
  id: string;
  period: string;
  frequency: string;
  fulfillment_pct: number;
  plans: { name: string } | null;
}

export function useClientPendencies(clientId: string) {
  const { isDemoMode } = useDemo();
  const [lateTasks, setLateTasks] = useState<LateTask[]>([]);
  const [incompleteDeliveries, setIncompleteDeliveries] = useState<IncompleteDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    if (isDemoMode) {
      const late = (demoTasks as any[])
        .filter((t) => t.clientId === clientId && t.status !== "concluido" && t.dueDate && t.dueDate < today)
        .map((t) => ({ id: t.id, title: t.title, due_date: t.dueDate, priority: t.priority, status: t.status }));

      const incomplete = (demoDeliveryChecklists as any[])
        .filter((c) => c.client_id === clientId && !c.completed_at)
        .map((c) => ({ id: c.id, period: c.period, frequency: c.frequency, fulfillment_pct: c.fulfillment_pct, plans: c.plans }));

      setLateTasks(late);
      setIncompleteDeliveries(incomplete);
      setLoading(false);
      return;
    }

    const [{ data: tasks }, { data: checklists }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, due_date, priority, status")
        .eq("client_id", clientId)
        .neq("status", "concluido")
        .lt("due_date", today)
        .order("due_date"),
      supabase
        .from("delivery_checklists")
        .select("id, period, frequency, fulfillment_pct, plans(name)")
        .eq("client_id", clientId)
        .is("completed_at", null)
        .order("created_at", { ascending: false }),
    ]);

    setLateTasks((tasks as LateTask[]) || []);
    setIncompleteDeliveries((checklists as IncompleteDelivery[]) || []);
    setLoading(false);
  }, [clientId, isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  return { lateTasks, incompleteDeliveries, loading, refetch: fetch };
}
