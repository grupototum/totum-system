import { useMemo } from "react";
import { Task, priorityConfig } from "./taskData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
}

export function TaskCalendar({ tasks, onTaskClick, currentMonth, onMonthChange }: TaskCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (d.getMonth() === month && d.getFullYear() === year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(t);
        }
      }
    });
    return map;
  }, [tasks, month, year]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-heading font-semibold text-sm">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-7">
          {weekDays.map((d) => (
            <div key={d} className="p-2 text-center text-[10px] font-medium text-white/30 uppercase tracking-wider border-b border-white/[0.06]">
              {d}
            </div>
          ))}
          {days.map((day, i) => (
            <div
              key={i}
              className={`min-h-[90px] p-1.5 border-b border-r border-white/[0.04] ${
                day === null ? "bg-white/[0.01]" : "hover:bg-white/[0.02]"
              }`}
            >
              {day !== null && (
                <>
                  <div className={`text-xs font-heading mb-1 px-1 ${
                    isToday(day)
                      ? "text-primary font-bold"
                      : "text-white/40"
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {(tasksByDay[day] || []).slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={`w-full text-left px-1.5 py-1 rounded text-[10px] truncate transition-colors hover:bg-white/[0.08] flex items-center gap-1 ${
                          priorityConfig[task.priority].color
                        }`}
                        title={`${task.title}${task.responsible ? ` — ${task.responsible}` : ""}`}
                      >
                        {task.responsible ? (
                          <Avatar className="h-3.5 w-3.5 shrink-0">
                            {task.responsibleAvatarUrl && <AvatarImage src={task.responsibleAvatarUrl} />}
                            <AvatarFallback className="text-[5px] bg-white/[0.1]">{task.responsible[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className={`inline-block h-1 w-1 rounded-full shrink-0 ${priorityConfig[task.priority].dot}`} />
                        )}
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                    {(tasksByDay[day] || []).length > 3 && (
                      <span className="text-[9px] text-white/20 px-1.5">+{(tasksByDay[day] || []).length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
