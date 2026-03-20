import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, BookOpen, Trash2, Pencil, ChevronRight, ListChecks, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePops, Pop } from "@/hooks/usePops";
import { PopFormDialog } from "@/components/pop-sla/PopFormDialog";

const POP_CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "vendas", label: "Vendas" },
  { value: "marketing", label: "Marketing" },
  { value: "suporte", label: "Suporte" },
  { value: "financeiro", label: "Financeiro" },
  { value: "operacional", label: "Operacional" },
  { value: "geral", label: "Geral" },
];

const categoryColors: Record<string, string> = {
  vendas: "bg-emerald-500/15 text-emerald-400",
  marketing: "bg-blue-500/15 text-blue-400",
  suporte: "bg-amber-500/15 text-amber-400",
  financeiro: "bg-purple-500/15 text-purple-400",
  operacional: "bg-rose-500/15 text-rose-400",
  geral: "bg-white/10 text-white/60",
};

export default function PopLibrary() {
  const { pops, loading, savePop, deletePop } = usePops();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editPop, setEditPop] = useState<Pop | null>(null);

  const filtered = useMemo(() => {
    return pops.filter((p) => {
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [pops, search, categoryFilter]);

  const handleEdit = (pop: Pop) => {
    setEditPop(pop);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditPop(null);
    setFormOpen(true);
  };

  const handleDelete = async (pop: Pop) => {
    if (!confirm(`Excluir POP "${pop.title}"?`)) return;
    await deletePop(pop.id);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Biblioteca de POPs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Procedimentos Operacionais Padrão — {pops.length} cadastrado{pops.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo POP
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar POP..." className="pl-9 bg-white/[0.04] border-border" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 bg-white/[0.04] border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {POP_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
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
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhum POP encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={handleNew}>Criar primeiro POP</Button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((pop, i) => (
              <motion.div
                key={pop.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                onClick={() => handleEdit(pop)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{pop.title}</h3>
                      <Badge variant="secondary" className={`text-[10px] ${categoryColors[pop.category] || categoryColors.geral}`}>
                        {pop.category}
                      </Badge>
                    </div>
                    {pop.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{pop.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />{pop.steps.length} etapa{pop.steps.length !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{pop.checklist.length} item{pop.checklist.length !== 1 ? "ns" : ""} de checklist</span>
                      {pop.linked_task_type && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{pop.linked_task_type}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(pop); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(pop); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PopFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pop={editPop}
        onSave={savePop}
      />
    </div>
  );
}
