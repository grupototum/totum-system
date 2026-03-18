import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Task, TaskStatus, statusConfig, statusColumns, priorityConfig } from "./taskData";
import { Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TaskKanbanProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskKanban({ tasks, onStatusChange, onTaskClick }: TaskKanbanProps) {
  const columns = statusColumns.map((status) => ({
    status,
    ...statusConfig[status],
    tasks: tasks.filter((t) => t.status === status),
  }));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    onStatusChange(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4 h-full min-h-[500px]">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`h-2 w-2 rounded-full ${col.status === "pendente" ? "bg-white/30" : col.status === "em_andamento" ? "bg-blue-500" : col.status === "pausado" ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>{col.label}</span>
              <span className="text-[10px] text-white/20 font-mono">{col.tasks.length}</span>
            </div>

            <Droppable droppableId={col.status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 rounded-xl p-2 space-y-2 transition-colors ${
                    snapshot.isDraggingOver ? "bg-white/[0.04]" : "bg-white/[0.01]"
                  }`}
                >
                  {col.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                          className={`glass-card rounded-lg p-3 cursor-pointer hover:bg-white/[0.06] transition-all ${
                            snapshot.isDragging ? "shadow-lg shadow-black/30 rotate-1" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                            <span className="text-[10px] text-white/30">{task.clientName}</span>
                          </div>
                          <p className="text-sm font-medium mb-2 line-clamp-2">{task.title}</p>
                          <div className="flex items-center justify-between">
                            {task.responsible ? (
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                <User className="h-3 w-3" /> {task.responsible.split(" ")[0]}
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/20">Sem responsável</span>
                            )}
                            {task.dueDate && (
                              <span className={`text-[10px] flex items-center gap-1 ${
                                new Date(task.dueDate) < new Date() && task.status !== "concluido"
                                  ? "text-red-400" : "text-white/30"
                              }`}>
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                              </span>
                            )}
                          </div>
                          {task.checklist.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500/60"
                                  style={{ width: `${(task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-white/30 font-mono">
                                {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
