// Camada de acesso a dados de `projects` e das tabelas satélite que só fazem
// sentido no contexto de projeto: project_types, project_templates e
// project_template_tasks (mesmo padrão de tasks.repo.ts para os filhos de task).
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { attachOrganizationId } from "@/lib/tenant";

export type ProjectRow = Tables<"projects"> & {
  clients?: { name: string } | null;
  project_types?: { name: string } | null;
};

interface TaskDef {
  title: string;
  subtasks: { title: string }[];
}

export async function listProjectsWithRelations(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name), project_types(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ProjectRow[]) || [];
}

export async function createProjectWithTasks(
  values: Partial<Tables<"projects">>,
  tasks: TaskDef[],
  organizationId?: string
) {
  const payload = attachOrganizationId(values as any, organizationId);
  const { data: project, error } = await supabase.from("projects").insert(payload).select("id").single();
  if (error || !project) throw error || new Error("Falha ao criar projeto");

  for (const taskDef of tasks) {
    const taskPayload = attachOrganizationId({
      title: taskDef.title,
      client_id: values.client_id!,
      project_id: project.id,
      status: "pendente" as any,
      priority: "media" as any,
      task_type: "outro" as any,
    }, organizationId);
    const { data: task, error: taskErr } = await supabase.from("tasks").insert(taskPayload).select("id").single();
    if (taskErr || !task) continue;

    if (taskDef.subtasks.length > 0) {
      await supabase.from("subtasks").insert(
        taskDef.subtasks.map((sub, idx) => ({
          task_id: task.id,
          title: sub.title,
          sort_order: idx,
          status: "pendente" as any,
        }))
      );
    }
  }
}

export async function updateProject(id: string, values: Partial<Tables<"projects">>) {
  const { error } = await supabase.from("projects").update(values).eq("id", id);
  if (error) throw error;
}

export async function listActiveProjectTypes() {
  const { data, error } = await supabase.from("project_types").select("id, name").eq("is_active", true).order("name");
  if (error) throw error;
  return data || [];
}

export type ProjectTemplateTaskRow = Tables<"project_template_tasks"> & { subtasks: { title: string }[] };
export type ProjectTemplateRow = Tables<"project_templates"> & { project_template_tasks: ProjectTemplateTaskRow[] };

export async function listProjectTemplatesWithTasks(): Promise<ProjectTemplateRow[]> {
  const { data, error } = await supabase
    .from("project_templates")
    .select("*, project_template_tasks(*)")
    .order("name");
  if (error) throw error;
  return ((data as any[]) || []).map((t) => ({
    ...t,
    project_template_tasks: (t.project_template_tasks || []).map((task: any) => ({
      ...task,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    })),
  }));
}

interface TemplateTaskInput {
  title: string;
  description?: string | null;
  subtasks: { title: string }[];
}

export async function createProjectTemplate(name: string, description: string | null, tasks: TemplateTaskInput[]) {
  const { data: newTpl, error } = await supabase
    .from("project_templates")
    .insert({ name, description })
    .select("id")
    .single();
  if (error || !newTpl) throw error || new Error("Falha ao criar template");

  if (tasks.length > 0) {
    const { error: tasksErr } = await supabase.from("project_template_tasks").insert(
      tasks.map((t, idx) => ({
        template_id: newTpl.id,
        title: t.title,
        description: t.description || null,
        sort_order: idx,
        subtasks: t.subtasks as unknown as Json,
      }))
    );
    if (tasksErr) throw tasksErr;
  }
  return newTpl.id as string;
}

export async function replaceProjectTemplateTasks(templateId: string, name: string, description: string | null, tasks: TemplateTaskInput[]) {
  const { error } = await supabase.from("project_templates").update({ name, description }).eq("id", templateId);
  if (error) throw error;

  const { error: deleteErr } = await supabase.from("project_template_tasks").delete().eq("template_id", templateId);
  if (deleteErr) throw deleteErr;

  if (tasks.length > 0) {
    const { error: insertErr } = await supabase.from("project_template_tasks").insert(
      tasks.map((t, idx) => ({
        template_id: templateId,
        title: t.title,
        description: t.description || null,
        sort_order: idx,
        subtasks: t.subtasks as unknown as Json,
      }))
    );
    if (insertErr) throw insertErr;
  }
}

export async function deleteProjectTemplate(id: string) {
  const { error: tasksErr } = await supabase.from("project_template_tasks").delete().eq("template_id", id);
  if (tasksErr) throw tasksErr;
  const { error } = await supabase.from("project_templates").delete().eq("id", id);
  if (error) throw error;
}
