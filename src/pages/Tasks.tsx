import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, CalendarDays, Sparkles, BarChart3, Loader2, Plus, Archive, RotateCcw, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { GenerateTasksDialog } from "@/components/tasks/GenerateTasksDialog";
import { TaskCompletionDialog } from "@/components/tasks/TaskCompletionDialog";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { Task, TaskStatus, initialTasks } from "@/components/tasks/taskData";
import { TaskTemplateManager } from "@/components/templates/TaskTemplateManager";
import { ProjectTemplateManager } from "@/components/templates/ProjectTemplateManager";
import { Confetti } from "@/components/tasks/Confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type ViewMode = "dashboard" | "kanban" | "list" | "calendar" | "templates";

export default function Tasks() {
  const { tasks: supabaseTasks, loading, updateTaskStatus, updateTask, refetch, profiles, clients } = useSupabaseTasks();
  
  const tasks = supabaseTasks.length > 0 || !loading ? supabaseTasks : initialTasks;
  
  const [view, setView] = useState<ViewMode>("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 2, 1));
  const [showArchived, setShowArchived] = useState(false);

  // Completion dialog state
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Archive filter: if not showing archived, hide them; if showing archived, ONLY show archived
      if (showArchived) {
        if (t.status !== "arquivado") return false;
      } else {
        if (t.status === "arquivado") return false;
      }
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (clientFilter.length > 0 && !clientFilter.includes(t.clientId)) return false;
      if (responsibleFilter.length > 0) {
        if (responsibleFilter.includes("unassigned") && !t.responsible) return true;
        if (!t.responsible || !responsibleFilter.includes(t.responsible)) return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(t.status)) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(t.type)) return false;
      return true;
    });
  }, [tasks, search, clientFilter, responsibleFilter, statusFilter, priorityFilter, typeFilter, showArchived]);

  const archivedCount = useMemo(() => tasks.filter(t => t.status === "arquivado").length, [tasks]);

  const handleUnarchive = async (taskId: string) => {
    await updateTaskStatus(taskId, "concluido");
    toast({ title: "Tarefa restaurada", description: "A tarefa foi movida de volta para Concluído." });
  };

  // Intercept status changes to "concluido" — open completion dialog
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === "concluido") {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== "concluido") {
        setCompletionTask(task);
        setCompletionOpen(true);
        return;
      }
    }
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    // Intercept if changing to "concluido" from detail dialog
    if (updatedTask.status === "concluido" && selectedTask && selectedTask.status !== "concluido") {
      setCompletionTask(updatedTask);
      setCompletionOpen(true);
      // Revert the status in the detail dialog
      setSelectedTask({ ...updatedTask, status: selectedTask.status });
      return;
    }

    setSelectedTask(updatedTask);
    await updateTask(updatedTask.id, {
      status: updatedTask.status as any,
      priority: updatedTask.priority as any,
      task_type: updatedTask.type as any,
      description: updatedTask.description || null,
      start_date: updatedTask.startDate || null,
      due_date: updatedTask.dueDate || null,
      is_recurring: updatedTask.isRecurring || false,
      recurrence_type: updatedTask.recurrenceType || null,
      recurrence_config: (updatedTask.recurrenceConfig as any) || null,
      recurrence_end_date: updatedTask.recurrenceEndDate || null,
    });
  };

  // Handle the completion flow
  const handleComplete = async (data: {
    taskId: string;
    decision: "closed" | "next_action";
    comment?: string;
    nextAction?: {
      title: string;
      description: string;
      responsible_id: string;
      due_date: string;
      priority: string;
    };
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const task = tasks.find((t) => t.id === data.taskId);

    if (data.decision === "next_action" && data.nextAction && task) {
      // Create subtask linked to original task
      const { error: subErr } = await supabase.from("subtasks").insert({
        task_id: data.taskId,
        title: data.nextAction.title,
        status: "pendente",
        responsible_id: data.nextAction.responsible_id || null,
        due_date: data.nextAction.due_date || null,
      });
      if (subErr) {
        toast({ title: "Erro ao criar subtarefa", description: subErr.message, variant: "destructive" });
        return;
      }

      // Also create a new standalone task linked as child
      const { error: taskErr } = await supabase.from("tasks").insert({
        title: data.nextAction.title,
        description: data.nextAction.description || null,
        client_id: task.clientId,
        parent_task_id: data.taskId,
        responsible_id: data.nextAction.responsible_id || null,
        due_date: data.nextAction.due_date || null,
        priority: data.nextAction.priority as any,
        status: "pendente",
        task_type: task.type as any,
        contract_id: task.contractId || null,
        project_id: task.projectId || null,
      });
      if (taskErr) {
        toast({ title: "Erro ao criar tarefa", description: taskErr.message, variant: "destructive" });
        return;
      }

      // Log history
      if (userId) {
        await supabase.from("task_history").insert({
          task_id: data.taskId,
          action: "Concluída com próxima ação",
          detail: `Próxima ação criada: "${data.nextAction.title}"`,
          user_id: userId,
        });
      }
    } else if (data.decision === "closed") {
      // Add optional comment
      if (data.comment && userId) {
        await supabase.from("task_comments").insert({
          task_id: data.taskId,
          content: `[Conclusão] ${data.comment}`,
          user_id: userId,
        });
      }

      // Log history
      if (userId) {
        await supabase.from("task_history").insert({
          task_id: data.taskId,
          action: "Concluída e encerrada",
          detail: data.comment ? `Comentário: ${data.comment}` : "Tarefa encerrada sem ações adicionais",
          user_id: userId,
        });
      }
    }

    // Mark task as completed
    await updateTaskStatus(data.taskId, "concluido");
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);

    // Close detail dialog if open
    if (detailOpen) {
      setDetailOpen(false);
      setSelectedTask(null);
    }

    toast({
      title: "Tarefa concluída",
      description: data.decision === "next_action"
        ? `Próxima ação "${data.nextAction?.title}" criada com sucesso.`
        : "Tarefa encerrada com sucesso.",
    });
  };

  const handleGenerateTasks = (newTasks: Task[]) => {
    refetch();
  };

  const viewButtons: { key: ViewMode; icon: any; label: string }[] = [
    { key: "dashboard", icon: BarChart3, label: "Dashboard" },
    { key: "kanban", icon: LayoutGrid, label: "Kanban" },
    { key: "list", icon: List, label: "Lista" },
    { key: "calendar", icon: CalendarDays, label: "Calendário" },
    { key: "templates", icon: LayoutTemplate, label: "Templates" },
  ];

  // Stats (exclude archived)
  const activeTasks = tasks.filter(t => t.status !== "arquivado");
  const overdueTasks = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "concluido").length;
  const pendingTasks = activeTasks.filter((t) => t.status === "pendente").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            {showArchived ? "Tarefas Arquivadas" : "Tarefas"}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {showArchived ? (
              <span>{archivedCount} tarefa{archivedCount !== 1 ? "s" : ""} arquivada{archivedCount !== 1 ? "s" : ""}</span>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 font-medium">
                    {activeTasks.filter(t => t.status === 'concluido').length} de {activeTasks.length} concluídas
                  </span>
                  <span className="text-white/20">·</span>
                  <span>{pendingTasks} pendentes</span>
                  {overdueTasks > 0 && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-red-400">{overdueTasks} atrasada{overdueTasks > 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(activeTasks.filter(t => t.status === 'concluido').length / Math.max(activeTasks.length, 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant="outline"
            className={`gap-2 rounded-full px-4 text-sm border-white/[0.1] ${
              showArchived 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "bg-white/[0.04] hover:bg-white/[0.08] text-white"
            }`}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Ver Ativas" : `Arquivadas${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
          </Button>
          {!showArchived && (
            <>
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-2 rounded-full px-4 text-sm"
              >
                <Plus className="h-4 w-4" /> Nova Tarefa
              </Button>
              <Button
                onClick={() => setGenerateOpen(true)}
                variant="outline"
                className="gap-2 rounded-full px-4 text-sm border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white"
              >
                <Sparkles className="h-4 w-4 text-primary" /> Gerar do Plano
              </Button>
            </>
          )}
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit overflow-x-auto">
          {viewButtons.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                view === v.key
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>

        {view !== "dashboard" && view !== "templates" && (
          <TaskFilters
            search={search} onSearchChange={setSearch}
            clientFilter={clientFilter} onClientFilterChange={setClientFilter}
            responsibleFilter={responsibleFilter} onResponsibleFilterChange={setResponsibleFilter}
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
            typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
            tasks={tasks}
          />
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {view === "dashboard" && !showArchived && <TaskDashboard tasks={activeTasks} />}
          {view === "kanban" && !showArchived && (
            <TaskKanban
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
            />
          )}
          {(view === "list" || showArchived) && (
            <TaskListView 
              tasks={filteredTasks} 
              onTaskClick={handleTaskClick}
              showUnarchive={showArchived}
              onUnarchive={handleUnarchive}
            />
          )}
          {view === "calendar" && !showArchived && (
            <TaskCalendar
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
            />
          )}
          {view === "templates" && (
            <div className="mt-4">
              <Tabs defaultValue="projects" className="space-y-4">
                <TabsList className="bg-white/[0.04] border border-white/[0.1]">
                  <TabsTrigger value="projects">Templates de Projeto</TabsTrigger>
                  <TabsTrigger value="tasks">Templates de Tarefa</TabsTrigger>
                </TabsList>
                <TabsContent value="projects">
                  <ProjectTemplateManager />
                </TabsContent>
                <TabsContent value="tasks">
                  <TaskTemplateManager />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </motion.div>
      )}

      <TaskDetailDialog
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleTaskUpdate}
      />

      <GenerateTasksDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerate={handleGenerateTasks}
      />

      <TaskCompletionDialog
        task={completionTask}
        open={completionOpen}
        onOpenChange={setCompletionOpen}
        profiles={profiles}
        onComplete={handleComplete}
      />

      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        profiles={profiles}
        onCreated={refetch}
      />
      <Confetti active={confettiActive} />
    </div>
  );
}
