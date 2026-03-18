import { motion } from "framer-motion";
import { Mail, Briefcase, Loader2 } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";

export default function Team() {
  const { profiles, loading } = useProfiles();
  const active = profiles.filter(p => p.status === "ativo");

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Equipe</h1>
        <p className="text-sm text-white/50 mt-1">{active.length} membros ativos</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-20 text-white/30">Nenhum membro na equipe</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((member) => {
            const initials = member.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
            const roleName = (member.roles as any)?.name || "—";
            const deptName = (member.departments as any)?.name || "—";

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.full_name}</h3>
                    <p className="text-sm text-white/40">{roleName}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-white/40">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {member.email}</div>
                  <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> {deptName}</div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-white/30">{member.phone}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
