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

export function ProjectFormDialog({ open, onOpenChange, onSubmit }: Props) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; title: string; client_id: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", client_id: "", contract_id: "", project_type_id: "",
    responsible_id: "", description: "", start_date: "", due_date: "",
  });

  useEffect(() => {
    if (open) {
      Promise.all([
        supabase.from("clients").select("id, name").eq("status", "ativo").order("name"),
        supabase.from("contracts").select("id, title, client_id").eq("status", "ativo").order("title"),
        supabase.from("project_types").select("id, name").eq("is_active", true).order("name"),
        supabase.from("profiles").select("user_id, full_name").eq("status", "ativo").order("full_name"),
      ]).then(([c, ct, pt, p]) => {
        setClients(c.data || []);
        setContracts((ct.data as any) || []);
        setProjectTypes(pt.data || []);
        setProfiles((p.data as any) || []);
      });
      setForm({ name: "", client_id: "", contract_id: "", project_type_id: "", responsible_id: "", description: "", start_date: "", due_date: "" });
    }
  }, [open]);

  const filteredContracts = form.client_id
    ? contracts.filter((c) => c.client_id === form.client_id)
    : contracts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client_id) return;
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      client_id: form.client_id,
      status: "pendente",
    };
    if (form.contract_id) payload.contract_id = form.contract_id;
    if (form.project_type_id) payload.project_type_id = form.project_type_id;
    if (form.responsible_id) payload.responsible_id = form.responsible_id;
    if (form.description) payload.description = form.description.trim();
    if (form.start_date) payload.start_date = form.start_date;
    if (form.due_date) payload.due_date = form.due_date;
    const ok = await onSubmit(payload);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome do Projeto *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, contract_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contrato</Label>
              <Select value={form.contract_id} onValueChange={(v) => setForm({ ...form, contract_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredContracts.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Projeto</Label>
              <Select value={form.project_type_id} onValueChange={(v) => setForm({ ...form, project_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {projectTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={form.responsible_id} onValueChange={(v) => setForm({ ...form, responsible_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Data Prazo</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.name.trim() || !form.client_id}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
