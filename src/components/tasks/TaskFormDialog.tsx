import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: { id: string; name: string }[];
  profiles: { user_id: string; full_name: string }[];
  onCreated: () => void;
}

const PRIORITIES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const TASK_TYPES = [
  { value: "conteudo", label: "Conteúdo" },
  { value: "trafego", label: "Tráfego" },
  { value: "reuniao", label: "Reunião" },
  { value: "relatorio", label: "Relatório" },
  { value: "design", label: "Design" },
  { value: "desenvolvimento", label: "Desenvolvimento" },
  { value: "outro", label: "Outro" },
];

export function TaskFormDialog({
  open,
  onOpenChange,
  clients,
  profiles,
  onCreated,
}: TaskFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [priority, setPriority] = useState("media");
  const [taskType, setTaskType] = useState("outro");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setClientId("");
    setResponsibleId("");
    setPriority("media");
    setTaskType("outro");
    setStartDate("");
    setDueDate("");
  };

  const handleSave = async () => {
    if (!title.trim() || !clientId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      client_id: clientId,
      responsible_id: responsibleId || null,
      priority: priority as any,
      task_type: taskType as any,
      status: "pendente" as any,
      start_date: startDate || null,
      due_date: dueDate || null,
    });

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Tarefa criada com sucesso" });
    resetForm();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#1e1516] border-white/[0.1] text-white">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription className="text-white/50">
            Preencha os campos para criar uma nova tarefa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Criar post para Instagram"
              className="bg-white/[0.04] border-white/[0.1]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={3}
              className="bg-white/[0.04] border-white/[0.1] resize-none"
            />
          </div>

          {/* Client + Responsible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.1]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.1]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.1]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.1]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/[0.04] border-white/[0.1]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data Entrega</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white/[0.04] border-white/[0.1]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white"
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Criar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
