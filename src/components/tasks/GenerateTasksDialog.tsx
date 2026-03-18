import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Task, deliveryModels, clientPlans, priorityConfig } from "./taskData";
import { CheckCircle2, Wand2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GenerateTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (tasks: Task[]) => void;
}

export function GenerateTasksDialog({ open, onOpenChange, onGenerate }: GenerateTasksDialogProps) {
  const [selectedClient, setSelectedClient] = useState("");
  const [generated, setGenerated] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<Task[]>([]);

  const clientPlan = clientPlans.find((c) => c.clientId === selectedClient);
  const model = clientPlan ? deliveryModels.find((m) => m.planId === clientPlan.planId) : null;

  const handleGenerate = () => {
    if (!clientPlan || !model) return;

    const tasks: Task[] = model.items.map((item) => ({
      id: crypto.randomUUID(),
      title: item.name,
      description: item.description,
      clientId: clientPlan.clientId,
      clientName: clientPlan.clientName,
      planName: clientPlan.planName,
      responsible: item.suggestedResponsible,
      priority: item.suggestedPriority,
      status: "pendente" as const,
      type: item.type,
      subtasks: [],
      checklist: [],
      comments: [],
      history: [{
        id: crypto.randomUUID(),
        action: "Criada",
        detail: `Gerada automaticamente do plano ${clientPlan.planName}`,
        user: "Sistema",
        createdAt: new Date().toISOString(),
      }],
    }));

    setPreviewTasks(tasks);
    setGenerated(true);
  };

  const handleConfirm = () => {
    onGenerate(previewTasks);
    toast({
      title: "Tarefas geradas",
      description: `${previewTasks.length} tarefas criadas para ${clientPlan?.clientName}`,
    });
    setGenerated(false);
    setSelectedClient("");
    setPreviewTasks([]);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setGenerated(false);
      setSelectedClient("");
      setPreviewTasks([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1e1516] border-white/[0.1] text-white max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Tarefas do Período
          </DialogTitle>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Selecione o cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.1] rounded-xl h-10 text-sm focus:border-primary/50">
                  <SelectValue placeholder="Escolher cliente" />
                </SelectTrigger>
                <SelectContent className="bg-[#271c1d] border-white/[0.1] text-white">
                  {clientPlans.map((c) => (
                    <SelectItem key={c.clientId} value={c.clientId} className="focus:bg-white/[0.06] focus:text-white">
                      {c.clientName} — {c.planName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {model && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <p className="text-xs text-white/50 mb-3">
                  Modelo de entregas do plano <span className="text-white font-medium">{model.planName}</span> — {model.items.length} entregas
                </p>
                <div className="space-y-1.5">
                  {model.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[item.suggestedPriority].dot}`} />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-white/20 text-[10px]">{item.type}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <DialogFooter>
              <Button
                onClick={handleGenerate}
                disabled={!model}
                className="gradient-primary border-0 text-white font-semibold rounded-full px-6 gap-2 disabled:opacity-30"
              >
                <Wand2 className="h-4 w-4" /> Gerar Tarefas
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">{previewTasks.length} tarefas prontas para criar</span>
              </div>
              <p className="text-xs text-white/50">
                As tarefas serão criadas como "Pendente", sem datas definidas. O gestor pode ajustar responsáveis, datas e títulos após a criação.
              </p>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin">
              {previewTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] text-xs">
                  <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                  <span className="flex-1 font-medium">{task.title}</span>
                  {task.responsible && (
                    <span className="text-white/30">{task.responsible.split(" ")[0]}</span>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setGenerated(false)}
                className="text-white/60 hover:text-white hover:bg-white/[0.06]"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                className="gradient-primary border-0 text-white font-semibold rounded-full px-6"
              >
                Confirmar e Criar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
