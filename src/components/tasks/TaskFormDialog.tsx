import { useState, useEffect, useCallback } from "react";
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
import { Loader2, Plus, X, FileText, BookOpen, Shield } from "lucide-react";

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
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [subtaskItems, setSubtaskItems] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [pops, setPops] = useState<any[]>([]);
  const [selectedPopId, setSelectedPopId] = useState("");
  const [slaRules, setSlaRules] = useState<any[]>([]);
  const [selectedSlaId, setSelectedSlaId] = useState("");

  // Fetch templates
  useEffect(() => {
    if (!open) return;
    supabase
      .from("task_templates")
      .select("*, task_template_items(*)")
      .order("name")
      .then(({ data }) => setTemplates(data || []));
    // Fetch POPs
    (supabase as any)
      .from("pops")
      .select("*, pop_steps(*), pop_checklist_items(*)")
      .order("title")
      .then(({ data }: any) => setPops(data || []));
    // Fetch SLA rules
    (supabase as any)
      .from("sla_rules")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }: any) => setSlaRules(data || []));
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setClientId("");
    setResponsibleId("");
    setPriority("media");
    setTaskType("outro");
    setStartDate("");
    setDueDate("");
    setChecklistItems([]);
    setNewCheckItem("");
    setSubtaskItems([]);
    setShowTemplates(false);
    setSelectedPopId("");
    setSelectedSlaId("");
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklistItems(prev => [...prev, newCheckItem.trim()]);
    setNewCheckItem("");
  };

  const removeCheckItem = (idx: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== idx));
  };

  const applyTemplate = (template: any) => {
    const items = (template.task_template_items || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((i: any) => i.title);
    setChecklistItems(items);
    setSubtaskItems(items);
    if (!title && template.name) setTitle(template.name);
    if (!description && template.description) setDescription(template.description);
    setShowTemplates(false);
    toast({ title: "Template aplicado", description: `${items.length} itens adicionados como checklist e subtarefas` });
  };

  const applyPop = (popId: string) => {
    const pop = pops.find((p: any) => p.id === popId);
    if (!pop) return;
    setSelectedPopId(popId);
    // Load checklist from POP
    const checkItems = (pop.pop_checklist_items || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((c: any) => c.text);
    // Load steps as subtasks
    const stepItems = (pop.pop_steps || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((s: any) => s.title);
    setChecklistItems(checkItems);
    setSubtaskItems(stepItems);
    if (!title && pop.title) setTitle(pop.title);
    if (!description && pop.description) setDescription(pop.description);
    if (pop.linked_task_type && pop.linked_task_type !== "none") setTaskType(pop.linked_task_type);
    toast({ title: "POP aplicado", description: `${checkItems.length} itens de checklist e ${stepItems.length} etapas carregados.` });
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

    // Calculate SLA deadlines
    let slaResponseDeadline: string | null = null;
    let slaResolutionDeadline: string | null = null;
    if (selectedSlaId) {
      const sla = slaRules.find((s: any) => s.id === selectedSlaId);
      if (sla) {
        const now = new Date();
        slaResponseDeadline = new Date(now.getTime() + sla.max_response_minutes * 60000).toISOString();
        slaResolutionDeadline = new Date(now.getTime() + sla.max_resolution_minutes * 60000).toISOString();
        // Auto-set due date from SLA if not manually set
        if (!dueDate) {
          const resolutionDate = new Date(now.getTime() + sla.max_resolution_minutes * 60000);
          setDueDate(resolutionDate.toISOString().split("T")[0]);
        }
      }
    }

    const insertPayload: any = {
      title: title.trim(),
      description: description.trim() || null,
      client_id: clientId,
      responsible_id: responsibleId || null,
      priority: priority,
      task_type: taskType,
      status: "pendente",
      start_date: startDate || null,
      due_date: dueDate || null,
      pop_id: selectedPopId || null,
      sla_id: selectedSlaId || null,
      sla_response_deadline: slaResponseDeadline,
      sla_resolution_deadline: slaResolutionDeadline,
    };

    const { data: taskData, error } = await (supabase as any).from("tasks").insert(insertPayload).select("id").single();

    if (error) {
      setSaving(false);
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
      return;
    }

    // Insert checklist items
    if (checklistItems.length > 0 && taskData) {
      const items = checklistItems.map((text, i) => ({
        task_id: taskData.id,
        text,
        sort_order: i,
        completed: false,
      }));
      await supabase.from("task_checklist_items").insert(items);
    }

    // Insert real subtasks
    if (subtaskItems.length > 0 && taskData) {
      const subs = subtaskItems.map((title, i) => ({
        task_id: taskData.id,
        title,
        sort_order: i,
        status: "pendente" as any,
      }));
      const { error: subErr } = await supabase.from("subtasks").insert(subs);
      if (subErr) console.error("Erro ao criar subtarefas:", subErr);
    }

    setSaving(false);
    toast({ title: "Tarefa criada com sucesso" });
    resetForm();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preencha os campos para criar uma nova tarefa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Criar post para Instagram" className="bg-white/[0.04] border-border" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da tarefa..." rows={3} className="bg-white/[0.04] border-border resize-none" />
          </div>

          {/* Client + Responsible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/[0.04] border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Data Entrega</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-white/[0.04] border-border" />
            </div>
          </div>

          {/* POP + SLA Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> POP</Label>
              <Select value={selectedPopId || "none"} onValueChange={(v) => {
                if (v === "none") {
                  setSelectedPopId("");
                } else {
                  applyPop(v);
                }
              }}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {pops.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> SLA</Label>
              <Select value={selectedSlaId || "none"} onValueChange={(v) => setSelectedSlaId(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {slaRules.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({Math.floor(s.max_resolution_minutes / 60)}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Checklist</Label>
              {templates.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setShowTemplates(!showTemplates)}>
                  <FileText className="h-3 w-3" /> Templates
                </Button>
              )}
            </div>

            {showTemplates && templates.length > 0 && (
              <div className="border border-border rounded-lg p-2 space-y-1 bg-white/[0.02]">
                {templates.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/[0.04] text-sm transition-colors">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {(t.task_template_items || []).length} itens
                    </span>
                  </button>
                ))}
              </div>
            )}

            {checklistItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 pl-2">
                <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                <span className="flex-1 text-sm">{item}</span>
                <button onClick={() => removeCheckItem(idx)} className="p-1 hover:bg-white/[0.06] rounded">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCheckItem())}
                placeholder="Adicionar item..."
                className="bg-white/[0.04] border-border text-sm h-8"
              />
              <Button variant="ghost" size="sm" onClick={addCheckItem} className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border bg-white/[0.04] hover:bg-white/[0.08]">
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
