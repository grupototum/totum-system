import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, CalendarDays, Sparkles, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { GenerateTasksDialog } from "@/components/tasks/GenerateTasksDialog";
import { Task, TaskStatus, initialTasks } from "@/components/tasks/taskData";
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks";

type ViewMode = "dashboard" | "kanban" | "list" | "calendar";

export default function Tasks() {
  const { tasks: supabaseTasks, loading, updateTaskStatus, refetch } = useSupabaseTasks();
  
  const tasks = supabaseTasks.length > 0 || !loading ? supabaseTasks : initialTasks;
  
  const [view, setView] = useState<ViewMode>("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 2, 1));

  // Filters
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (clientFilter !== "all" && t.clientId !== clientFilter) return false;
      if (responsibleFilter !== "all") {
        if (responsibleFilter === "unassigned" && t.responsible) return false;
        if (responsibleFilter !== "unassigned" && t.responsible !== responsibleFilter) return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, clientFilter, responsibleFilter, statusFilter, priorityFilter]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setSelectedTask(updatedTask);
    refetch();
  };

  const handleGenerateTasks = (newTasks: Task[]) => {
    refetch();
  };

  const viewButtons: { key: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { key: "dashboard", icon: BarChart3, label: "Dashboard" },
    { key: "kanban", icon: LayoutGrid, label: "Kanban" },
    { key: "list", icon: List, label: "Lista" },
    { key: "calendar", icon: CalendarDays, label: "Calendário" },
  ];

  // Stats
  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "concluido").length;
  const pendingTasks = tasks.filter((t) => t.status === "pendente").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-white/50 mt-1">
            {tasks.length} tarefas · {pendingTasks} pendentes
            {overdueTasks > 0 && (
              <span className="text-red-400 ml-2">· {overdueTasks} atrasada{overdueTasks > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setGenerateOpen(true)}
            variant="outline"
            className="gap-2 rounded-full px-4 text-sm border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white"
          >
            <Sparkles className="h-4 w-4 text-primary" /> Gerar do Plano
          </Button>
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col gap-4">
        {/* View mode selector - vertical style */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {viewButtons.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
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

        {/* Filters - only show when not on dashboard */}
        {view !== "dashboard" && (
          <TaskFilters
            search={search} onSearchChange={setSearch}
            clientFilter={clientFilter} onClientFilterChange={setClientFilter}
            responsibleFilter={responsibleFilter} onResponsibleFilterChange={setResponsibleFilter}
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
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
          {view === "dashboard" && (
            <TaskDashboard tasks={tasks} />
          )}
          {view === "kanban" && (
            <TaskKanban
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
            />
          )}
          {view === "list" && (
            <TaskListView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          )}
          {view === "calendar" && (
            <TaskCalendar
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
            />
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
    </div>
  );
}
