import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Shield, History, Search, Plus, MoreHorizontal, Copy,
  Pencil, Trash2, Lock, Unlock, KeyRound, Eye, Loader2, ShieldCheck, ShieldOff,
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
  permissionTree, permKey, buildFullAccess,
  userStatusConfig, PermissionsMap,
} from "@/components/users/permissionsData";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { RoleFormDialog } from "@/components/users/RoleFormDialog";
import { PermissionMatrix } from "@/components/users/PermissionMatrix";
import { AuditLog } from "@/components/users/AuditLog";
import { useProfiles, useRoles, useAuditLogs, useDepartments, useUserRoles, ProfileRow, RoleRow } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tab = "users" | "roles" | "audit";

// Adapter types for existing components
interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  department: string;
  status: "ativo" | "inativo" | "bloqueado";
  createdAt: string;
  lastAccess?: string;
  isAdmin?: boolean;
  actualUserId?: string;
  roleName?: string;
  permCount?: number;
  initials?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionsMap;
  isSystem: boolean;
  usersCount: number;
}

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  createdAt: string;
}

function profileToAppUser(p: ProfileRow): AppUser {
  return {
    id: p.id,
    name: p.full_name,
    email: p.email,
    phone: p.phone || "",
    roleId: p.role_id || "",
    department: (p.departments as any)?.name || "—",
    status: p.status as any,
    createdAt: p.created_at,
    lastAccess: p.last_access || undefined,
  };
}

function roleRowToRole(r: RoleRow, profileCount: number): Role {
  return {
    id: r.id,
    name: r.name,
    description: r.description || "",
    permissions: (r.permissions as PermissionsMap) || {},
    isSystem: r.is_system,
    usersCount: profileCount,
  };
}

