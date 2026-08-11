import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTemplateTask {
  id: string;
  title: string;
  sort_order: number;
  subtasks: { title: string }[] | null;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  project_template_tasks: ProjectTemplateTask[];
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: ["project_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*, project_template_tasks(*)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ProjectTemplate[];
    },
  });
}
