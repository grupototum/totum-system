import { motion } from "framer-motion";
import { memo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Task, TaskStatus, statusConfig, statusColumns, priorityConfig, recurrenceLabels } from "./taskData";
import { Clock, RefreshCw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TaskKanbanProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

function TaskKanbanComponent({ tasks, onStatusChange, onTaskClick }: TaskKanbanProps) {
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
                      {(provided, snapshot) => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "concluido";
                        const priorityColor = priorityConfig[task.priority].color;
                        
                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskClick(task)}
                            className={`glass-card rounded-xl p-3 cursor-pointer hover:bg-white/[0.06] transition-all relative overflow-hidden group border-l-4 ${priorityColor.replace('text-', 'border-')} ${
                              snapshot.isDragging ? "opacity-70 shadow-2xl shadow-black/50 rotate-2 scale-105 z-50 border-white/20" : ""
                            } ${isOverdue ? "pulse-red" : ""}`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            {/* Inner priority trim */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${priorityColor.replace('text-', 'bg-')}`} />
                            
                            <div className="flex items-center gap-1.5 mb-2 pl-1">
                              <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                              <span className="text-[10px] text-white/30 flex-1 truncate font-medium uppercase tracking-tight">{task.clientName}</span>
                              {(task.isRecurring || task.parentTaskId) && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-primary/70" title={task.isRecurring ? `Recorrente: ${task.recurrenceType ? recurrenceLabels[task.recurrenceType] : ''}` : 'Ocorrência de tarefa recorrente'}>
                                  <RefreshCw className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm font-semibold mb-2 line-clamp-2 pl-1 text-white/90 group-hover:text-white transition-colors">{task.title}</p>
                            
                            <div className="flex items-center justify-between pl-1">
                              {task.responsible ? (
                                <span className="text-[10px] text-white/40 flex items-center gap-1.5">
                                  <Avatar className="h-4 w-4 border border-white/10">
                                    {task.responsibleAvatarUrl && <AvatarImage src={task.responsibleAvatarUrl} />}
                                    <AvatarFallback className="text-[6px] bg-white/[0.1] text-white/50">{task.responsible[0]}</AvatarFallback>
                                  </Avatar>
                                  {task.responsible.split(" ")[0]}
                                </span>
                              ) : (
                                <span className="text-[10px] text-white/20">Sem responsável</span>
                              )}
                              
                              {task.dueDate && (
                                <span className={`text-[10px] flex items-center gap-1 font-mono ${
                                  isOverdue ? "text-red-400 font-bold" : "text-white/30"
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                </span>
                              )}
                            </div>
                            
                            {task.checklist.length > 0 && (
                              <div className="mt-2 flex items-center gap-1.5 pl-1">
                                <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full bg-emerald-500/60"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                <span className="text-[10px] text-white/40 font-mono">
                                  {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
    </DragDropContext>
  );
}

export const TaskKanban = memo(TaskKanbanComponent);
