import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Task, TaskStatus, RecurrenceType, RecurrenceConfig } from "@/components/tasks/taskData";

type TaskRow = Tables<"tasks">;

export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    const { data: taskRows, error } = await supabase
      .from("tasks")
      .select(`
        *,
        clients(name),
        plans(name),
        subtasks(*),
        task_checklist_items(*),
        task_comments(*),
        task_history(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
      return;
    }

    const { data: profileRows } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url");

    const profileMap = new Map<string, { name: string; avatar: string | null }>();
    (profileRows || []).forEach((p: any) => profileMap.set(p.user_id, { name: p.full_name, avatar: p.avatar_url }));

    const mapped: Task[] = (taskRows || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      clientId: t.client_id,
      clientName: t.clients?.name || "—",
      contractId: t.contract_id || undefined,
      planName: t.plans?.name || undefined,
      projectId: t.project_id || undefined,
      responsible: t.responsible_id ? profileMap.get(t.responsible_id)?.name || undefined : undefined,
      responsibleAvatarUrl: t.responsible_id ? profileMap.get(t.responsible_id)?.avatar || undefined : undefined,
      responsibleId: t.responsible_id || undefined,
      priority: t.priority as any,
      status: t.status as TaskStatus,
      type: t.task_type as any,
      startDate: t.start_date || undefined,
      dueDate: t.due_date || undefined,
      estimatedTime: t.estimated_minutes || undefined,
      actualTime: t.actual_minutes || undefined,
      // Recurrence fields
      isRecurring: t.is_recurring || false,
      recurrenceType: t.recurrence_type as RecurrenceType | undefined,
      recurrenceConfig: t.recurrence_config as RecurrenceConfig | undefined,
      recurrenceEndDate: t.recurrence_end_date || undefined,
      parentTaskId: t.parent_task_id || undefined,
      lastGeneratedAt: t.last_generated_at || undefined,
      subtasks: (t.subtasks || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        status: s.status as TaskStatus,
        responsible: s.responsible_id ? profileMap.get(s.responsible_id)?.name : undefined,
        dueDate: s.due_date || undefined,
      })),
      checklist: (t.task_checklist_items || []).map((c: any) => ({
        id: c.id,
        text: c.text,
        completed: c.completed,
      })),
      comments: (t.task_comments || []).map((c: any) => ({
        id: c.id,
        author: profileMap.get(c.user_id)?.name || "Usuário",
        authorAvatarUrl: profileMap.get(c.user_id)?.avatar || undefined,
        text: c.content,
        createdAt: c.created_at,
      })),
      history: (t.task_history || []).map((h: any) => ({
        id: h.id,
        action: h.action,
        detail: h.detail || "",
        user: h.user_id ? profileMap.get(h.user_id)?.name || "Sistema" : "Sistema",
        createdAt: h.created_at,
      })),
    }));

    setTasks(mapped);
    setLoading(false);
  }, []);

  const fetchClients = useCallback(async () => {
    const { data } = await supabase.from("clients").select("id, name").eq("status", "ativo").order("name");
    setClients(data || []);
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name").eq("status", "ativo").order("full_name");
    setProfiles(data || []);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchProfiles();
  }, [fetchTasks, fetchClients, fetchProfiles]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus as Enums<"task_status"> })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("task_history").insert({
        task_id: taskId,
        action: "Status alterado",
        detail: `Status → ${newStatus}`,
        user_id: user.id,
      });
    }

    await fetchTasks();
  };

  const updateTask = async (taskId: string, updates: Partial<TaskRow>) => {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }

    await fetchTasks();
    return true;
  };

  const addTasks = async (newTasks: Array<{
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
  }>) => {
    const { error } = await supabase.from("tasks").insert(newTasks);

    if (error) {
      toast({ title: "Erro ao gerar tarefas", description: error.message, variant: "destructive" });
      return false;
    }

    await fetchTasks();
    toast({ title: "Tarefas geradas", description: `${newTasks.length} tarefas criadas com sucesso.` });
    return true;
  };

  return {
    tasks,
    loading,
    clients,
    profiles,
    updateTaskStatus,
    updateTask,
    addTasks,
    refetch: fetchTasks,
  };
}
