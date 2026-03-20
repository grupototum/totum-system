import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { SlaRule } from "@/hooks/useSlaRules";
import { toast } from "@/hooks/use-toast";

interface SlaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: SlaRule | null;
  onSave: (data: any) => Promise<boolean>;
}

export function SlaFormDialog({ open, onOpenChange, rule, onSave }: SlaFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("media");
  const [responseHours, setResponseHours] = useState(1);
  const [responseMinutes, setResponseMinutes] = useState(0);
  const [resolutionHours, setResolutionHours] = useState(8);
  const [resolutionMinutes, setResolutionMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [condTaskType, setCondTaskType] = useState("");

  useEffect(() => {
    if (open) {
      if (rule) {
        setName(rule.name);
        setPriority(rule.priority);
        setResponseHours(Math.floor(rule.max_response_minutes / 60));
        setResponseMinutes(rule.max_response_minutes % 60);
        setResolutionHours(Math.floor(rule.max_resolution_minutes / 60));
        setResolutionMinutes(rule.max_resolution_minutes % 60);
        setIsActive(rule.is_active);
        setCondTaskType((rule.conditions as any)?.task_type || "");
      } else {
        setName("");
        setPriority("media");
        setResponseHours(1);
        setResponseMinutes(0);
        setResolutionHours(8);
        setResolutionMinutes(0);
        setIsActive(true);
        setCondTaskType("");
      }
    }
  }, [open, rule]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    const maxResponse = responseHours * 60 + responseMinutes;
    const maxResolution = resolutionHours * 60 + resolutionMinutes;

    if (maxResponse <= 0 || maxResolution <= 0) {
      toast({ title: "Defina tempos válidos", description: "Resposta e resolução devem ser maiores que zero.", variant: "destructive" });
      return;
    }
    if (maxResolution < maxResponse) {
      toast({ title: "Tempo inválido", description: "Resolução deve ser maior ou igual à resposta.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const conditions: Record<string, any> = {};
    if (condTaskType) conditions.task_type = condTaskType;

    const success = await onSave({
      id: rule?.id,
      name: name.trim(),
      priority,
      max_response_minutes: maxResponse,
      max_resolution_minutes: maxResolution,
      conditions,
      is_active: isActive,
    });
    setSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar Regra SLA" : "Nova Regra SLA"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Defina tempos máximos de resposta e resolução.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: SLA Premium" className="bg-white/[0.04] border-border" />
          </div>

          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tempo Máximo de Resposta</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" min={0} value={responseHours} onChange={(e) => setResponseHours(Number(e.target.value))} className="bg-white/[0.04] border-border w-20" />
              <span className="text-xs text-muted-foreground">h</span>
              <Input type="number" min={0} max={59} value={responseMinutes} onChange={(e) => setResponseMinutes(Number(e.target.value))} className="bg-white/[0.04] border-border w-20" />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tempo Máximo de Resolução</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" min={0} value={resolutionHours} onChange={(e) => setResolutionHours(Number(e.target.value))} className="bg-white/[0.04] border-border w-20" />
              <span className="text-xs text-muted-foreground">h</span>
              <Input type="number" min={0} max={59} value={resolutionMinutes} onChange={(e) => setResolutionMinutes(Number(e.target.value))} className="bg-white/[0.04] border-border w-20" />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Condição: Tipo de Tarefa</Label>
            <Select value={condTaskType || "none"} onValueChange={(v) => setCondTaskType(v === "none" ? "" : v)}>
              <SelectTrigger className="bg-white/[0.04] border-border"><SelectValue placeholder="Qualquer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Qualquer</SelectItem>
                <SelectItem value="conteudo">Conteúdo</SelectItem>
                <SelectItem value="trafego">Tráfego</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="relatorio">Relatório</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="text-sm">Regra ativa</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border bg-white/[0.04]">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {rule ? "Salvar" : "Criar SLA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
