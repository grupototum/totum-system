import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X, ChevronDown, ChevronRight } from "lucide-react";

interface TaskDef {
  title: string;
  subtasks: { title: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any, tasks: TaskDef[]) => Promise<boolean>;
  initialData?: any;
}

export function ProjectFormDialog({ open, onOpenChange, onSubmit, initialData }: Props) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; title: string; client_id: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", client_id: "", contract_id: "", project_type_id: "",
    responsible_id: "", description: "", start_date: "", due_date: "",
  });
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      Promise.all([
        supabase.from("clients").select("id, name").eq("status", "ativo").order("name"),
        supabase.from("contracts").select("id, title, client_id").eq("status", "ativo").order("title"),
        supabase.from("project_types").select("id, name").eq("is_active", true).order("name"),
        supabase.from("profiles").select("user_id, full_name").eq("status", "ativo").order("full_name"),
        supabase.from("project_templates").select("*, project_template_tasks(*)").order("name"),
      ]).then(([c, ct, pt, p, tpl]) => {
        setClients(c.data || []);
        setContracts((ct.data as any) || []);
        setProjectTypes(pt.data || []);
        setProfiles((p.data as any) || []);
        setProjectTemplates(tpl.data || []);
      });
      if (initialData) {
        setForm({
          name: initialData.name || "",
          client_id: initialData.client_id || "",
          contract_id: initialData.contract_id || "",
          project_type_id: initialData.project_type_id || "",
          responsible_id: initialData.responsible_id || "",
          description: initialData.description || "",
          start_date: initialData.start_date || "",
          due_date: initialData.due_date || "",
        });
        setTasks([]); // For editing, tasks are managed separately
      } else {
        setForm({ name: "", client_id: "", contract_id: "", project_type_id: "", responsible_id: "", description: "", start_date: "", due_date: "" });
        setTasks([]);
      }
    }
  }, [open]);

  const filteredContracts = form.client_id
    ? contracts.filter((c) => c.client_id === form.client_id)
    : contracts;

  const applyTemplate = (templateId: string) => {
    const tpl = projectTemplates.find((t: any) => t.id === templateId);
    if (!tpl) return;
    if (!form.name) setForm(prev => ({ ...prev, name: tpl.name }));
    const tplTasks = (tpl.project_template_tasks || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((t: any) => ({
        title: t.title,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      }));
    setTasks(tplTasks);
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks(prev => [...prev, { title: newTaskTitle.trim(), subtasks: [] }]);
    setNewTaskTitle("");
  };

  const removeTask = (idx: number) => {
    setTasks(prev => prev.filter((_, i) => i !== idx));
    if (expandedTask === idx) setExpandedTask(null);
  };

  const addSubtask = (taskIdx: number, title: string) => {
    setTasks(prev => prev.map((t, i) => i === taskIdx ? { ...t, subtasks: [...t.subtasks, { title }] } : t));
  };

  const removeSubtask = (taskIdx: number, subIdx: number) => {
    setTasks(prev => prev.map((t, i) =>
      i === taskIdx ? { ...t, subtasks: t.subtasks.filter((_, si) => si !== subIdx) } : t
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client_id) return;
    // For new projects, require at least 1 task
    if (!initialData && tasks.length === 0) return;
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
    const ok = await onSubmit(payload, tasks);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const isNewProject = !initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template selector — only for new projects */}
          {isNewProject && projectTemplates.length > 0 && (
            <div>
              <Label>Usar Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue placeholder="Selecionar template (opcional)" /></SelectTrigger>
                <SelectContent>
                  {projectTemplates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({(t.project_template_tasks || []).length} tarefas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Task list — required for new projects */}
          {isNewProject && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tarefas do Projeto *</Label>
                <span className="text-xs text-muted-foreground">{tasks.length} tarefa(s)</span>
              </div>
              {tasks.map((task, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setExpandedTask(expandedTask === idx ? null : idx)} className="p-0.5">
                      {expandedTask === idx ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <span className="flex-1 text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.subtasks.length} sub</span>
                    <button type="button" onClick={() => removeTask(idx)} className="p-1 hover:bg-white/[0.06] rounded">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  {expandedTask === idx && (
                    <SubtaskInlineEditor
                      subtasks={task.subtasks}
                      onAdd={(title) => addSubtask(idx, title)}
                      onRemove={(subIdx) => removeSubtask(idx, subIdx)}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTask())}
                  placeholder="Adicionar tarefa..."
                  className="bg-white/[0.04] border-border text-sm h-8"
                />
                <Button type="button" variant="ghost" size="sm" onClick={addTask} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {tasks.length === 0 && (
                <p className="text-xs text-destructive">Adicione pelo menos uma tarefa ao projeto.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.name.trim() || !form.client_id || (isNewProject && tasks.length === 0)}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubtaskInlineEditor({ subtasks, onAdd, onRemove }: { subtasks: { title: string }[]; onAdd: (title: string) => void; onRemove: (idx: number) => void }) {
  const [newSub, setNewSub] = useState("");
  return (
    <div className="pl-6 space-y-1">
      {subtasks.map((s, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">•</span>
          <span className="flex-1 text-xs">{s.title}</span>
          <button type="button" onClick={() => onRemove(idx)} className="p-0.5 hover:bg-white/[0.06] rounded">
            <X className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5">
        <Input
          value={newSub}
          onChange={e => setNewSub(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (newSub.trim()) { onAdd(newSub.trim()); setNewSub(""); }
            }
          }}
          placeholder="Adicionar subtarefa..."
          className="bg-white/[0.04] border-border text-xs h-7"
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => { if (newSub.trim()) { onAdd(newSub.trim()); setNewSub(""); } }} className="h-7 px-1.5">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
