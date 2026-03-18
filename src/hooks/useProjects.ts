import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ProjectRow = Tables<"projects"> & {
  clients?: { name: string } | null;
  project_types?: { name: string } | null;
};

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*, clients(name), project_types(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects((data as ProjectRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addProject = async (values: Partial<Tables<"projects">>) => {
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
