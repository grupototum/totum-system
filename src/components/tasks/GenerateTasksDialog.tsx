import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Task, priorityConfig } from "./taskData";
import { CheckCircle2, Wand2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientWithPlan {
  clientId: string;
  clientName: string;
  planId: string;
  planName: string;
  contractId: string;
}

interface ModelItem {
  id: string;
  name: string;
  task_type: string;
  suggested_priority: string;
  suggested_responsible_id: string | null;
  sort_order: number | null;
}

interface GenerateTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (tasks: Task[]) => void;
}

export function GenerateTasksDialog({ open, onOpenChange, onGenerate }: GenerateTasksDialogProps) {
  const [selectedClient, setSelectedClient] = useState("");
  const [generated, setGenerated] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<Task[]>([]);

  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<ClientWithPlan[]>([]);
  const [modelItems, setModelItems] = useState<ModelItem[]>([]);

  // Load active contracts with plans on dialog open
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    supabase
      .from("contracts")
      .select("id, client_id, plan_id, clients(name), plans(name)")
      .eq("status", "ativo")
      .not("plan_id", "is", null)
      .then(({ data }) => {
        const list: ClientWithPlan[] = (data || [])
          .filter((c: any) => c.clients && c.plans)
          .map((c: any) => ({
            clientId: c.client_id,
            clientName: c.clients.name,
            planId: c.plan_id,
            planName: c.plans.name,
            contractId: c.id,
          }));
        setClients(list);
        setLoadingClients(false);
      });
  }, [open]);

  // Load model items when a client is selected
  useEffect(() => {
    if (!selectedClient) { setModelItems([]); return; }
    const client = clients.find(c => c.clientId === selectedClient);
    if (!client) return;

    supabase
      .from("delivery_model_items")
      .select("*")
      .eq("plan_id", client.planId)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setModelItems((data as ModelItem[]) || []));
  }, [selectedClient, clients]);

  const clientPlan = clients.find(c => c.clientId === selectedClient);

  const handleGenerate = () => {
    if (!clientPlan || !modelItems.length) return;

    const tasks: Task[] = modelItems.map((item) => ({
      id: crypto.randomUUID(),
      title: item.name,
      description: "",
      clientId: clientPlan.clientId,
      clientName: clientPlan.clientName,
      packageName: clientPlan.planName,
      responsible: undefined,
      responsibleId: item.suggested_responsible_id ?? undefined,
      priority: (item.suggested_priority as Task["priority"]) || "media",
      status: "pendente" as const,
      type: (item.task_type as Task["type"]) || "outro",
      subtasks: [],
      checklist: [],
      comments: [],
      history: [{
        id: crypto.randomUUID(),
        action: "Criada",
        detail: `Gerada automaticamente do pacote ${clientPlan.planName}`,
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
      setModelItems([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[80vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Tarefas do Período
          </DialogTitle>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground/70 mb-1.5 block">Selecione o cliente</label>
              {loadingClients ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando contratos ativos...
                </div>
              ) : clients.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-2">
                  Nenhum contrato ativo com pacote encontrado. Ative um contrato com pacote associado primeiro.
                </p>
              ) : (
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-white/[0.05] border-border rounded-xl h-10 text-sm focus:border-primary/50">
                    <SelectValue placeholder="Escolher cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {clients.map((c) => (
                      <SelectItem key={c.clientId} value={c.clientId} className="focus:bg-white/[0.06] focus:text-foreground">
                        {c.clientName} — {c.planName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {clientPlan && modelItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/[0.03] border border-border"
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Modelo de entregas do pacote{" "}
                  <span className="text-white font-medium">{clientPlan.planName}</span> — {modelItems.length} entregas
                </p>
                <div className="space-y-1.5">
                  {modelItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[item.suggested_priority as keyof typeof priorityConfig]?.dot || "bg-muted-foreground"}`} />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-muted-foreground/40 text-[10px]">{item.task_type}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {clientPlan && modelItems.length === 0 && (
              <p className="text-xs text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3">
                Este pacote ainda não tem itens de entrega cadastrados. Vá em{" "}
                <strong>Pacotes → Gerenciar Entregas</strong> para adicionar os itens.
              </p>
            )}

            <DialogFooter>
              <Button
                onClick={handleGenerate}
                disabled={!clientPlan || modelItems.length === 0}
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
              <p className="text-xs text-muted-foreground">
                As tarefas serão criadas como "Pendente", sem datas definidas. O gestor pode ajustar responsáveis, datas e títulos após a criação.
              </p>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin">
              {previewTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] text-xs">
                  <div className={`h-1.5 w-1.5 rounded-full ${priorityConfig[task.priority]?.dot || "bg-muted-foreground"}`} />
                  <span className="flex-1 font-medium">{task.title}</span>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setGenerated(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
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
