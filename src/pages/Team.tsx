import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Briefcase, Loader2, Users, Filter } from "lucide-react";
import { useProfiles, useRoles, useDepartments } from "@/hooks/useProfiles";
import { UserDetailSheet } from "@/components/users/UserDetailSheet";
import { ProfileRow } from "@/hooks/useProfiles";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<string, string> = {
  ativo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inativo: "bg-white/[0.06] text-white/40 border-white/[0.08]",
  bloqueado: "bg-red-500/15 text-red-400 border-red-500/30",
  pendente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function Team() {
  const { isDemoMode } = useDemo();
  const { profiles, loading, refetch } = useProfiles();
  const { roles } = useRoles();
  const deptsList = useDepartments();
  const departments = deptsList.map(d => ({ id: d.id, name: d.name }));
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (isDemoMode) {
      setIsAdmin(true);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.rpc("is_admin", { _user_id: user.id }).then(({ data }) => setIsAdmin(!!data));
      }
    });
  }, [isDemoMode]);

  const filtered = profiles.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleClick = (profile: ProfileRow) => {
    setSelectedProfile(profile);
    setSheetOpen(true);
  };

  const activeCount = profiles.filter((p) => p.status === "ativo").length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Equipe</h1>
          <p className="text-sm text-white/50 mt-1">
            {profiles.length} membros · {activeCount} ativos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-sm pl-9 focus:border-primary/50"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#271c1d] border-white/[0.1] text-white">
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            <SelectItem value="ativo" className="text-xs">Ativos</SelectItem>
            <SelectItem value="inativo" className="text-xs">Inativos</SelectItem>
            <SelectItem value="bloqueado" className="text-xs">Bloqueados</SelectItem>
            <SelectItem value="pendente" className="text-xs">Pendentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">Nenhum membro encontrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((member) => {
            const initials = member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const roleName = (member.roles as any)?.name || "—";
            const deptName = (member.departments as any)?.name || "—";
            const statusCls = statusColors[member.status] || statusColors.ativo;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                onClick={() => handleClick(member)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                    <AvatarFallback className="gradient-primary text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                      {member.full_name}
                    </h3>
                    <p className="text-sm text-white/40">{roleName}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${statusCls}`}>
                    {member.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs text-white/40">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{member.email}</span></div>
                  <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 shrink-0" /> {deptName}</div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-white/30">{member.phone}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <UserDetailSheet
        profile={selectedProfile}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        roles={roles}
        departments={departments}
        onRefresh={() => {
          refetch();
          // Re-fetch updated profile
          if (selectedProfile) {
            supabase.from("profiles")
              .select("*, roles(name, permissions), departments(name)")
              .eq("id", selectedProfile.id)
              .single()
              .then(({ data }) => {
                if (data) setSelectedProfile(data as ProfileRow);
              });
          }
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
