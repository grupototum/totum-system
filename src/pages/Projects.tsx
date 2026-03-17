import { motion } from "framer-motion";
import { Briefcase, Clock, User } from "lucide-react";

const projects = [
  { id: "1", name: "Rebranding TechVentures", client: "TechVentures S.A.", status: "Em progresso", stage: "Design", responsible: "Ana Silva", deadline: "30/03/2026" },
  { id: "2", name: "Landing Page Nova Digital", client: "Nova Digital", status: "Em progresso", stage: "Desenvolvimento", responsible: "Carlos Mendes", deadline: "25/03/2026" },
  { id: "3", name: "Campanha Black Friday", client: "MegaStore", status: "Pausado", stage: "Planejamento", responsible: "Juliana Costa", deadline: "15/11/2026" },
  { id: "4", name: "App Institucional Innova", client: "Innova Corp", status: "Concluído", stage: "Entrega", responsible: "Rafael Lima", deadline: "01/03/2026" },
];

const stageColors: Record<string, string> = {
  Planejamento: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Design: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Desenvolvimento: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Entrega: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function Projects() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Projetos</h1>
        <p className="text-sm text-white/50 mt-1">{projects.filter(p => p.status === "Em progresso").length} em progresso</p>
      </div>

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
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${stageColors[project.stage] || "bg-white/10 text-white/60"}`}>
                {project.stage}
              </span>
            </div>
            <h3 className="font-semibold mb-1">{project.name}</h3>
            <p className="text-sm text-white/50 mb-4">{project.client}</p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {project.responsible}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {project.deadline}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
