import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface ProjectTemplateTask {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  subtasks: { title: string }[] | null;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  project_template_tasks: ProjectTemplateTask[];
}

async function fetchTemplatesFromDB(): Promise<ProjectTemplate[]> {
  const { data, error } = await supabase
    .from("project_templates")
    .select("*, project_template_tasks(*)")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as ProjectTemplate[];
}

export function useProjectTemplates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["project_templates"],
    queryFn: fetchTemplatesFromDB,
  });

  const saveTemplate = async (tpl: {
    id?: string;
    name: string;
    description: string | null;
    tasks: { title: string; description?: string; subtasks: { title: string }[] }[];
  }) => {
    try {
      let tplId = tpl.id;
      if (tplId) {
        const { error } = await supabase.from("project_templates").update({ name: tpl.name.trim(), description: tpl.description || null }).eq("id", tplId);
        if (error) throw error;
        await supabase.from("project_template_tasks").delete().eq("template_id", tplId);
      } else {
        const { data, error } = await supabase.from("project_templates").insert({ name: tpl.name.trim(), description: tpl.description || null }).select("id").single();
        if (error) throw error;
        tplId = (data as any).id;
      }

      if (tpl.tasks.length > 0) {
        await supabase.from("project_template_tasks").insert(
          tpl.tasks.map((task, i) => ({
            template_id: tplId,
            title: task.title,
            description: task.description || null,
            sort_order: i,
            subtasks: task.subtasks as unknown as Json,
          }))
        );
      }

      toast({ title: tpl.id ? "Template atualizado" : "Template criado" });
      queryClient.invalidateQueries({ queryKey: ["project_templates"] });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const duplicateTemplate = async (tpl: ProjectTemplate) => {
    try {
      const { data, error } = await supabase.from("project_templates").insert({ name: `${tpl.name} (cópia)`, description: tpl.description }).select("id").single();
      if (error) throw error;
      const newId = (data as any).id;
      if (tpl.project_template_tasks?.length > 0) {
        await supabase.from("project_template_tasks").insert(
          tpl.project_template_tasks.map((task, i) => ({
            template_id: newId,
            title: task.title,
            description: (task as any).description || null,
            sort_order: i,
            subtasks: task.subtasks as unknown as Json,
          }))
        );
      }
      toast({ title: "Template duplicado" });
      queryClient.invalidateQueries({ queryKey: ["project_templates"] });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao duplicar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await supabase.from("project_template_tasks").delete().eq("template_id", id);
      const { error } = await supabase.from("project_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Template excluído" });
      queryClient.invalidateQueries({ queryKey: ["project_templates"] });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { ...query, saveTemplate, duplicateTemplate, deleteTemplate };
}
