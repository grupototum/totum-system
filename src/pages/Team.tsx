import { motion } from "framer-motion";
import { UserCog, Mail, Briefcase } from "lucide-react";

const team = [
  { name: "Ana Silva", role: "Diretora Criativa", email: "ana@totum.com", clients: 8, avatar: "AS" },
  { name: "Carlos Mendes", role: "Desenvolvedor", email: "carlos@totum.com", clients: 5, avatar: "CM" },
  { name: "Juliana Costa", role: "Gestora de Tráfego", email: "juliana@totum.com", clients: 12, avatar: "JC" },
  { name: "Rafael Lima", role: "Designer", email: "rafael@totum.com", clients: 6, avatar: "RL" },
  { name: "Marina Souza", role: "Atendimento", email: "marina@totum.com", clients: 15, avatar: "MS" },
];

export default function Team() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Equipe</h1>
        <p className="text-sm text-white/50 mt-1">{team.length} membros</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map((member) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                {member.avatar}
              </div>
              <div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-white/40">{member.role}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-white/40">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {member.email}</div>
              <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> {member.clients} clientes atribuídos</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
