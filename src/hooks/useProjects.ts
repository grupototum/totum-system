import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { attachOrganizationId } from "@/lib/tenant";
import { demoProjects } from "@/data/demoData";

export type ProjectRow = Tables<"projects"> & {
  clients?: { name: string } | null;
  project_types?: { name: string } | null;
};

interface TaskDef {
  title: string;
  subtasks: { title: string }[];
}

export function useProjects() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setProjects(demoProjects as ProjectRow[]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name), project_types(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProjects((data as ProjectRow[]) || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const addProject = async (values: Partial<Tables<"projects">>, tasks: TaskDef[] = []) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }

    // Create project
    const payload = attachOrganizationId(values as any, tenant?.organization_id);
    const { data: project, error } = await supabase.from("projects").insert(payload).select("id").single();
    if (error || !project) {
      toast({ title: "Erro", description: error?.message, variant: "destructive" });
      return false;
    }

    // Create tasks + subtasks (bulk, em vez de 1 insert por tarefa/subtarefa em loop)
    if (tasks.length > 0) {
      const taskPayloads = tasks.map((taskDef) => attachOrganizationId({
        title: taskDef.title,
        client_id: values.client_id!,
        project_id: project.id,
        status: "pendente" as any,
        priority: "media" as any,
        task_type: "outro" as any,
      }, tenant?.organization_id));

      const { data: insertedTasks, error: tasksErr } = await supabase.from("tasks").insert(taskPayloads).select("id");

      // A ordem de retorno do insert em lote acompanha a ordem de inserção (Postgres/PostgREST).
      if (!tasksErr && insertedTasks) {
        const subtaskPayloads = tasks.flatMap((taskDef, i) => {
          const taskId = insertedTasks[i]?.id;
          if (!taskId || taskDef.subtasks.length === 0) return [];
          return taskDef.subtasks.map((sub, idx) => ({
            task_id: taskId,
            title: sub.title,
            sort_order: idx,
            status: "pendente" as any,
          }));
        });
        if (subtaskPayloads.length > 0) {
          await supabase.from("subtasks").insert(subtaskPayloads);
        }
      }
    }

    await fetch();
    toast({ title: "Projeto criado", description: values.name as string });
    return true;
  };

  const updateProject = async (id: string, values: Partial<Tables<"projects">>, _tasks?: TaskDef[]) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    const { error } = await supabase.from("projects").update(values).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { projects, loading, refetch: fetch, addProject, updateProject };
}
