import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Clock, Trash2, Pencil, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useSlaRules, SlaRule } from "@/hooks/useSlaRules";
import { SlaFormDialog } from "@/components/pop-sla/SlaFormDialog";

const priorityConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-white/10 text-muted-foreground" },
  media: { label: "Média", color: "bg-blue-500/15 text-blue-400" },
  alta: { label: "Alta", color: "bg-amber-500/15 text-amber-400" },
  urgente: { label: "Urgente", color: "bg-red-500/15 text-red-400" },
};

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SlaRules() {
  const { slaRules, loading, saveSlaRule, deleteSlaRule } = useSlaRules();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<SlaRule | null>(null);

  const filtered = useMemo(() => {
    return slaRules.filter((r) => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [slaRules, search, priorityFilter]);

  const handleEdit = (rule: SlaRule) => {
    setEditRule(rule);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditRule(null);
    setFormOpen(true);
  };

  const handleDelete = async (rule: SlaRule) => {
    if (!confirm(`Excluir SLA "${rule.name}"?`)) return;
    await deleteSlaRule(rule.id);
  };

  const handleToggleActive = async (rule: SlaRule) => {
    await saveSlaRule({ ...rule, conditions: rule.conditions, is_active: !rule.is_active });
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Regras de SLA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Service Level Agreements — {slaRules.length} regra{slaRules.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Regra
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar SLA..." className="pl-9 bg-white/[0.04] border-border" />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-44 bg-white/[0.04] border-border">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhuma regra de SLA encontrada.</p>
          <Button variant="outline" className="mt-4" onClick={handleNew}>Criar primeira regra</Button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((rule, i) => {
              const pConf = priorityConfig[rule.priority] || priorityConfig.media;
              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`group bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 ${!rule.is_active ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{rule.name}</h3>
                        <Badge variant="secondary" className={`text-[10px] ${pConf.color}`}>{pConf.label}</Badge>
                        {!rule.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                      </div>
                      <div className="flex items-center gap-5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Resposta: {formatTime(rule.max_response_minutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Resolução: {formatTime(rule.max_resolution_minutes)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Switch checked={rule.is_active} onCheckedChange={() => handleToggleActive(rule)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(rule)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <SlaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editRule}
        onSave={saveSlaRule}
      />
    </div>
  );
}
