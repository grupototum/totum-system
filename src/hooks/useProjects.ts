import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { demoProjects } from "@/data/demoData";

export type ProjectRow = Tables<"projects"> & {
  clients?: { name: string } | null;
  project_types?: { name: string } | null;
};

export function useProjects() {
  const { isDemoMode } = useDemo();
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
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const addProject = async (values: Partial<Tables<"projects">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    const { error } = await supabase.from("projects").insert(values as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Projeto criado", description: values.name });
    return true;
  };

  const updateProject = async (id: string, values: Partial<Tables<"projects">>) => {
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
