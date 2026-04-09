import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, GripVertical, Loader2 } from "lucide-react";
import { Pop } from "@/hooks/usePops";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "vendas", label: "Vendas" },
  { value: "marketing", label: "Marketing" },
  { value: "suporte", label: "Suporte" },
  { value: "financeiro", label: "Financeiro" },
  { value: "operacional", label: "Operacional" },
  { value: "geral", label: "Geral" },
];

const TASK_TYPES = [
  { value: "", label: "Nenhum" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "trafego", label: "Tráfego" },
  { value: "reuniao", label: "Reunião" },
  { value: "relatorio", label: "Relatório" },
  { value: "design", label: "Design" },
  { value: "desenvolvimento", label: "Desenvolvimento" },
  { value: "outro", label: "Outro" },
];

interface PopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pop: Pop | null;
  onSave: (data: any) => Promise<boolean>;
}

export function PopFormDialog({ open, onOpenChange, pop, onSave }: PopFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("geral");
  const [description, setDescription] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [linkedTaskType, setLinkedTaskType] = useState("");
  const [steps, setSteps] = useState<{ title: string; description: string }[]>([]);
  const [checklist, setChecklist] = useState<{ text: string }[]>([]);
  const [newStep, setNewStep] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");

  useEffect(() => {
    if (open) {
      if (pop) {
        setTitle(pop.title);
        setCategory(pop.category);
        setDescription(pop.description);
        setExpectedOutcome(pop.expected_outcome);
        setLinkedTaskType(pop.linked_task_type || "");
        setSteps(pop.steps.map(s => ({ title: s.title, description: s.description })));
        setChecklist(pop.checklist.map(c => ({ text: c.text })));
      } else {
        setTitle("");
        setCategory("geral");
        setDescription("");
        setExpectedOutcome("");
        setLinkedTaskType("");
        setSteps([]);
        setChecklist([]);
      }
      setNewStep("");
      setNewCheckItem("");
    }
  }, [open, pop]);

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps(prev => [...prev, { title: newStep.trim(), description: "" }]);
    setNewStep("");
  };

  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx));

  const updateStepDesc = (idx: number, desc: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, description: desc } : s));
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist(prev => [...prev, { text: newCheckItem.trim() }]);
    setNewCheckItem("");
  };

  const removeCheckItem = (idx: number) => setChecklist(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    if (steps.length === 0 && checklist.length === 0) {
      toast({ title: "Adicione pelo menos uma etapa ou item de checklist", variant: "destructive" });
      return;
    }

    setSaving(true);
    const success = await onSave({
      id: pop?.id,
      title: title.trim(),
      category,
      description: description.trim(),
      expected_outcome: expectedOutcome.trim(),
      linked_task_type: linkedTaskType || null,
      steps,
      checklist,
    });
    setSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pop ? "Editar POP" : "Novo POP"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Defina o procedimento operacional padrão com etapas e checklist.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do procedimento" className="bg-white/[0.04] border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o objetivo deste procedimento..." rows={2} className="bg-white/[0.04] border-border resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label>Resultado Esperado</Label>
            <Textarea value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} placeholder="O que deve acontecer ao concluir este procedimento..." rows={2} className="bg-white/[0.04] border-border resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de Tarefa Vinculado</Label>
            <Select value={linkedTaskType} onValueChange={setLinkedTaskType}>
              <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map(t => <SelectItem key={t.value || "none"} value={t.value || "none"}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Etapas do Procedimento</Label>
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-white/[0.02] border border-border rounded-lg p-2">
                <span className="text-xs text-muted-foreground font-mono mt-1 w-5 text-center shrink-0">{idx + 1}</span>
                <div className="flex-1 space-y-1">
                  <span className="text-sm font-medium">{step.title}</span>
                  <Input
                    value={step.description}
                    onChange={(e) => updateStepDesc(idx, e.target.value)}
                    placeholder="Detalhes desta etapa (opcional)..."
                    className="bg-transparent border-0 border-b border-border rounded-none px-0 text-xs h-7 focus-visible:ring-0"
                  />
                </div>
                <button onClick={() => removeStep(idx)} className="p-1 hover:bg-white/[0.06] rounded shrink-0">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStep())}
                placeholder="Adicionar etapa..."
                className="bg-white/[0.04] border-border text-sm h-8"
              />
              <Button variant="ghost" size="sm" onClick={addStep} className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Checklist</Label>
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 pl-2">
                <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                <span className="flex-1 text-sm">{item.text}</span>
                <button onClick={() => removeCheckItem(idx)} className="p-1 hover:bg-white/[0.06] rounded">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheckItem())}
                placeholder="Adicionar item de checklist..."
                className="bg-white/[0.04] border-border text-sm h-8"
              />
              <Button variant="ghost" size="sm" onClick={addCheckItem} className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border bg-white/[0.04]">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {pop ? "Salvar" : "Criar POP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
