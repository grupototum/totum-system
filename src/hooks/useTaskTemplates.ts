import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TaskTemplateItem {
  id?: string;
  title: string;
  description?: string;
  sort_order: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  task_template_items: TaskTemplateItem[];
}

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTemplates([]); return; }
      const { data, error } = await supabase
        .from("task_templates")
        .select("*, task_template_items(*)")
        .order("name");
      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar templates", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = async (tpl: {
    id?: string;
    name: string;
    description: string | null;
    items: { title: string; description?: string }[];
  }) => {
    try {
      let tplId = tpl.id;
      if (tplId) {
        const { error } = await supabase.from("task_templates" as any).update({ name: tpl.name, description: tpl.description }).eq("id", tplId);
        if (error) throw error;
        await supabase.from("task_template_items" as any).delete().eq("template_id", tplId);
      } else {
        const { data, error } = await supabase.from("task_templates" as any).insert({ name: tpl.name, description: tpl.description }).select("id").single();
        if (error) throw error;
        tplId = (data as any).id;
      }

      if (tpl.items.length > 0) {
        await supabase.from("task_template_items" as any).insert(
          tpl.items.map((item, i) => ({ template_id: tplId, title: item.title, description: item.description || "", sort_order: i }))
        );
      }

      toast({ title: tpl.id ? "Template atualizado" : "Template criado" });
      await fetchTemplates();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const duplicateTemplate = async (tpl: TaskTemplate) => {
    try {
      const { data, error } = await supabase.from("task_templates" as any).insert({ name: `${tpl.name} (cópia)`, description: tpl.description }).select("id").single();
      if (error) throw error;
      const newId = (data as any).id;
      if (tpl.task_template_items?.length > 0) {
        await supabase.from("task_template_items" as any).insert(
          tpl.task_template_items.map((item, i) => ({ template_id: newId, title: item.title, description: (item as any).description || "", sort_order: i }))
        );
      }
      toast({ title: "Template duplicado" });
      await fetchTemplates();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao duplicar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await supabase.from("task_template_items" as any).delete().eq("template_id", id);
      const { error } = await supabase.from("task_templates" as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Template excluído" });
      await fetchTemplates();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { templates, loading, fetchTemplates, saveTemplate, duplicateTemplate, deleteTemplate };
}
