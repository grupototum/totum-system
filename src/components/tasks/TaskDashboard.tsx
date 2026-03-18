import { useMemo } from "react";
import { Task } from "./taskData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Users } from "lucide-react";

interface TaskDashboardProps {
  tasks: Task[];
}

export function TaskDashboard({ tasks }: TaskDashboardProps) {
  const now = new Date();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "concluido").length;
    const pending = tasks.filter((t) => t.status === "pendente").length;
    const inProgress = tasks.filter((t) => t.status === "em_andamento").length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "concluido"
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, inProgress, overdue, completionRate };
  }, [tasks]);

  // Tasks by responsible
  const byResponsible = useMemo(() => {
    const map: Record<string, { name: string; avatar?: string; total: number; completed: number; overdue: number }> = {};
    tasks.forEach((t) => {
      const key = t.responsible || "Sem responsável";
      if (!map[key]) {
        map[key] = { name: key, avatar: t.responsibleAvatarUrl, total: 0, completed: 0, overdue: 0 };
      }
      map[key].total++;
      if (t.status === "concluido") map[key].completed++;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== "concluido") map[key].overdue++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tasks]);

  // Tasks by day (next 7 days + past 7 days)
  const byDay = useMemo(() => {
    const days: { label: string; date: string; total: number; completed: number; overdue: number }[] = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
      days.push({
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        date: dateStr,
        total: dayTasks.length,
        completed: dayTasks.filter((t) => t.status === "concluido").length,
        overdue: dayTasks.filter((t) => new Date(t.dueDate!) < now && t.status !== "concluido").length,
      });
    }
    return days;
  }, [tasks]);

  const maxDayTasks = Math.max(...byDay.map((d) => d.total), 1);

  const metricCards = [
    { label: "Total", value: stats.total, icon: ListTodo, color: "text-white/70", bg: "bg-white/[0.06]" },
    { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Em andamento", value: stats.inProgress, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Concluídas", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Atrasadas", value: stats.overdue, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Taxa de conclusão", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((m) => (
          <div key={m.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${m.bg}`}>
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              </div>
            </div>
            <p className="text-xl font-heading font-bold">{m.value}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timeline Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Tarefas por Dia
          </h3>
          <div className="flex items-end gap-1 h-32">
            {byDay.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  {day.total > 0 && (
                    <div
                      className="w-full max-w-[20px] rounded-t bg-primary/40 transition-all group-hover:bg-primary/60 relative"
                      style={{ height: `${(day.total / maxDayTasks) * 100}%`, minHeight: day.total > 0 ? "4px" : "0" }}
                    >
                      {day.overdue > 0 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t bg-red-500/50"
                          style={{ height: `${(day.overdue / day.total) * 100}%` }}
                        />
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[8px] text-white/30 font-mono">{day.label}</span>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#271c1d] border border-white/[0.1] rounded px-2 py-1 text-[9px] text-white/70 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                  {day.total} tarefa{day.total !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[9px] text-white/30">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-primary/40" /> Total</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/50" /> Atrasadas</span>
          </div>
        </div>

        {/* By Responsible */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" /> Por Responsável
          </h3>
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto scrollbar-thin">
            {byResponsible.map((r) => {
              const rate = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
              return (
                <div key={r.name} className="flex items-center gap-3 group">
                  <Avatar className="h-6 w-6 shrink-0">
                    {r.avatar && <AvatarImage src={r.avatar} />}
                    <AvatarFallback className="text-[8px] bg-white/[0.1]">{r.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{r.name}</span>
                      <span className="text-[10px] text-white/40 font-mono shrink-0 ml-2">{r.completed}/{r.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500/50 transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                  {r.overdue > 0 && (
                    <span className="text-[9px] text-red-400 font-mono shrink-0">{r.overdue} atr.</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
