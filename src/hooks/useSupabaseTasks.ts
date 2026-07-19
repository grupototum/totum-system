import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Enums, Tables } from "@/integrations/supabase/types";
import { Task, TaskStatus, RecurrenceType, RecurrenceConfig } from "@/components/tasks/taskData";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoTasks } from "@/data/demoData";
import {
  listTasksWithDetails,
  updateTaskStatus as updateTaskStatusRow,
  updateTask as updateTaskRow,
  createTasks,
  deleteTaskChildren,
  deleteTaskRow,
} from "@/data/tasks.repo";
import { listActiveClientsForDropdown } from "@/data/clients.repo";
import { listActiveProfilesForDropdown, listProfilesWithAvatarByOrg } from "@/data/profiles.repo";

type TaskRow = Tables<"tasks">;

export function useSupabaseTasks() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);

  const fetchTasks = useCallback(async () => {
    if (isDemoMode) {
      setTasks(demoTasks);
      setClients([
        { id: "demo-0001-0000-0000-000000000000", name: "TechVentures S.A." },
        { id: "demo-0002-0000-0000-000000000000", name: "Nova Digital LTDA" },
        { id: "demo-0003-0000-0000-000000000000", name: "Startup Labs" },
        { id: "demo-0004-0000-0000-000000000000", name: "Innova Corp" },
        { id: "demo-0005-0000-0000-000000000000", name: "DigitalPlus Agência" },
        { id: "demo-0006-0000-0000-000000000000", name: "Agro Connect" },
        { id: "demo-0007-0000-0000-000000000000", name: "Saúde Mais Clínicas" },
      ]);
      setProfiles([
        { user_id: "demo-user-1", full_name: "Ana Silva" },
        { user_id: "demo-user-2", full_name: "Carlos Mendes" },
        { user_id: "demo-user-3", full_name: "Juliana Costa" },
        { user_id: "demo-user-4", full_name: "Rafael Lima" },
        { user_id: "demo-user-5", full_name: "Marina Souza" },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const taskRows = await listTasksWithDetails();

      // Fetch profiles scoped to current tenant for name resolution
      // Explicit org filter is belt-and-suspenders over RLS (master user bypasses RLS)
      const profileRows = await listProfilesWithAvatarByOrg(tenant?.organization_id);

      const profileMap = new Map<string, { name: string; avatar: string | null }>();
      (profileRows || []).forEach((p: any) => profileMap.set(p.user_id, { name: p.full_name, avatar: p.avatar_url }));

      const mapped: Task[] = (taskRows || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        clientId: t.client_id,
        clientName: t.clients?.name || "—",
        clientManagerId: t.clients?.responsible_id || undefined,
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
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  const fetchClients = useCallback(async () => {
    if (isDemoMode) return;
    try {
      setClients(await listActiveClientsForDropdown());
    } catch {
      setClients([]);
    }
  }, [isDemoMode]);

  const fetchProfiles = useCallback(async () => {
    if (isDemoMode) return;
    // Scope explicitly to current tenant org.
    // Normal users are filtered by RLS; master users bypass RLS so we need
    // explicit org filter. Include masters that belong to the current org
    // (e.g. the sys-admin who also works as a team member in their own org).
    try {
      setProfiles(await listActiveProfilesForDropdown(tenant?.organization_id));
    } catch {
      setProfiles([]);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchProfiles();
  }, [fetchTasks, fetchClients, fetchProfiles]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (isDemoMode) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast({ title: "Modo Demo", description: `Status alterado para ${newStatus}` });
      return;
    }
    try {
      await updateTaskStatusRow(taskId, newStatus as Enums<"task_status">);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
      return;
    }

    await fetchTasks();
  };

  const updateTask = async (taskId: string, updates: Partial<TaskRow>) => {
    if (isDemoMode) {
      toast({ title: "Modo Demo", description: "Ação simulada com sucesso." });
      return true;
    }
    try {
      await updateTaskRow(taskId, updates);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
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
    if (isDemoMode) {
      toast({ title: "Modo Demo", description: `${newTasks.length} tarefas simuladas com sucesso.` });
      return true;
    }
    try {
      await createTasks(newTasks, tenant?.organization_id);
    } catch (error) {
      toast({ title: "Erro ao gerar tarefas", description: (error as Error).message, variant: "destructive" });
      return false;
    }

    await fetchTasks();
    toast({ title: "Tarefas geradas", description: `${newTasks.length} tarefas criadas com sucesso.` });
    return true;
  };

  const deleteTask = async (taskId: string) => {
    if (isDemoMode) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: "Modo Demo", description: "Tarefa excluída (simulado)." });
      return true;
    }

    try {
      await deleteTaskChildren(taskId);
    } catch (error) {
      toast({ title: "Erro ao excluir registros relacionados", description: (error as Error).message, variant: "destructive" });
      return false;
    }

    try {
      await deleteTaskRow(taskId);
    } catch (error) {
      toast({ title: "Erro ao excluir", description: (error as Error).message, variant: "destructive" });
      return false;
    }

    toast({ title: "Tarefa excluída", description: "A tarefa foi removida permanentemente." });
    await fetchTasks();
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
    deleteTask,
    refetch: fetchTasks,
  };
}
