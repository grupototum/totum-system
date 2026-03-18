import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Copy, Trash2, X, Loader2, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";

interface SubtaskDef { title: string }

interface TemplateTask {
  id?: string;
  title: string;
  description?: string;
  sort_order: number;
  subtasks: SubtaskDef[];
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  project_template_tasks: TemplateTask[];
}

export function ProjectTemplateManager() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTemplates([]);
        return;
      }
      const { data, error } = await supabase
        .from("project_templates")
        .select("*, project_template_tasks(*)")
        .order("name");
      if (error) throw error;
      const mapped = (data || []).map((t: any) => ({
        ...t,
        project_template_tasks: (t.project_template_tasks || []).map((task: any) => ({
          ...task,
          subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
        })),
      }));
      setTemplates(mapped);
    } catch (err: any) {
      console.error("Erro ao carregar templates:", err);
      toast({ title: "Erro ao carregar templates", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setTasks([]);
    setDialogOpen(true);
  };

  const openEdit = (t: ProjectTemplate) => {
    setEditing(t);
    setName(t.name);
    setDescription(t.description || "");
    setTasks(
      (t.project_template_tasks || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((task, idx) => ({ ...task, sort_order: idx }))
    );
    setDialogOpen(true);
  };

  const duplicate = async (t: ProjectTemplate) => {
    try {
      const { data: newTpl, error } = await supabase
        .from("project_templates")
        .insert({ name: `${t.name} (cópia)`, description: t.description })
        .select("id")
        .single();
      if (error || !newTpl) throw error || new Error("Falha ao duplicar");
      const sortedTasks = (t.project_template_tasks || []).sort((a, b) => a.sort_order - b.sort_order);
      if (sortedTasks.length > 0) {
        await supabase.from("project_template_tasks").insert(
          sortedTasks.map((task, idx) => ({
            template_id: newTpl.id,
            title: task.title,
            description: task.description || null,
            sort_order: idx,
            subtasks: (task.subtasks || []) as unknown as Json,
          }))
        );
      }
      toast({ title: "Template duplicado" });
      fetchTemplates();
    } catch (err: any) {
      console.error("Erro ao duplicar template:", err);
      toast({ title: "Erro ao duplicar", description: err?.message, variant: "destructive" });
    }
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("project_template_tasks").delete().eq("template_id", id);
    await supabase.from("project_templates").delete().eq("id", id);
    toast({ title: "Template removido" });
    fetchTemplates();
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks(prev => [...prev, { title: newTaskTitle.trim(), sort_order: prev.length, subtasks: [] }]);
    setNewTaskTitle("");
  };

  const removeTask = (idx: number) => {
    setTasks(prev => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, sort_order: i })));
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

  const handleSave = async () => {
    if (!name.trim() || tasks.length === 0) {
      toast({ title: "Obrigatório", description: "Informe o nome e ao menos uma tarefa.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await supabase.from("project_templates").update({ name: name.trim(), description: description || null }).eq("id", editing.id);
        await supabase.from("project_template_tasks").delete().eq("template_id", editing.id);
        if (tasks.length > 0) {
          await supabase.from("project_template_tasks").insert(
            tasks.map((t, idx) => ({
              template_id: editing.id,
              title: t.title,
              description: t.description || null,
              sort_order: idx,
              subtasks: t.subtasks as unknown as Json,
            }))
          );
        }
        toast({ title: "Template atualizado" });
      } else {
        const { data: newTpl, error } = await supabase
          .from("project_templates")
          .insert({ name: name.trim(), description: description || null })
          .select("id")
          .single();
        if (error || !newTpl) throw error;
        await supabase.from("project_template_tasks").insert(
          tasks.map((t, idx) => ({
            template_id: newTpl.id,
            title: t.title,
            description: t.description || null,
            sort_order: idx,
            subtasks: t.subtasks as unknown as Json,
          }))
        );
        toast({ title: "Template criado" });
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Projeto</h3>
          <p className="text-sm text-muted-foreground">Projetos pré-definidos com tarefas e subtarefas</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Novo Template
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Nenhum template de projeto cadastrado</div>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => {
            const totalTasks = (t.project_template_tasks || []).length;
            const totalSubtasks = (t.project_template_tasks || []).reduce((s, tk) => s + (tk.subtasks?.length || 0), 0);
            return (
              <div key={t.id} className="glass-card rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium truncate">{t.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {totalTasks} tarefas · {totalSubtasks} subtarefas
                    </span>
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground pl-6">{t.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(t)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteTemplate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template de Projeto" : "Novo Template de Projeto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Projeto de Landing Page" className="bg-white/[0.04] border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descrição do template..." className="bg-white/[0.04] border-border resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Tarefas do Projeto *</Label>
              {tasks.map((task, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpandedTask(expandedTask === idx ? null : idx)} className="p-0.5">
                      {expandedTask === idx ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <span className="flex-1 text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.subtasks.length} sub</span>
                    <button onClick={() => removeTask(idx)} className="p-1 hover:bg-white/[0.06] rounded">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  {expandedTask === idx && (
                    <SubtaskEditor
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
                <Button variant="ghost" size="sm" onClick={addTask} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || tasks.length === 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubtaskEditor({ subtasks, onAdd, onRemove }: { subtasks: SubtaskDef[]; onAdd: (title: string) => void; onRemove: (idx: number) => void }) {
  const [newSub, setNewSub] = useState("");
  return (
    <div className="pl-6 space-y-1">
      {subtasks.map((s, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">•</span>
          <span className="flex-1 text-xs">{s.title}</span>
          <button onClick={() => onRemove(idx)} className="p-0.5 hover:bg-white/[0.06] rounded">
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
        <Button variant="ghost" size="sm" onClick={() => { if (newSub.trim()) { onAdd(newSub.trim()); setNewSub(""); } }} className="h-7 px-1.5">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
