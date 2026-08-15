import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TaskGoal {
  id: string;
  title: string;
  description: string | null;
  target_count: number;
  current_count: number;
  goal_type: string;
  period: string;
  start_date: string;
  end_date: string | null;
  status: string;
  responsible_id: string | null;
  client_id: string | null;
}

export function useTaskGoals() {
  const [goals, setGoals] = useState<TaskGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("task_goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setGoals(data);
    setLoading(false);
  }, []);

  const saveGoal = async (payload: Omit<TaskGoal, "id" | "current_count" | "status"> & { id?: string }) => {
    if (payload.id) {
      const { error } = await (supabase as any).from("task_goals").update(payload).eq("id", payload.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Meta atualizada" });
    } else {
      const { error } = await (supabase as any).from("task_goals").insert(payload);
      if (error) {
        toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Meta criada com sucesso" });
    }
    await fetchGoals();
    return true;
  };

  const deleteGoal = async (id: string) => {
    const { error } = await (supabase as any).from("task_goals").delete().eq("id", id);
    if (!error) {
      toast({ title: "Meta removida" });
      await fetchGoals();
      return true;
    }
    return false;
  };

  return { goals, loading, fetchGoals, saveGoal, deleteGoal };
}