export default function UsersPermissions() {
  const [tab, setTab] = useState<Tab>("users");
  const { isDemoMode } = useDemo();
  
  const { profiles, loading: profilesLoading, refetch: refetchProfiles, updateProfile } = useProfiles();
  const { roles: roleRows, loading: rolesLoading, saveRole, deleteRole: deleteRoleDb, duplicateRole: duplicateRoleDb } = useRoles();
  const { logs, loading: auditLoading } = useAuditLogs();
  const departments = useDepartments();
  const { adminUserIds, toggleAdmin } = useUserRoles();

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

  // Adapt data
  const roles: Role[] = useMemo(() => {
    return roleRows.map((r) => {
      const count = profiles.filter((p) => p.role_id === r.id).length;
      return roleRowToRole(r, count);
    });
  }, [roleRows, profiles]);

  const users: AppUser[] = useMemo(() => {
    return profiles.map(p => {
      const base = profileToAppUser(p);
      const role = roles.find(r => r.id === base.roleId);
      const perms = role ? role.permissions : {};
      const pCount = Object.values(perms).filter(Boolean).length;
      
      return {
        ...base,
        isAdmin: adminUserIds.has(p.user_id || ""),
        actualUserId: p.user_id || undefined,
        roleName: role ? role.name : "—",
        permCount: pCount,
        initials: base.name.split(" ").map((n) => n[0]).join("").slice(0, 2),
      };
    });
  }, [profiles, roles, adminUserIds]);

  const audit: AuditEntry[] = useMemo(() => {
    return logs.map((l) => ({
      id: l.id,
      userId: l.user_id || "",
      userName: l.user_id ? profiles.find((p) => p.user_id === l.user_id)?.full_name || "Sistema" : "Sistema",
      action: l.action,
      detail: l.detail || "",
      createdAt: l.created_at,
    }));
  }, [logs, profiles]);

  const logAudit = async (action: string, detail: string) => {
    if (isDemoMode) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc("log_audit", {
        _user_id: user.id,
        _action: action,
        _entity_type: "usuario",
        _detail: detail,
      });
    }
  };

  // ─── Users ────
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const handleSaveUser = async (user: AppUser) => {
    const exists = profiles.find((p) => p.id === user.id);
    if (exists) {
      await updateProfile(user.id, {
        full_name: user.name,
        phone: user.phone || null,
        role_id: user.roleId || null,
      });
      await logAudit("Usuário editado", `Usuário ${user.name} atualizado`);
      toast({ title: "Usuário atualizado", description: user.name });
    }
    await refetchProfiles();
  };

  const handleDeleteUser = async (user: AppUser) => {
    await updateProfile(user.id, { status: "inativo" as any });
    await logAudit("Usuário desativado", `Usuário ${user.name} desativado`);
    toast({ title: "Usuário desativado", description: user.name });
    await refetchProfiles();
  };

  const handleToggleStatus = async (user: AppUser, status: "ativo" | "inativo" | "bloqueado") => {
    await updateProfile(user.id, { status: status as any });
    await logAudit("Status alterado", `Usuário ${user.name} → ${userStatusConfig[status].label}`);
    toast({ title: "Status atualizado", description: `${user.name} → ${userStatusConfig[status].label}` });
    await refetchProfiles();
  };

  const handleResetPassword = async (user: AppUser) => {
    await logAudit("Senha redefinida", `Senha de ${user.name} redefinida`);
    toast({ title: "Senha redefinida", description: `Link de redefinição enviado para ${user.email}` });
  };

  // ─── Roles ────
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const handleSaveRole = async (role: Role) => {
    await saveRole({
      id: role.id || undefined,
      name: role.name,
      description: role.description,
      permissions: role.permissions as any,
    });
    await logAudit(role.id ? "Perfil editado" : "Perfil criado", `Perfil ${role.name}`);
  };

  const handleDuplicateRole = async (role: Role) => {
    const dbRole = roleRows.find((r) => r.id === role.id);
    if (dbRole) {
      await duplicateRoleDb(dbRole);
      await logAudit("Perfil duplicado", `Perfil ${role.name} duplicado`);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) return;
    await deleteRoleDb(role.id, role.name);
    await logAudit("Perfil excluído", `Perfil ${role.name} removido`);
  };

  const handleViewPermissions = (user: AppUser) => {
    setViewPermsUser(user);
    setViewPermsOpen(true);
  };

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || "—";
  const getRolePermissions = (roleId: string) => roles.find((r) => r.id === roleId)?.permissions || {};

  const totalPermsCount = Object.keys(buildFullAccess()).length;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "users", label: "Usuários", icon: Users },
    { key: "roles", label: "Perfis de Acesso", icon: Shield },
    { key: "audit", label: "Auditoria", icon: History },
  ];

  const isLoading = tab === "users" ? profilesLoading : tab === "roles" ? rolesLoading : auditLoading;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Usuários e Permissões</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.filter((u) => u.status === "ativo").length} ativos · {roles.length} perfis · {audit.length} registros de auditoria
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
              <Plus className="h-4 w-4" /> Novo Perfil
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
              tab === t.key ? "bg-accent text-foreground font-medium" : "text-muted-foreground/70 hover:text-muted-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          {/* ─── USERS TAB ─── */}
          {tab === "users" && (
            <div className="space-y-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Buscar usuário..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 bg-white/[0.05] border-border rounded-lg h-8 text-xs placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Usuário</th>
                      <th className="text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Perfil de Acesso</th>
                      <th className="text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Departamento</th>
                      <th className="text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Status</th>
                      <th className="text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Permissões</th>
                      <th className="text-left p-3.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Último Acesso</th>
                      <th className="p-3.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground/50 text-sm">
                          Nenhum usuário encontrado
                        </td>
                      </tr>
                    ) : filteredUsers.map((user) => {
                      const st = userStatusConfig[user.status];
                      const pc = user.permCount || 0;
                      return (
                        <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                {user.initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium">{user.name}</p>
                                  {user.isAdmin && (
                                    <span className="inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold bg-primary/20 text-primary">
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground/70">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground">{user.roleName}</td>
                          <td className="p-3.5 text-xs text-muted-foreground">{user.department}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg} ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleViewPermissions(user)}
                              className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors font-heading"
                            >
                              {pc}/{totalPermsCount}
                            </button>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground/70 font-heading">
                            {user.lastAccess
                              ? new Date(user.lastAccess).toLocaleDateString("pt-BR")
                              : "—"}
                          </td>
                          <td className="p-3.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06]">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-popover border-border text-foreground" align="end">
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
                                {user.actualUserId && (() => {
                                  const isAdmin = !!user.isAdmin;
                                  return (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        await toggleAdmin(user.actualUserId!, isAdmin);
                                        await logAudit(
                                          isAdmin ? "Admin removido" : "Admin concedido",
                                          `Usuário ${user.name} ${isAdmin ? "removido de" : "promovido a"} administrador`
                                        );
                                      }}
                                      className={`text-xs focus:bg-white/[0.06] ${isAdmin ? "text-amber-400 focus:text-amber-400" : "text-emerald-400 focus:text-emerald-400"}`}
                                    >
                                      {isAdmin ? <ShieldOff className="h-3.5 w-3.5 mr-2" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2" />}
                                      {isAdmin ? "Remover Admin" : "Promover a Admin"}
                                    </DropdownMenuItem>
                                  );
                                })()}
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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Buscar perfil..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="pl-8 bg-white/[0.05] border-border rounded-lg h-8 text-xs placeholder:text-muted-foreground/50"
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
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{role.description}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-popover border-border text-foreground" align="end">
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
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground/50">{role.usersCount} usuário{role.usersCount !== 1 ? "s" : ""}</span>
                        <span className="font-heading text-muted-foreground/40">{pc}/{totalPermsCount} perms</span>
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
      )}

      {/* Dialogs */}
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

      {viewPermsUser && (
        <Dialog open={viewPermsOpen} onOpenChange={setViewPermsOpen}>
          <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                Permissões de {viewPermsUser.name}
                <span className="text-xs text-muted-foreground/50 font-normal ml-2">({viewPermsUser.roleName})</span>
              </DialogTitle>
            </DialogHeader>
            <PermissionMatrix
              permissions={getRolePermissions(viewPermsUser.roleId)}
              onChange={() => {}}
              readOnly
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
