import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const createGoal = async (payload: Omit<TaskGoal, "id" | "current_count" | "status">) => {
    const { error } = await (supabase as any).from("task_goals").insert(payload);
    if (error) return error;
    await fetchGoals();
    return null;
  };

  const updateGoal = async (id: string, payload: Partial<TaskGoal>) => {
    const { error } = await (supabase as any).from("task_goals").update(payload).eq("id", id);
    if (error) return error;
    await fetchGoals();
    return null;
  };

  const deleteGoal = async (id: string) => {
    const { error } = await (supabase as any).from("task_goals").delete().eq("id", id);
    if (error) return error;
    await fetchGoals();
    return null;
  };

  return { goals, loading, refetch: fetchGoals, createGoal, updateGoal, deleteGoal };
}