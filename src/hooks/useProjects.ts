import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoProjects } from "@/data/demoData";
import { reportError } from "@/lib/errorHandler";
import {
  listProjectsWithRelations,
  createProjectWithTasks,
  updateProject as updateProjectRepo,
  type ProjectRow,
} from "@/data/projects.repo";

export type { ProjectRow };

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
      setProjects(await listProjectsWithRelations());
    } catch (err) {
      reportError("Error fetching projects:", err, "projects_list");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const addProject = async (values: Partial<Tables<"projects">>, tasks: TaskDef[] = []) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }

    try {
      await createProjectWithTasks(values, tasks, tenant?.organization_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }

    await fetch();
    toast({ title: "Projeto criado", description: values.name as string });
    return true;
  };

  const updateProject = async (id: string, values: Partial<Tables<"projects">>, _tasks?: TaskDef[]) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    try {
      await updateProjectRepo(id, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { projects, loading, refetch: fetch, addProject, updateProject };
}
