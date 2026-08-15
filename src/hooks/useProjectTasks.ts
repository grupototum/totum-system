import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useProjectTasks(projectId: string | null | undefined, enabled: boolean) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !enabled) { setTasks([]); return; }
    setLoading(true);
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, responsible_id, subtasks(*)")
      .eq("project_id", projectId)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Erro ao carregar tarefas do projeto", description: error.message, variant: "destructive" });
        } else {
          setTasks(data || []);
        }
        setLoading(false);
      });
  }, [projectId, enabled]);

  return { tasks, loading };
}