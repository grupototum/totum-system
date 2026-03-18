import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Shield, History, Search, Plus, MoreHorizontal, Copy,
  Pencil, Trash2, Lock, Unlock, KeyRound, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AppUser, Role, AuditEntry,
  initialUsers, initialRoles, initialAudit,
  userStatusConfig, permissionTree, permKey, buildFullAccess,
} from "@/components/users/permissionsData";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { RoleFormDialog } from "@/components/users/RoleFormDialog";
import { PermissionMatrix } from "@/components/users/PermissionMatrix";
import { AuditLog } from "@/components/users/AuditLog";
import { toast } from "@/hooks/use-toast";

type Tab = "users" | "roles" | "audit";

export default function UsersPermissions() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);

  // Dialogs
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewPermsOpen, setViewPermsOpen] = useState(false);
  const [viewPermsUser, setViewPermsUser] = useState<AppUser | null>(null);

  // Search
  const [userSearch, setUserSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const addAudit = (action: string, detail: string) => {
    setAudit((prev) => [{
      id: crypto.randomUUID(),
      userId: "u1", userName: "Gustavo Torres",
      action, detail,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  // ─── Users ────
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const handleSaveUser = (user: AppUser) => {
    const exists = users.find((u) => u.id === user.id);
    if (exists) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? user : u));
      addAudit("Usuário editado", `Usuário ${user.name} atualizado`);
    } else {
      setUsers((prev) => [...prev, user]);
      addAudit("Usuário criado", `Usuário ${user.name} criado com cargo ${roles.find((r) => r.id === user.roleId)?.name || user.roleId}`);
    }
    toast({ title: exists ? "Usuário atualizado" : "Usuário criado", description: user.name });
  };

  const handleDeleteUser = (user: AppUser) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    addAudit("Usuário excluído", `Usuário ${user.name} removido`);
    toast({ title: "Usuário removido", description: user.name });
  };

  const handleToggleStatus = (user: AppUser, status: "ativo" | "inativo" | "bloqueado") => {
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status } : u));
    addAudit("Status alterado", `Usuário ${user.name} → ${userStatusConfig[status].label}`);
    toast({ title: "Status atualizado", description: `${user.name} → ${userStatusConfig[status].label}` });
  };

  const handleResetPassword = (user: AppUser) => {
    addAudit("Senha redefinida", `Senha de ${user.name} redefinida`);
    toast({ title: "Senha redefinida", description: `Link de redefinição enviado para ${user.email}` });
  };

  // ─── Roles ────
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const handleSaveRole = (role: Role) => {
    const exists = roles.find((r) => r.id === role.id);
    if (exists) {
      setRoles((prev) => prev.map((r) => r.id === role.id ? role : r));
      addAudit("Cargo editado", `Cargo ${role.name} atualizado`);
    } else {
      setRoles((prev) => [...prev, role]);
      addAudit("Cargo criado", `Cargo ${role.name} criado`);
    }
    toast({ title: exists ? "Cargo atualizado" : "Cargo criado", description: role.name });
  };

  const handleDuplicateRole = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: crypto.randomUUID(),
      name: `${role.name} (cópia)`,
      permissions: { ...role.permissions },
      isSystem: false,
      usersCount: 0,
    };
    setRoles((prev) => [...prev, newRole]);
    addAudit("Perfil duplicado", `Cargo ${role.name} duplicado como ${newRole.name}`);
    toast({ title: "Perfil duplicado", description: newRole.name });
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) return;
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    addAudit("Cargo excluído", `Cargo ${role.name} removido`);
    toast({ title: "Cargo removido", description: role.name });
  };

  const handleViewPermissions = (user: AppUser) => {
    setViewPermsUser(user);
    setViewPermsOpen(true);
  };

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;
  const getRolePermissions = (roleId: string) => roles.find((r) => r.id === roleId)?.permissions || {};

  const permCount = (roleId: string) => {
    const perms = getRolePermissions(roleId);
    return Object.values(perms).filter(Boolean).length;
  };

  const totalPermsCount = Object.keys(buildFullAccess()).length;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "users", label: "Usuários", icon: Users },
    { key: "roles", label: "Cargos e Perfis", icon: Shield },
    { key: "audit", label: "Auditoria", icon: History },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Usuários e Permissões</h1>
          <p className="text-sm text-white/50 mt-1">
            {users.filter((u) => u.status === "ativo").length} ativos · {roles.length} cargos · {audit.length} registros de auditoria
          </p>
        </div>
        <div>
          {tab === "users" && (
            <Button onClick={() => { setEditingUser(null); setUserFormOpen(true); }} className="gradient-primary border-0 text-white font-semibold rounded-full px-5 gap-2">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          )}
          {tab === "roles" && (
            <Button onClick={() => { setEditingRole(null); setRoleFormOpen(true); }} className="gradient-primary border-0 text-white font-semibold rounded-full px-5 gap-2">
              <Plus className="h-4 w-4" /> Novo Cargo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
        {/* ─── USERS TAB ─── */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Buscar usuário..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs placeholder:text-white/30"
              />
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Usuário</th>
                    <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Cargo</th>
                    <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Departamento</th>
                    <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                    <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Permissões</th>
                    <th className="text-left p-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Último Acesso</th>
                    <th className="p-3.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const st = userStatusConfig[user.status];
                    const pc = permCount(user.roleId);
                    return (
                      <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-[11px] text-white/40">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-xs text-white/60">{getRoleName(user.roleId)}</td>
                        <td className="p-3.5 text-xs text-white/50">{user.department}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleViewPermissions(user)}
                            className="text-[10px] text-white/30 hover:text-primary transition-colors font-mono"
                          >
                            {pc}/{totalPermsCount}
                          </button>
                        </td>
                        <td className="p-3.5 text-xs text-white/40 font-mono">
                          {user.lastAccess
                            ? new Date(user.lastAccess).toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="p-3.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/[0.06]">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#271c1d] border-white/[0.1] text-white" align="end">
                              <DropdownMenuItem onClick={() => { setEditingUser(user); setUserFormOpen(true); }} className="text-xs focus:bg-white/[0.06]">
                                <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewPermissions(user)} className="text-xs focus:bg-white/[0.06]">
                                <Eye className="h-3.5 w-3.5 mr-2" /> Ver Permissões
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)} className="text-xs focus:bg-white/[0.06]">
                                <KeyRound className="h-3.5 w-3.5 mr-2" /> Redefinir Senha
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/[0.06]" />
                              {user.status === "ativo" ? (
                                <>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(user, "inativo")} className="text-xs focus:bg-white/[0.06]">
                                    <Unlock className="h-3.5 w-3.5 mr-2" /> Desativar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(user, "bloqueado")} className="text-xs text-red-400 focus:bg-white/[0.06] focus:text-red-400">
                                    <Lock className="h-3.5 w-3.5 mr-2" /> Bloquear
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleStatus(user, "ativo")} className="text-xs text-emerald-400 focus:bg-white/[0.06] focus:text-emerald-400">
                                  <Unlock className="h-3.5 w-3.5 mr-2" /> Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-white/[0.06]" />
                              <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-xs text-red-400 focus:bg-white/[0.06] focus:text-red-400">
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ROLES TAB ─── */}
        {tab === "roles" && (
          <div className="space-y-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Buscar cargo..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-8 bg-white/[0.05] border-white/[0.1] rounded-lg h-8 text-xs placeholder:text-white/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredRoles.map((role) => {
                const pc = Object.values(role.permissions).filter(Boolean).length;
                return (
                  <div key={role.id} className="glass-card rounded-xl p-4 hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          {role.name}
                          {role.isSystem && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Sistema</span>}
                        </h3>
                        <p className="text-[11px] text-white/40 mt-0.5">{role.description}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#271c1d] border-white/[0.1] text-white" align="end">
                          <DropdownMenuItem onClick={() => { setEditingRole(role); setRoleFormOpen(true); }} className="text-xs focus:bg-white/[0.06]">
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateRole(role)} className="text-xs focus:bg-white/[0.06]">
                            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <>
                              <DropdownMenuSeparator className="bg-white/[0.06]" />
                              <DropdownMenuItem onClick={() => handleDeleteRole(role)} className="text-xs text-red-400 focus:bg-white/[0.06] focus:text-red-400">
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-white/30">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {users.filter((u) => u.roleId === role.id).length} usuário(s)
                      </span>
                      <span className="font-mono">{pc}/{totalPermsCount} permissões</span>
                    </div>

                    {/* Mini progress */}
                    <div className="mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-all"
                        style={{ width: `${(pc / totalPermsCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── AUDIT TAB ─── */}
        {tab === "audit" && <AuditLog entries={audit} />}
      </motion.div>

      {/* ─── DIALOGS ─── */}
      <UserFormDialog
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        user={editingUser}
        roles={roles}
        onSave={handleSaveUser}
      />

      <RoleFormDialog
        open={roleFormOpen}
        onOpenChange={setRoleFormOpen}
        role={editingRole}
        onSave={handleSaveRole}
      />

      {/* View user permissions */}
      <Dialog open={viewPermsOpen} onOpenChange={setViewPermsOpen}>
        <DialogContent className="bg-[#1e1516] border-white/[0.1] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              Permissões — {viewPermsUser?.name}
            </DialogTitle>
            <p className="text-xs text-white/40">Cargo: {viewPermsUser && getRoleName(viewPermsUser.roleId)}</p>
          </DialogHeader>
          {viewPermsUser && (
            <PermissionMatrix
              permissions={getRolePermissions(viewPermsUser.roleId)}
              onChange={() => {}}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
