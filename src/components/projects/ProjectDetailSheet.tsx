import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { ProjectRow } from "@/hooks/useProjects";

interface Props {
  project: ProjectRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
};

export function ProjectDetailSheet({ project, open, onOpenChange }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project || !open) return;
    setLoading(true);
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, responsible_id, subtasks(*)")
      .eq("project_id", project.id)
      .order("created_at")
      .then(({ data, error }) => {
        if (!error) setTasks(data || []);
        setLoading(false);
      });
  }, [project?.id, open]);

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.status === "concluido").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{project.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Project info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Cliente</span>
              <p className="font-medium">{(project.clients as any)?.name || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Tipo</span>
              <p className="font-medium">{(project.project_types as any)?.name || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <p className="font-medium">{statusLabels[project.status] || project.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Prazo</span>
              <p className="font-medium">{project.due_date ? format(new Date(project.due_date), "dd/MM/yyyy") : "—"}</p>
            </div>
          </div>

          {project.description && (
            <div>
              <span className="text-muted-foreground text-xs">Descrição</span>
              <p className="text-sm mt-1">{project.description}</p>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso</span>
              <span className="text-muted-foreground">{completedTasks}/{tasks.length} tarefas ({progress}%)</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Tarefas</h4>
            </div>

            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa vinculada</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const subtasks = task.subtasks || [];
                  const completedSubs = subtasks.filter((s: any) => s.status === "concluido").length;
                  return (
                    <div key={task.id} className="border border-border rounded-lg p-3 bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        {task.status === "concluido" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={`flex-1 text-sm ${task.status === "concluido" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {statusLabels[task.status] || task.status}
                        </Badge>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 pl-6">
                          <Clock className="h-3 w-3" /> {format(new Date(task.due_date), "dd/MM/yyyy")}
                        </div>
                      )}
                      {subtasks.length > 0 && (
                        <div className="pl-6 mt-2 space-y-1">
                          {subtasks.map((sub: any) => (
                            <div key={sub.id} className="flex items-center gap-2 text-xs">
                              {sub.status === "concluido" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={sub.status === "concluido" ? "line-through text-muted-foreground" : ""}>
                                {sub.title}
                              </span>
                            </div>
                          ))}
                          <span className="text-[10px] text-muted-foreground">
                            {completedSubs}/{subtasks.length} subtarefas concluídas
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
