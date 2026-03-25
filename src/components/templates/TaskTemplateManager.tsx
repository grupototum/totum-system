import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Copy, Trash2, X, Loader2, FileText, GripVertical, LayoutGrid, List } from "lucide-react";

interface TemplateItem {
  id?: string;
  title: string;
  description?: string;
  sort_order: number;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  task_template_items: TemplateItem[];
}

export function TaskTemplateManager() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [newItem, setNewItem] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTemplates([]);
        return;
      }
      const { data, error } = await supabase
        .from("task_templates")
        .select("*, task_template_items(*)")
        .order("name");
      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (err: any) {
      console.error("Erro ao carregar templates:", err);
      toast({ title: "Erro ao carregar templates", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setItems([]);
    setDialogOpen(true);
  };

  const openEdit = (t: TaskTemplate) => {
    setEditing(t);
    setName(t.name);
    setDescription(t.description || "");
    setItems(
      (t.task_template_items || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i, idx) => ({ ...i, sort_order: idx }))
    );
    setDialogOpen(true);
  };

  const duplicate = async (t: TaskTemplate) => {
    try {
      const { data: newTpl, error } = await supabase
        .from("task_templates")
        .insert({ name: `${t.name} (cópia)`, description: t.description })
        .select("id")
        .single();
      if (error || !newTpl) throw error || new Error("Falha ao duplicar");
      const sortedItems = (t.task_template_items || []).sort((a, b) => a.sort_order - b.sort_order);
      if (sortedItems.length > 0) {
        await supabase.from("task_template_items").insert(
          sortedItems.map((i, idx) => ({
            template_id: newTpl.id,
            title: i.title,
            description: i.description || null,
            sort_order: idx,
          }))
        );
      }
      toast({ title: "Template duplicado" });
      fetch();
    } catch (err: any) {
      console.error("Erro ao duplicar template:", err);
      toast({ title: "Erro ao duplicar", description: err?.message, variant: "destructive" });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error: itemsErr } = await supabase.from("task_template_items").delete().eq("template_id", id);
      if (itemsErr) throw itemsErr;
      const { error } = await supabase.from("task_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Template removido" });
      fetch();
    } catch (err: any) {
      console.error("Erro ao remover template:", err);
      toast({ title: "Erro ao remover", description: err?.message, variant: "destructive" });
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { title: newItem.trim(), sort_order: prev.length }]);
    setNewItem("");
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from("task_templates").update({ name: name.trim(), description: description || null }).eq("id", editing.id);
        await supabase.from("task_template_items").delete().eq("template_id", editing.id);
        if (items.length > 0) {
          await supabase.from("task_template_items").insert(
            items.map((i, idx) => ({
              template_id: editing.id,
              title: i.title,
              description: i.description || null,
              sort_order: idx,
            }))
          );
        }
        toast({ title: "Template atualizado" });
      } else {
        const { data: newTpl, error } = await supabase
          .from("task_templates")
          .insert({ name: name.trim(), description: description || null })
          .select("id")
          .single();
        if (error || !newTpl) throw error;
        if (items.length > 0) {
          await supabase.from("task_template_items").insert(
            items.map((i, idx) => ({
              template_id: newTpl.id,
              title: i.title,
              description: i.description || null,
              sort_order: idx,
            }))
          );
        }
        toast({ title: "Template criado" });
      }
      setDialogOpen(false);
      fetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Templates de Tarefa</h3>
          <p className="text-sm text-muted-foreground">Modelos reutilizáveis com subtarefas padrão</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground/70 hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground/70 hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={openNew} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo Template
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Nenhum template de tarefa cadastrado</div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {templates.map(t => (
            <div key={t.id} className="glass-card rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium truncate">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(t.task_template_items || []).length} subtarefas
                  </span>
                </div>
                {t.description && <p className="text-xs text-muted-foreground pl-6">{t.description}</p>}
                {(t.task_template_items || []).length > 0 && (
                  <div className="pl-6 mt-2 space-y-0.5">
                    {(t.task_template_items || [])
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-muted-foreground/40">•</span> {item.title}
                        </div>
                      ))}
                    {(t.task_template_items || []).length > 5 && (
                      <div className="text-xs text-muted-foreground/50">
                        +{(t.task_template_items || []).length - 5} mais
                      </div>
                    )}
                  </div>
                )}
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
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template de Tarefa" : "Novo Template de Tarefa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Onboarding de cliente" className="bg-white/[0.04] border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descrição do template..." className="bg-white/[0.04] border-border resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Subtarefas</Label>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 pl-2">
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                  <span className="flex-1 text-sm">{item.title}</span>
                  <button onClick={() => removeItem(idx)} className="p-1 hover:bg-white/[0.06] rounded">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem())}
                  placeholder="Adicionar subtarefa..."
                  className="bg-white/[0.04] border-border text-sm h-8"
                />
                <Button variant="ghost" size="sm" onClick={addItem} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
