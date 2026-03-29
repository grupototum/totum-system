import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Task } from "./taskData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Trophy, TrendingUp, CheckCircle2, Clock, Loader2, Pencil } from "lucide-react";
import { motion } from "framer-motion";

interface TaskGoal {
  id: string;
  title: string;
  description: string | null;
  target_count: number;
  current_count: number;
  goal_type: string;
  period: string;
  start_date: string;
  end_date: string | null;
  status: string;
  responsible_id: string | null;
  client_id: string | null;
}

interface TaskGoalsProps {
  tasks: Task[];
  profiles: { user_id: string; full_name: string }[];
  clients: { id: string; name: string }[];
}

const GOAL_TYPES = [
  { value: "completion", label: "Tarefas concluídas" },
  { value: "creation", label: "Tarefas criadas" },
  { value: "on_time", label: "Concluídas no prazo" },
];

const PERIODS = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
  { value: "custom", label: "Personalizado" },
];

export function TaskGoals({ tasks, profiles, clients }: TaskGoalsProps) {
  const [goals, setGoals] = useState<TaskGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TaskGoal | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetCount, setTargetCount] = useState(10);
  const [goalType, setGoalType] = useState("completion");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [clientId, setClientId] = useState("");

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("task_goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setGoals(data);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, []);

  // Compute current_count for each goal based on real tasks
  const goalsWithProgress = useMemo(() => {
    return goals.map((goal) => {
      const start = new Date(goal.start_date);
      const end = goal.end_date ? new Date(goal.end_date) : getPeriodEnd(goal.start_date, goal.period);

      const relevantTasks = tasks.filter((t) => {
        if (goal.responsible_id && t.responsibleId !== goal.responsible_id) return false;
        if (goal.client_id && t.clientId !== goal.client_id) return false;
        return true;
      });

      let count = 0;
      if (goal.goal_type === "completion") {
        count = relevantTasks.filter((t) => t.status === "concluido").length;
      } else if (goal.goal_type === "creation") {
        count = relevantTasks.length;
      } else if (goal.goal_type === "on_time") {
        count = relevantTasks.filter(
          (t) => t.status === "concluido" && t.dueDate && new Date(t.dueDate) >= new Date()
        ).length;
      }

      const pct = Math.min(Math.round((count / Math.max(goal.target_count, 1)) * 100), 100);
      const isCompleted = count >= goal.target_count;

      return { ...goal, computed_count: count, pct, isCompleted };
    });
  }, [goals, tasks]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetCount(10);
    setGoalType("completion");
    setPeriod("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setResponsibleId("");
    setClientId("");
    setEditingGoal(null);
  };

  const openEdit = (goal: TaskGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setTargetCount(goal.target_count);
    setGoalType(goal.goal_type);
    setPeriod(goal.period);
    setStartDate(goal.start_date);
    setEndDate(goal.end_date || "");
    setResponsibleId(goal.responsible_id || "");
    setClientId(goal.client_id || "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      target_count: targetCount,
      goal_type: goalType,
      period,
      start_date: startDate,
      end_date: endDate || null,
      responsible_id: responsibleId || null,
      client_id: clientId || null,
    };

    if (editingGoal) {
      const { error } = await (supabase as any)
        .from("task_goals")
        .update(payload)
        .eq("id", editingGoal.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Meta atualizada" });
      }
    } else {
      const { error } = await (supabase as any)
        .from("task_goals")
        .insert(payload);
      if (error) {
        toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Meta criada com sucesso" });
      }
    }

    setSaving(false);
    setFormOpen(false);
    resetForm();
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("task_goals").delete().eq("id", id);
    if (!error) {
      toast({ title: "Meta removida" });
      fetchGoals();
    }
  };

  // Stats
  const activeGoals = goalsWithProgress.filter((g) => g.status === "active");
  const completedGoals = goalsWithProgress.filter((g) => g.isCompleted);
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.pct, 0) / activeGoals.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "Metas Ativas", value: activeGoals.length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
          { label: "Concluídas", value: completedGoals.length, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Progresso Médio", value: `${avgProgress}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Total de Metas", value: goals.length, icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-muted/30" },
        ].map((m) => (
          <div key={m.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${m.bg}`}>
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              </div>
            </div>
            <p className="text-xl font-heading font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Target className="h-4 w-4" /> Metas
        </h3>
        <Button size="sm" className="gap-1.5 rounded-full" onClick={() => { resetForm(); setFormOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Nova Meta
        </Button>
      </div>

      {/* Goals List */}
      {goalsWithProgress.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground/70 text-sm">Nenhuma meta criada ainda.</p>
          <p className="text-muted-foreground/50 text-xs mt-1">Crie metas para acompanhar o progresso da equipe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goalsWithProgress.map((goal) => {
            const responsibleName = goal.responsible_id
              ? profiles.find((p) => p.user_id === goal.responsible_id)?.full_name
              : null;
            const clientName = goal.client_id
              ? clients.find((c) => c.id === goal.client_id)?.name
              : null;
            const typeLabel = GOAL_TYPES.find((t) => t.value === goal.goal_type)?.label || goal.goal_type;
            const periodLabel = PERIODS.find((p) => p.value === goal.period)?.label || goal.period;

            return (
              <div key={goal.id} className={`glass-card rounded-xl p-4 border-l-4 transition-all ${
                goal.isCompleted ? "border-emerald-500" : goal.pct >= 50 ? "border-blue-500" : "border-muted-foreground/20"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {goal.isCompleted && <Trophy className="h-4 w-4 text-emerald-400 shrink-0" />}
                      <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(goal)}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground/70">{goal.computed_count} / {goal.target_count}</span>
                    <span className={`text-xs font-heading font-bold ${goal.isCompleted ? "text-emerald-400" : "text-foreground/70"}`}>
                      {goal.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${goal.isCompleted ? "bg-emerald-500" : goal.pct >= 50 ? "bg-blue-500" : "bg-primary/60"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {periodLabel}
                  </span>
                  <span>{typeLabel}</span>
                  {responsibleName && <span>👤 {responsibleName}</span>}
                  {clientName && <span>🏢 {clientName}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Defina uma meta para acompanhar o progresso.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Concluir 20 tarefas este mês" className="bg-secondary border-border" />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Detalhes da meta..." className="bg-secondary border-border resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de Meta</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade Alvo</Label>
                <Input type="number" min={1} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} className="bg-secondary border-border" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Período</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>

            {period === "custom" && (
              <div className="space-y-1.5">
                <Label>Data Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-secondary border-border" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Responsável (opcional)</Label>
                <Select value={responsibleId || "all"} onValueChange={(v) => setResponsibleId(v === "all" ? "" : v)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {profiles.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente (opcional)</Label>
                <Select value={clientId || "all"} onValueChange={(v) => setClientId(v === "all" ? "" : v)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }} className="border-border">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingGoal ? "Salvar" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getPeriodEnd(startDate: string, period: string): Date {
  const d = new Date(startDate);
  switch (period) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d;
}
