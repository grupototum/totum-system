import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Task, TaskPriority, priorityConfig } from "./taskData";
import {
  CheckCircle2, ArrowRight, Shield, Loader2,
} from "lucide-react";

type Decision = null | "closed" | "next_action";

interface NextActionForm {
  title: string;
  description: string;
  responsible_id: string;
  due_date: string;
  priority: TaskPriority;
}

interface TaskCompletionDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: { user_id: string; full_name: string }[];
  onComplete: (data: {
    taskId: string;
    decision: "closed" | "next_action";
    comment?: string;
    nextAction?: NextActionForm;
  }) => Promise<void>;
}

export function TaskCompletionDialog({
  task, open, onOpenChange, profiles, onComplete,
}: TaskCompletionDialogProps) {
  const [decision, setDecision] = useState<Decision>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [nextAction, setNextAction] = useState<NextActionForm>({
    title: "", description: "", responsible_id: "", due_date: "", priority: "media",
  });

  const reset = () => {
    setDecision(null);
    setComment("");
    setSaving(false);
    setNextAction({ title: "", description: "", responsible_id: "", due_date: "", priority: "media" });
  };

  // Prevent closing without decision
  const handleOpenChange = (v: boolean) => {
    if (!v && !saving) {
      // Only allow close if not in the middle of saving
      // Reset state but keep dialog closed
      reset();
      onOpenChange(false);
    }
  };

  const handleConfirmClosed = async () => {
    if (!task) return;
    setSaving(true);
    await onComplete({
      taskId: task.id,
      decision: "closed",
      comment: comment.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  };

  const handleConfirmNextAction = async () => {
    if (!task || !nextAction.title.trim()) return;
    setSaving(true);
    await onComplete({
      taskId: task.id,
      decision: "next_action",
      nextAction,
    });
    reset();
    onOpenChange(false);
  };

  const handleBack = () => {
    setDecision(null);
  };

  if (!task) return null;

  const inputCls = "bg-white/[0.05] border-border rounded-lg h-9 text-sm focus:border-primary/50";
  const selectContentCls = "bg-popover border-border text-foreground";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-card border-border text-foreground max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (decision === null) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Etapa obrigatória</span>
          </div>
          <DialogTitle className="font-heading text-lg">Concluir Tarefa</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            <span className="font-medium text-foreground/70">{task.title}</span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Decision */}
          {decision === null && (
            <motion.div
              key="decision"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 mt-2"
            >
              <p className="text-sm text-foreground/70 font-medium">
                Existe uma próxima ação para essa tarefa?
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setDecision("next_action")}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-primary/[0.06] hover:border-primary/30 transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Sim, existe próxima ação</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Criar uma subtarefa vinculada antes de concluir</p>
                  </div>
                </button>

                <button
                  onClick={() => setDecision("closed")}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/30 transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Não, está concluída e encerrada</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">A tarefa será finalizada sem ações adicionais</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2a: Closed */}
          {decision === "closed" && (
            <motion.div
              key="closed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 mt-2"
            >
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Descreva brevemente como a tarefa foi resolvida
                  <span className="text-muted-foreground/50 ml-1">(opcional)</span>
                </Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex: Cliente aprovou o material final..."
                  className="bg-white/[0.05] border-border rounded-lg text-sm min-h-[80px] resize-none focus:border-primary/50 placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.06] text-sm">
                  ← Voltar
                </Button>
                <Button
                  onClick={handleConfirmClosed}
                  disabled={saving}
                  className="gradient-primary border-0 text-white font-semibold rounded-full px-6"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Concluir Tarefa
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2b: Next action */}
          {decision === "next_action" && (
            <motion.div
              key="next_action"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 mt-2"
            >
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold">Nova subtarefa vinculada</p>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Título *</Label>
                <Input
                  value={nextAction.title}
                  onChange={(e) => setNextAction({ ...nextAction, title: e.target.value })}
                  placeholder="Ex: Enviar versão final ao cliente"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Descrição</Label>
                <Textarea
                  value={nextAction.description}
                  onChange={(e) => setNextAction({ ...nextAction, description: e.target.value })}
                  placeholder="Opcional"
                  className="bg-white/[0.05] border-border rounded-lg text-sm min-h-[60px] resize-none focus:border-primary/50 placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Responsável</Label>
                  <Select
                    value={nextAction.responsible_id || "none"}
                    onValueChange={(v) => setNextAction({ ...nextAction, responsible_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      <SelectItem value="none" className="text-xs">Sem responsável</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id} className="text-xs">{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Prioridade</Label>
                  <Select
                    value={nextAction.priority}
                    onValueChange={(v) => setNextAction({ ...nextAction, priority: v as TaskPriority })}
                  >
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">{priorityConfig[p].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Data de entrega</Label>
                <Input
                  type="date"
                  value={nextAction.due_date}
                  onChange={(e) => setNextAction({ ...nextAction, due_date: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.06] text-sm">
                  ← Voltar
                </Button>
                <Button
                  onClick={handleConfirmNextAction}
                  disabled={saving || !nextAction.title.trim()}
                  className="gradient-primary border-0 text-white font-semibold rounded-full px-6"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Criar e Concluir
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
