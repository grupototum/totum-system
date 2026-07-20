// Camada de acesso a dados de `tasks` — segue a convenção de src/data/clients.repo.ts:
// mutações vivem aqui, nomes por caso de uso, tipos de Tables<> gerados.
// Tabelas filhas de tasks (subtasks, task_checklist_items, task_comments,
// task_history) não têm existência própria fora de uma task — ficam aqui,
// não em repos separados.
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { attachOrganizationId } from "@/lib/tenant";

type TaskRow = Tables<"tasks">;

// Formato do select com joins abaixo — sem tipo gerado próprio (embedded
// resources do PostgREST não são cobertos pelo codegen), igual ao
// comportamento original que já tratava isto como `any`.
export async function listTasksWithDetails(): Promise<any[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      clients(name, responsible_id),
      plans(name),
      subtasks(*),
      task_checklist_items(*),
      task_comments(*),
      task_history(*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateTaskStatus(taskId: string, newStatus: Enums<"task_status">) {
  const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  if (error) throw error;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("task_history").insert({
      task_id: taskId,
      action: "Status alterado",
      detail: `Status → ${newStatus}`,
      user_id: user.id,
    });
  }
}

export async function updateTask(taskId: string, updates: Partial<TaskRow>) {
  const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
  if (error) throw error;
}

export async function createTasks(
  newTasks: Array<{
    title: string;
    client_id: string;
    priority: Enums<"task_priority">;
    task_type: Enums<"task_type">;
    status: Enums<"task_status">;
    plan_id?: string;
    contract_id?: string;
    delivery_model_item_id?: string;
    responsible_id?: string;
    generation_period?: string;
    due_date?: string;
    description?: string;
  }>,
  organizationId?: string,
) {
  const payload = newTasks.map((task) => attachOrganizationId(task, organizationId));
  const { error } = await supabase.from("tasks").insert(payload);
  if (error) throw error;
}

// Split em dois passos (não uma função só) para o hook poder distinguir
// "falhou apagando registro relacionado" de "falhou apagando a task em si"
// com mensagens de erro diferentes — igual ao comportamento original.
export async function deleteTaskChildren(taskId: string) {
  const cascadeResults = await Promise.all([
    supabase.from("task_checklist_items").delete().eq("task_id", taskId),
    supabase.from("task_comments").delete().eq("task_id", taskId),
    supabase.from("task_history").delete().eq("task_id", taskId),
    supabase.from("subtasks").delete().eq("task_id", taskId),
  ]);

  const cascadeError = cascadeResults.find((r) => r.error);
  if (cascadeError?.error) throw cascadeError.error;
}

export async function deleteTaskRow(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// Fluxo completo de criação usado pelo TaskFormDialog: task com campos ricos
// (SLA, recorrência etc.) + checklist + subtasks iniciais, numa só chamada.
export async function createTaskFull(
  insertPayload: Record<string, any>,
  checklistTexts: string[],
  subtaskTitles: string[]
) {
  const { data: taskData, error } = await (supabase as any).from("tasks").insert(insertPayload).select("id").single();
  if (error) throw error;

  if (checklistTexts.length > 0) {
    const items = checklistTexts.map((text, i) => ({
      task_id: taskData.id,
      text,
      sort_order: i,
      completed: false,
    }));
    const { error: itemsErr } = await supabase.from("task_checklist_items").insert(items);
    if (itemsErr) throw itemsErr;
  }

  if (subtaskTitles.length > 0) {
    const subs = subtaskTitles.map((title, i) => ({
      task_id: taskData.id,
      title,
      sort_order: i,
      status: "pendente" as any,
    }));
    const { error: subErr } = await supabase.from("subtasks").insert(subs);
    if (subErr) console.error("Erro ao criar subtarefas:", subErr);
  }

  return taskData.id as string;
}
