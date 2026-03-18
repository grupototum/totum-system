import { Task, statusConfig, priorityConfig, recurrenceLabels } from "./taskData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  showUnarchive?: boolean;
  onUnarchive?: (taskId: string) => void;
}

export function TaskListView({ tasks, onTaskClick, showUnarchive, onUnarchive }: TaskListViewProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Tarefa</th>
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Cliente</th>
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Responsável</th>
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Prioridade</th>
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Prazo</th>
              <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">{showUnarchive ? "Ação" : "Progresso"}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-white/30">Nenhuma tarefa encontrada</td></tr>
            ) : (
              tasks.map((task) => {
                const st = statusConfig[task.status];
                const pr = priorityConfig[task.priority];
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "concluido";
                const checkProgress = task.checklist.length > 0
                  ? Math.round((task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100)
                  : null;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${pr.dot}`} />
                        <span className="font-medium truncate max-w-[250px]">{task.title}</span>
                        {(task.isRecurring || task.parentTaskId) && (
                          <RefreshCw className="h-3 w-3 text-primary/60 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-white/60 text-xs">{task.clientName}</td>
                    <td className="p-3.5">
                      {task.responsible ? (
                        <span className="text-xs text-white/60 flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            {task.responsibleAvatarUrl && <AvatarImage src={task.responsibleAvatarUrl} />}
                            <AvatarFallback className="text-[7px] bg-white/[0.1]">{task.responsible[0]}</AvatarFallback>
                          </Avatar>
                          {task.responsible}
                        </span>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-xs font-medium ${pr.color}`}>{pr.label}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bgColor} ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {task.dueDate ? (
                        <span className={`text-xs font-mono ${isOverdue ? "text-red-400" : "text-white/50"}`}>
                          {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {checkProgress !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${checkProgress}%` }} />
                          </div>
                          <span className="text-[10px] text-white/40 font-mono">{checkProgress}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
