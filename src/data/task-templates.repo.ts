// Camada de acesso a dados de `task_templates`/`task_template_items` —
// mesmo padrão de projects.repo.ts para os templates de projeto.
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TaskTemplateItemRow = Tables<"task_template_items">;
export type TaskTemplateRow = Tables<"task_templates"> & { task_template_items: TaskTemplateItemRow[] };

export async function listTaskTemplatesWithItems(): Promise<TaskTemplateRow[]> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("*, task_template_items(*)")
    .order("name");
  if (error) throw error;
  return (data as TaskTemplateRow[]) || [];
}

interface TemplateItemInput {
  title: string;
  description?: string | null;
}

export async function createTaskTemplate(name: string, description: string | null, items: TemplateItemInput[]) {
  const { data: newTpl, error } = await supabase
    .from("task_templates")
    .insert({ name, description })
    .select("id")
    .single();
  if (error || !newTpl) throw error || new Error("Falha ao criar template");

  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("task_template_items").insert(
      items.map((item, idx) => ({
        template_id: newTpl.id,
        title: item.title,
        description: item.description || null,
        sort_order: idx,
      }))
    );
    if (itemsErr) throw itemsErr;
  }
  return newTpl.id as string;
}

export async function replaceTaskTemplateItems(templateId: string, name: string, description: string | null, items: TemplateItemInput[]) {
  const { error } = await supabase.from("task_templates").update({ name, description }).eq("id", templateId);
  if (error) throw error;

  const { error: deleteErr } = await supabase.from("task_template_items").delete().eq("template_id", templateId);
  if (deleteErr) throw deleteErr;

  if (items.length > 0) {
    const { error: insertErr } = await supabase.from("task_template_items").insert(
      items.map((item, idx) => ({
        template_id: templateId,
        title: item.title,
        description: item.description || null,
        sort_order: idx,
      }))
    );
    if (insertErr) throw insertErr;
  }
}

export async function deleteTaskTemplate(id: string) {
  const { error: itemsErr } = await supabase.from("task_template_items").delete().eq("template_id", id);
  if (itemsErr) throw itemsErr;
  const { error } = await supabase.from("task_templates").delete().eq("id", id);
  if (error) throw error;
}
