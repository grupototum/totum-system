import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Briefcase, Clock, User, Loader2, Pencil, Search, LayoutTemplate, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects, ProjectRow } from "@/hooks/useProjects";
import { useProjectTemplates } from "@/hooks/useProjectTemplates";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { ProjectDetailSheet } from "@/components/projects/ProjectDetailSheet";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pendente: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  em_andamento: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pausado: "bg-white/10 text-muted-foreground border-white/20",
  concluido: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
};

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluídos" },
];

function projectProgress(project: ProjectRow) {
  const tasks = project.tasks || [];
  const completed = tasks.filter((t) => t.status === "concluido").length;
  return { completed, total: tasks.length, pct: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0 };
}

export default function Projects() {
  const { projects, loading, addProject, updateProject } = useProjects();
  const [activeTab, setActiveTab] = useState("acompanhar");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formTemplateId, setFormTemplateId] = useState<string | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [detailProject, setDetailProject] = useState<ProjectRow | null>(null);
  const { data: templates = [] } = useProjectTemplates();

  const inProgressCount = projects.filter((p) => p.status === "em_andamento").length;

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (!query) return true;
      const clientName = (p.clients as any)?.name || "";
      return p.name.toLowerCase().includes(query) || clientName.toLowerCase().includes(query);
    });
  }, [projects, statusFilter, search]);

  const startCreate = (templateId?: string) => {
    setFormTemplateId(templateId);
    setShowForm(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Projetos</h1>
        <p className="text-sm text-muted-foreground mt-1">{inProgressCount} em andamento · {projects.length} total</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="acompanhar">Acompanhar</TabsTrigger>
          <TabsTrigger value="criar">Criar Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="acompanhar" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={statusFilter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(f.value)}
                  className={statusFilter !== f.value ? "border-border bg-white/[0.04]" : ""}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou cliente..."
                className="pl-8 bg-white/[0.04] border-border h-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground/50">
              {projects.length === 0 ? "Nenhum projeto encontrado" : "Nenhum projeto corresponde aos filtros"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => {
                const progress = projectProgress(project);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    onClick={() => setDetailProject(project)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[project.status] || "bg-white/10 text-muted-foreground"}`}>
                          {statusLabels[project.status] || project.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{(project.clients as any)?.name || "—"}</p>

                    {progress.total > 0 && (
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{progress.completed}/{progress.total} tarefas</span>
                          <span>{progress.pct}%</span>
                        </div>
                        <Progress value={progress.pct} className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                      {(project.project_types as any)?.name && (
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {(project.project_types as any).name}</span>
                      )}
                      {project.due_date && (
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {format(new Date(project.due_date), "dd/MM/yyyy")}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="criar" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Escolha um template para começar ou crie um projeto em branco.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => startCreate(undefined)}
              className="glass-card rounded-xl p-5 text-left hover:bg-white/[0.04] transition-colors border border-dashed border-border"
            >
              <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3">
                <FilePlus className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Projeto em branco</h3>
              <p className="text-xs text-muted-foreground">Começar sem template, definindo tudo manualmente</p>
            </button>

            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => startCreate(tpl.id)}
                className="glass-card rounded-xl p-5 text-left hover:bg-white/[0.04] transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{tpl.name}</h3>
                <p className="text-xs text-muted-foreground">{(tpl.project_template_tasks || []).length} tarefa(s) no template</p>
              </button>
            ))}
          </div>
          {templates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum template cadastrado ainda. Gerencie templates em Configurações → Templates.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setFormTemplateId(undefined); }}
        onSubmit={addProject}
        initialTemplateId={formTemplateId}
      />
      <ProjectFormDialog
        open={!!editingProject}
        onOpenChange={(open) => { if (!open) setEditingProject(null); }}
        onSubmit={(values, tasks) => updateProject(editingProject.id, values, tasks)}
        initialData={editingProject}
      />
      <ProjectDetailSheet
        project={detailProject}
        open={!!detailProject}
        onOpenChange={(open) => { if (!open) setDetailProject(null); }}
      />
    </div>
  );
}
