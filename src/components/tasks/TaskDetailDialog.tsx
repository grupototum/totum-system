import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Task, Subtask, ChecklistItem, TaskComment, TaskStatus, TaskPriority,
  statusConfig, priorityConfig, typeLabels, teamMembers, TaskType,
  RecurrenceType, recurrenceLabels, weekDayLabels, RecurrenceConfig,
} from "./taskData";
import {
  CheckCircle2, Circle, Plus, Trash2, User, Calendar, Clock,
  MessageSquare, History, ChevronDown, Send, RefreshCw,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: Task) => void;
}

export function TaskDetailDialog({ task, open, onOpenChange, onUpdate }: TaskDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "recurrence" | "comments" | "history">("detail");
  const [newComment, setNewComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  if (!task) return null;

  const update = (partial: Partial<Task>) => onUpdate({ ...task, ...partial });

  const checkProgress = task.checklist.length > 0
    ? Math.round((task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100)
    : 0;

  const toggleCheckItem = (id: string) => {
    update({
      checklist: task.checklist.map((c) => c.id === id ? { ...c, completed: !c.completed } : c),
    });
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    update({
      checklist: [...task.checklist, { id: crypto.randomUUID(), text: newCheckItem, completed: false }],
    });
    setNewCheckItem("");
  };

  const removeCheckItem = (id: string) => {
    update({ checklist: task.checklist.filter((c) => c.id !== id) });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    update({
      subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: newSubtask, status: "pendente" as TaskStatus }],
    });
    setNewSubtask("");
  };

  const updateSubtaskStatus = (id: string, status: TaskStatus) => {
    update({
      subtasks: task.subtasks.map((s) => s.id === id ? { ...s, status } : s),
    });
  };

  const removeSubtask = (id: string) => {
    update({ subtasks: task.subtasks.filter((s) => s.id !== id) });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    update({
      comments: [...task.comments, {
        id: crypto.randomUUID(),
        author: "Você",
        text: newComment,
        createdAt: new Date().toISOString(),
      }],
    });
    setNewComment("");
  };

  const toggleWeekDay = (day: number) => {
    const config = task.recurrenceConfig || {};
    const currentDays = config.week_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    update({ recurrenceConfig: { ...config, week_days: newDays } });
  };

  const selectClasses = "bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs focus:border-primary/50";
  const selectContentClasses = "bg-[#271c1d] border-white/[0.1] text-white";
  const selectItemClasses = "text-xs focus:bg-white/[0.06] focus:text-white";

  const tabs = [
    { key: "detail", label: "Detalhes", icon: ChevronDown },
    { key: "recurrence", label: "Recorrência", icon: RefreshCw },
    { key: "comments", label: `Comentários (${task.comments.length})`, icon: MessageSquare },
    { key: "history", label: `Histórico (${task.history.length})`, icon: History },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1516] border-white/[0.1] text-white max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg pr-8 flex items-center gap-2">
            {task.title}
            {task.isRecurring && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                <RefreshCw className="h-3 w-3" />
                {task.recurrenceType ? recurrenceLabels[task.recurrenceType] : "Recorrente"}
              </span>
            )}
            {task.parentTaskId && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-white/50">
                Ocorrência
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/40">{task.clientName}</span>
            {task.planName && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-xs text-white/30">{task.planName}</span>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-2 border-b border-white/[0.06] pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Detail Tab */}
        {activeTab === "detail" && (
          <div className="space-y-5 mt-3">
            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Status</label>
                <Select value={task.status} onValueChange={(v) => update({ status: v as TaskStatus })}>
                  <SelectTrigger className={selectClasses}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentClasses}>
                    {(Object.keys(statusConfig) as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className={selectItemClasses}>{statusConfig[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Prioridade</label>
                <Select value={task.priority} onValueChange={(v) => update({ priority: v as TaskPriority })}>
                  <SelectTrigger className={selectClasses}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentClasses}>
                    {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p} className={selectItemClasses}>{priorityConfig[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Responsible & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Responsável</label>
                <Select value={task.responsible || "none"} onValueChange={(v) => update({ responsible: v === "none" ? undefined : v })}>
                  <SelectTrigger className={selectClasses}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent className={selectContentClasses}>
                    <SelectItem value="none" className={selectItemClasses}>Sem responsável</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m} value={m} className={selectItemClasses}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Tipo</label>
                <Select value={task.type} onValueChange={(v) => update({ type: v as TaskType })}>
                  <SelectTrigger className={selectClasses}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentClasses}>
                    {(Object.keys(typeLabels) as TaskType[]).map((t) => (
                      <SelectItem key={t} value={t} className={selectItemClasses}>{typeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Data de Início</label>
                <Input
                  type="date"
                  value={task.startDate || ""}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className="bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Data de Entrega</label>
                <Input
                  type="date"
                  value={task.dueDate || ""}
                  onChange={(e) => update({ dueDate: e.target.value })}
                  className="bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs focus:border-primary/50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Descrição</label>
              <Textarea
                value={task.description}
                onChange={(e) => update({ description: e.target.value })}
                className="bg-white/[0.05] border-white/[0.1] rounded-lg text-xs min-h-[60px] resize-none focus:border-primary/50"
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">Checklist</label>
                {task.checklist.length > 0 && (
                  <span className="text-[10px] text-white/30 font-mono">{checkProgress}%</span>
                )}
              </div>
              {task.checklist.length > 0 && (
                <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: `${checkProgress}%` }} />
                </div>
              )}
              <div className="space-y-1">
                {task.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-white/[0.03]">
                    <button onClick={() => toggleCheckItem(item.id)}>
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-white/20" />
                      )}
                    </button>
                    <span className={`text-xs flex-1 ${item.completed ? "line-through text-white/30" : ""}`}>{item.text}</span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Novo item..."
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                  className="bg-white/[0.03] border-white/[0.06] rounded-md h-7 text-xs placeholder:text-white/20 focus:border-primary/50"
                />
                <Button onClick={addCheckItem} size="sm" variant="ghost" className="h-7 px-2 text-white/30 hover:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-2 block">Subtarefas</label>
              <div className="space-y-1">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/[0.03] group">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      sub.status === "concluido" ? "bg-emerald-500" :
                      sub.status === "em_andamento" ? "bg-blue-500" :
                      sub.status === "pausado" ? "bg-amber-500" : "bg-white/20"
                    }`} />
                    <span className={`text-xs flex-1 ${sub.status === "concluido" ? "line-through text-white/30" : ""}`}>
                      {sub.title}
                    </span>
                    <Select
                      value={sub.status}
                      onValueChange={(v) => updateSubtaskStatus(sub.id, v as TaskStatus)}
                    >
                      <SelectTrigger className="bg-transparent border-0 h-6 text-[10px] w-auto px-1.5 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentClasses}>
                        {(Object.keys(statusConfig) as TaskStatus[]).map((s) => (
                          <SelectItem key={s} value={s} className={selectItemClasses}>{statusConfig[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => removeSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Nova subtarefa..."
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                  className="bg-white/[0.03] border-white/[0.06] rounded-md h-7 text-xs placeholder:text-white/20 focus:border-primary/50"
                />
                <Button onClick={addSubtask} size="sm" variant="ghost" className="h-7 px-2 text-white/30 hover:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recurrence Tab */}
        {activeTab === "recurrence" && (
          <div className="space-y-5 mt-3">
            {task.parentTaskId ? (
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/50">
                  Esta é uma <strong>ocorrência</strong> de uma tarefa recorrente. 
                  As configurações de recorrência ficam na tarefa modelo.
                </p>
              </div>
            ) : (
              <>
                {/* Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Tarefa periódica</span>
                  </div>
                  <Switch
                    checked={task.isRecurring || false}
                    onCheckedChange={(v) => update({ isRecurring: v })}
                  />
                </div>

                {task.isRecurring && (
                  <>
                    {/* Recurrence Type */}
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Tipo de recorrência</label>
                      <Select
                        value={task.recurrenceType || "semanal"}
                        onValueChange={(v) => update({ recurrenceType: v as RecurrenceType })}
                      >
                        <SelectTrigger className={selectClasses}><SelectValue /></SelectTrigger>
                        <SelectContent className={selectContentClasses}>
                          {(Object.keys(recurrenceLabels) as RecurrenceType[]).map((r) => (
                            <SelectItem key={r} value={r} className={selectItemClasses}>{recurrenceLabels[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Weekly: select days */}
                    {(task.recurrenceType === "semanal") && (
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-2 block">Dias da semana</label>
                        <div className="flex gap-1.5">
                          {weekDayLabels.map((label, i) => {
                            const active = (task.recurrenceConfig?.week_days || []).includes(i);
                            return (
                              <button
                                key={i}
                                onClick={() => toggleWeekDay(i)}
                                className={`h-8 w-10 rounded-lg text-[10px] font-medium transition-all ${
                                  active
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Monthly: select day */}
                    {task.recurrenceType === "mensal" && (
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Dia do mês</label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={task.recurrenceConfig?.month_day || 1}
                          onChange={(e) => update({
                            recurrenceConfig: { ...task.recurrenceConfig, month_day: parseInt(e.target.value) || 1 },
                          })}
                          className="bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs w-20 focus:border-primary/50"
                        />
                      </div>
                    )}

                    {/* Custom: every X days */}
                    {task.recurrenceType === "personalizada" && (
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">A cada X dias</label>
                        <Input
                          type="number"
                          min={1}
                          value={task.recurrenceConfig?.interval_days || 7}
                          onChange={(e) => update({
                            recurrenceConfig: { ...task.recurrenceConfig, interval_days: parseInt(e.target.value) || 7 },
                          })}
                          className="bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs w-20 focus:border-primary/50"
                        />
                      </div>
                    )}

                    {/* End date */}
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Encerrar em (opcional)</label>
                      <Input
                        type="date"
                        value={task.recurrenceEndDate || ""}
                        onChange={(e) => update({ recurrenceEndDate: e.target.value || undefined })}
                        className="bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs w-48 focus:border-primary/50"
                      />
                    </div>

                    {/* Info */}
                    {task.lastGeneratedAt && (
                      <p className="text-[10px] text-white/30">
                        Última geração: {new Date(task.lastGeneratedAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="mt-3 space-y-3">
            {task.comments.length === 0 && (
              <p className="text-xs text-white/30 text-center py-8">Nenhum comentário ainda</p>
            )}
            {task.comments.map((comment) => (
              <div key={comment.id} className="p-3 rounded-lg bg-white/[0.03]">
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar className="h-5 w-5">
                    {comment.authorAvatarUrl && <AvatarImage src={comment.authorAvatarUrl} />}
                    <AvatarFallback className="text-[7px] gradient-primary">{comment.author[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{comment.author}</span>
                  <span className="text-[10px] text-white/20">
                    {new Date(comment.createdAt).toLocaleDateString("pt-BR")} {new Date(comment.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-white/70 pl-7">{comment.text}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escrever comentário..."
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                className="bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs placeholder:text-white/25 focus:border-primary/50"
              />
              <Button onClick={addComment} size="sm" className="gradient-primary border-0 text-white h-9 px-3 rounded-lg">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="mt-3 space-y-2">
            {task.history.length === 0 && (
              <p className="text-xs text-white/30 text-center py-8">Nenhum registro no histórico</p>
            )}
            {task.history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-2 px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs">
                    <span className="font-medium">{entry.action}:</span>{" "}
                    <span className="text-white/60">{entry.detail}</span>
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {entry.user} · {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
