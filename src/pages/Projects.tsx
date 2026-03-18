import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Clock, User, Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pendente: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  em_andamento: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pausado: "bg-white/10 text-white/50 border-white/20",
  concluido: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
};

export default function Projects() {
  const { projects, loading, addProject, updateProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const inProgressCount = projects.filter((p) => p.status === "em_andamento").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Projetos</h1>
          <p className="text-sm text-white/50 mt-1">{inProgressCount} em andamento · {projects.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
          <Plus className="h-4 w-4" /> Novo Projeto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-white/30">Nenhum projeto encontrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[project.status] || "bg-white/10 text-white/50"}`}>
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
              <p className="text-sm text-white/50 mb-4">{(project.clients as any)?.name || "—"}</p>
              <div className="flex items-center gap-4 text-xs text-white/40">
                {(project.project_types as any)?.name && (
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {(project.project_types as any).name}</span>
                )}
                {project.due_date && (
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {format(new Date(project.due_date), "dd/MM/yyyy")}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ProjectFormDialog open={showForm} onOpenChange={setShowForm} onSubmit={addProject} />
    </div>
  );
}
