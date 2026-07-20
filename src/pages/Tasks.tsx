import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, CalendarDays, Sparkles, BarChart3, Loader2, Plus, Archive, RotateCcw, LayoutTemplate, Target, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { GenerateTasksDialog } from "@/components/tasks/GenerateTasksDialog";
import { TaskCompletionDialog } from "@/components/tasks/TaskCompletionDialog";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { calculateNextDueDate } from "@/lib/recurrence";
import { Task, TaskStatus, initialTasks } from "@/components/tasks/taskData";
import { TaskTemplateManager } from "@/components/templates/TaskTemplateManager";
import { TaskGoals } from "@/components/tasks/TaskGoals";
import { ProjectTemplateManager } from "@/components/templates/ProjectTemplateManager";
import { Confetti } from "@/components/tasks/Confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { recordTaskCompletion, generateRecurringTaskInstance } from "@/data/tasks.repo";

type ViewMode = "dashboard" | "kanban" | "list" | "calendar" | "goals" | "templates";

export default function Tasks() {
  const { tasks: supabaseTasks, loading, updateTaskStatus, updateTask, deleteTask, refetch, profiles, clients } = useSupabaseTasks();
  const { tenant } = useTenant();
  
  const tasks = supabaseTasks.length > 0 || !loading ? supabaseTasks : initialTasks;
  
  const [view, setView] = useState<ViewMode>("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showArchived, setShowArchived] = useState(false);

  // Completion dialog state
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"dueDate" | "clientName" | "status" | "type" | "responsible">("dueDate");

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((t) => {
      // Archive filter: if not showing archived, hide them; if showing archived, ONLY show archived
      if (showArchived) {
        if (t.status !== "arquivado") return false;
      } else {
        if (t.status === "arquivado") return false;
      }
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (clientFilter.length > 0 && !clientFilter.includes(t.clientId)) return false;
      if (responsibleFilter.length > 0) {
        const passesResponsible = (responsibleFilter.includes("unassigned") && !t.responsible) ||
          (t.responsible != null && responsibleFilter.includes(t.responsible));
        if (!passesResponsible) return false;
      }
      if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(t.type)) return false;
      if (managerFilter.length > 0) {
        const passesManager = (managerFilter.includes("unassigned") && !t.clientManagerId) ||
          (t.clientManagerId != null && managerFilter.includes(t.clientManagerId));
        if (!passesManager) return false;
      }
      return true;
    });

    const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "clientName":
          return collator.compare(a.clientName || "", b.clientName || "");
        case "status":
          return collator.compare(a.status || "", b.status || "");
        case "type":
          return collator.compare(a.type || "", b.type || "");
        case "responsible":
          return collator.compare(a.responsible || "", b.responsible || "");
        case "dueDate":
        default: {
          // Sem prazo vai para o fim
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return da - db;
        }
      }
    });
    return sorted;
  }, [tasks, search, clientFilter, responsibleFilter, priorityFilter, typeFilter, managerFilter, showArchived, sortBy]);

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

    if ((data.decision === "next_action" && data.nextAction && task) || data.decision === "closed") {
      await recordTaskCompletion({
        taskId: data.taskId,
        decision: data.decision,
        comment: data.comment,
        userId,
        organizationId: tenant?.organization_id,
        task: task ? { clientId: task.clientId, type: task.type, contractId: task.contractId, projectId: task.projectId } : undefined,
        nextAction: data.nextAction,
      });
    }

    // --- Recurrence Logic ---
    if (task && task.isRecurring && !task.parentTaskId) {
      const nextDueDate = calculateNextDueDate(
        task.dueDate || new Date().toISOString(),
        task.recurrenceType || "mensal",
        task.recurrenceConfig
      );

      const isEnded = task.recurrenceEndDate && new Date(nextDueDate) > new Date(task.recurrenceEndDate);

      if (!isEnded) {
        await generateRecurringTaskInstance(
          {
            id: task.id, title: task.title, description: task.description, clientId: task.clientId,
            responsibleId: task.responsibleId, priority: task.priority, type: task.type,
            contractId: task.contractId, projectId: task.projectId,
          },
          nextDueDate,
          tenant?.organization_id,
        );
      }
    }

    // Mark task as completed
    await updateTaskStatus(data.taskId, "concluido");
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);

    if (detailOpen) {
      setDetailOpen(false);
      setSelectedTask(null);
    }

    toast({
      title: "Tarefa concluída",
      description: "Operação realizada com sucesso.",
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
    { key: "goals", icon: Target, label: "Metas" },
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
          <p className="text-sm text-muted-foreground mt-1">
            {showArchived ? (
              <span>{archivedCount} tarefa{archivedCount !== 1 ? "s" : ""} arquivada{archivedCount !== 1 ? "s" : ""}</span>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-foreground/70 font-medium">
                    {activeTasks.filter(t => t.status === 'concluido').length} de {activeTasks.length} concluídas
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{pendingTasks} pendentes</span>
                  {overdueTasks > 0 && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
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
            className={`gap-2 rounded-full px-4 text-sm border-border ${
              showArchived 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "bg-muted/40 hover:bg-muted/80 text-foreground"
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
                className="gap-2 rounded-full px-4 text-sm border-border bg-muted/40 hover:bg-muted/80 text-foreground"
              >
                <Sparkles className="h-4 w-4 text-primary" /> Gerar do Pacote
              </Button>
            </>
          )}
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-border w-fit overflow-x-auto">
            {viewButtons.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  view === v.key
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                    : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>

          {view !== "dashboard" && view !== "templates" && view !== "goals" && (
            <div className="flex items-center gap-2 lg:shrink-0">
              <div className="relative flex-1 lg:flex-none lg:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 bg-white/[0.05] border-border rounded-lg h-9 text-xs placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="h-9 w-[160px] bg-white/[0.05] border-border rounded-lg text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Por data</SelectItem>
                  <SelectItem value="clientName">Por cliente</SelectItem>
                  <SelectItem value="status">Por status</SelectItem>
                  <SelectItem value="type">Por tipo</SelectItem>
                  <SelectItem value="responsible">Por responsável</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {view !== "dashboard" && view !== "templates" && view !== "goals" && (
          <TaskFilters
            clientFilter={clientFilter} onClientFilterChange={setClientFilter}
            responsibleFilter={responsibleFilter} onResponsibleFilterChange={setResponsibleFilter}
            priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
            typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
            managerFilter={managerFilter} onManagerFilterChange={setManagerFilter}
            tasks={tasks}
            profiles={profiles}
            clients={clients}
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
          {view === "goals" && !showArchived && (
            <TaskGoals tasks={activeTasks} profiles={profiles} clients={clients} />
          )}
          {view === "templates" && (
            <div className="mt-4">
              <Tabs defaultValue="projects" className="space-y-4">
                <TabsList className="bg-white/[0.04] border border-border">
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
        profiles={profiles}
        onDelete={async (taskId) => {
          const success = await deleteTask(taskId);
          if (success) {
            setDetailOpen(false);
            setSelectedTask(null);
          }
        }}
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
