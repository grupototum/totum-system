import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<boolean>;
}

export function ContractFormDialog({ open, onOpenChange, onSubmit }: Props) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string; value: number | null }[]>([]);
  const [contractTypes, setContractTypes] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", client_id: "", plan_id: "", contract_type_id: "",
    value: "", billing_frequency: "mensal" as string,
    start_date: "", end_date: "", notes: "",
  });

  useEffect(() => {
    if (open) {
      Promise.all([
        supabase.from("clients").select("id, name").eq("status", "ativo").order("name"),
        supabase.from("plans").select("id, name, value").eq("is_active", true).order("name"),
        supabase.from("contract_types").select("id, name").eq("is_active", true).order("name"),
      ]).then(([c, p, ct]) => {
        setClients(c.data || []);
        setPlans((p.data as any) || []);
        setContractTypes(ct.data || []);
      });
      setForm({ title: "", client_id: "", plan_id: "", contract_type_id: "", value: "", billing_frequency: "mensal", start_date: "", end_date: "", notes: "" });
    }
  }, [open]);

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setForm({ ...form, plan_id: planId, value: plan?.value ? String(plan.value) : form.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.client_id) return;
    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      client_id: form.client_id,
      status: "ativo",
      billing_frequency: form.billing_frequency,
    };
    if (form.plan_id) payload.plan_id = form.plan_id;
    if (form.contract_type_id) payload.contract_type_id = form.contract_type_id;
    if (form.value) payload.value = Number(form.value);
    if (form.start_date) payload.start_date = form.start_date;
    if (form.end_date) payload.end_date = form.end_date;
    if (form.notes) payload.notes = form.notes.trim();
    const ok = await onSubmit(payload);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plano</Label>
              <Select value={form.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Contrato</Label>
              <Select value={form.contract_type_id} onValueChange={(v) => setForm({ ...form, contract_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {contractTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={form.billing_frequency} onValueChange={(v) => setForm({ ...form, billing_frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="personalizada">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.title.trim() || !form.client_id}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
