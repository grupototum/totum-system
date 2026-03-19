import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ProfileRow, RoleRow } from "@/hooks/useProfiles";
import { PermissionMatrix } from "./PermissionMatrix";
import { PermissionsMap, buildEmptyAccess } from "./permissionsData";
import {
  User, Mail, Phone, Shield, Building2, Calendar, Clock,
  Edit2, Save, X, Lock, Unlock, Key, DollarSign, Percent,
  Loader2, History, Trash2,
} from "lucide-react";

interface UserDetailSheetProps {
  profile: ProfileRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleRow[];
  departments: { id: string; name: string }[];
  onRefresh: () => void;
  isAdmin: boolean;
}

type Tab = "resumo" | "acesso" | "financeiro" | "historico";

const statusOptions = [
  { value: "ativo", label: "Ativo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "inativo", label: "Inativo", color: "bg-white/[0.06] text-white/40 border-white/[0.08]" },
  { value: "bloqueado", label: "Bloqueado", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "pendente", label: "Pendente", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
];

const inputCls = "bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-sm focus:border-primary/50";
const selectContentCls = "bg-[#271c1d] border-white/[0.1] text-white";
const selectItemCls = "text-xs focus:bg-white/[0.06] focus:text-white";

export function UserDetailSheet({
  profile, open, onOpenChange, roles, departments, onRefresh, isAdmin,
}: UserDetailSheetProps) {
  const [tab, setTab] = useState<Tab>("resumo");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [permissions, setPermissions] = useState<PermissionsMap>(buildEmptyAccess());
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (profile && open) {
      setForm({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || "",
        role_id: profile.role_id || "",
        department_id: profile.department_id || "",
        status: profile.status,
        salary: (profile as any).salary || "",
        commission_value: (profile as any).commission_value || "",
        commission_type: (profile as any).commission_type || "percentual",
      });
      // Load permissions from role
      const role = roles.find((r) => r.id === profile.role_id);
      if (role?.permissions) {
        setPermissions(role.permissions as PermissionsMap);
      } else {
        setPermissions(buildEmptyAccess());
      }
      setEditing(false);
      setTab("resumo");
    }
  }, [profile, open, roles]);

  // Load audit logs when tab changes
  useEffect(() => {
    if (tab === "historico" && profile) {
      setLogsLoading(true);
      supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "profile")
        .eq("entity_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setAuditLogs(data || []);
          setLogsLoading(false);
        });
    }
  }, [tab, profile]);

  if (!profile) return null;

  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const roleName = (profile.roles as any)?.name || "Sem cargo";
  const deptName = (profile.departments as any)?.name || "Sem departamento";
  const statusCfg = statusOptions.find((s) => s.value === profile.status) || statusOptions[0];

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const updates: Record<string, any> = {
      full_name: form.full_name,
      phone: form.phone || null,
      role_id: form.role_id || null,
      department_id: form.department_id || null,
      status: form.status,
      salary: form.salary ? Number(form.salary) : null,
      commission_value: form.commission_value ? Number(form.commission_value) : null,
      commission_type: form.commission_type || "percentual",
    };

    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Log audit
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "Perfil atualizado",
        entity_type: "profile",
        entity_id: profile.id,
        detail: `Usuário ${form.full_name} atualizado`,
        old_data: {
          full_name: profile.full_name,
          status: profile.status,
          role_id: profile.role_id,
          department_id: profile.department_id,
        },
        new_data: updates,
      });
    }

    toast({ title: "Usuário atualizado", description: form.full_name });
    setSaving(false);
    setEditing(false);
    onRefresh();
  };

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "resumo", label: "Resumo", icon: User },
    { key: "acesso", label: "Acesso", icon: Shield },
    { key: "financeiro", label: "Financeiro", icon: DollarSign },
    { key: "historico", label: "Histórico", icon: History },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#1a1213] border-white/[0.06] text-white w-full sm:max-w-xl overflow-y-auto scrollbar-thin p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="gradient-primary text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-heading font-bold truncate">{profile.full_name}</h2>
              <p className="text-sm text-white/40">{roleName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>
                  {statusCfg.label}
                </Badge>
                <span className="text-[10px] text-white/20">{deptName}</span>
              </div>
            </div>
            {isAdmin && !editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-white/40 hover:text-white">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-white/[0.06] px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumo Tab */}
          {tab === "resumo" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-white/40 uppercase tracking-wider">Nome completo</Label>
                  {editing ? (
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
                  ) : (
                    <p className="text-sm mt-1">{profile.full_name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                    <p className="text-sm mt-1 text-white/70 truncate">{profile.email}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone</Label>
                    {editing ? (
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                    ) : (
                      <p className="text-sm mt-1 text-white/70">{profile.phone || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1"><Shield className="h-3 w-3" /> Cargo</Label>
                    {editing ? (
                      <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className={selectContentCls}>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id} className={selectItemCls}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm mt-1">{roleName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1"><Building2 className="h-3 w-3" /> Departamento</Label>
                    {editing ? (
                      <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className={selectContentCls}>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id} className={selectItemCls}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm mt-1">{deptName}</p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {statusOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value} className={selectItemCls}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator className="bg-white/[0.06]" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1"><Calendar className="h-3 w-3" /> Criado em</Label>
                    <p className="text-xs mt-1 text-white/50">
                      {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Último acesso</Label>
                    <p className="text-xs mt-1 text-white/50">
                      {profile.last_access
                        ? new Date(profile.last_access).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick admin actions */}
              {isAdmin && !editing && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Ações rápidas</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.status === "ativo" ? (
                      <Button size="sm" variant="outline" className="text-xs border-white/[0.1] bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                        onClick={async () => {
                          await supabase.from("profiles").update({ status: "bloqueado" as any }).eq("id", profile.id);
                          toast({ title: "Usuário bloqueado" });
                          onRefresh();
                        }}>
                        <Lock className="h-3 w-3 mr-1" /> Bloquear
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs border-white/[0.1] bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400"
                        onClick={async () => {
                          await supabase.from("profiles").update({ status: "ativo" as any }).eq("id", profile.id);
                          toast({ title: "Usuário ativado" });
                          onRefresh();
                        }}>
                        <Unlock className="h-3 w-3 mr-1" /> Ativar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-xs border-white/[0.1] bg-white/[0.03] hover:bg-primary/10 hover:border-primary/30"
                      onClick={async () => {
                        const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
                        if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
                        else toast({ title: "Email enviado", description: "Link de redefinição enviado para " + profile.email });
                      }}>
                      <Key className="h-3 w-3 mr-1" /> Redefinir Senha
                    </Button>
                    <div className="w-px h-6 bg-white/[0.06] mx-1 self-center" />
                    <Button size="sm" variant="outline" className="text-xs border-white/[0.1] bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                      onClick={async () => {
                        if (!confirm("Tem certeza que deseja excluir/desativar este membro?")) return;
                        await supabase.from("profiles").update({ status: "inativo" as any, role_id: null }).eq("id", profile.id);
                        toast({ title: "Membro excluído" });
                        onOpenChange(false);
                        onRefresh();
                      }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              )}

              {/* Save/Cancel */}
              {editing && (
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setEditing(false)} className="text-white/40 hover:text-white">
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white font-semibold rounded-full px-6">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Acesso Tab */}
          {tab === "acesso" && (
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] text-white/40 uppercase tracking-wider mb-2 block">Perfil de acesso atual</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{roleName}</p>
                    <p className="text-xs text-white/40">
                      {roles.find((r) => r.id === profile.role_id)?.description || "Sem descrição"}
                    </p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div>
                  <Label className="text-[10px] text-white/40 uppercase tracking-wider mb-2 block">Alterar perfil</Label>
                  <Select
                    value={form.role_id || ""}
                    onValueChange={async (v) => {
                      setForm({ ...form, role_id: v });
                      await supabase.from("profiles").update({ role_id: v }).eq("id", profile.id);
                      const roleName = roles.find((r) => r.id === v)?.name;
                      toast({ title: "Cargo alterado", description: `Novo cargo: ${roleName}` });
                      
                      // Audit
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await supabase.from("audit_logs").insert({
                          user_id: user.id, action: "Cargo alterado", entity_type: "profile",
                          entity_id: profile.id, detail: `Cargo alterado para ${roleName}`,
                        });
                      }
                      onRefresh();
                    }}
                  >
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id} className={selectItemCls}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator className="bg-white/[0.06]" />

              <div>
                <Label className="text-[10px] text-white/40 uppercase tracking-wider mb-2 block">Permissões do perfil</Label>
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                  <PermissionMatrix permissions={permissions} onChange={() => {}} readOnly />
                </div>
              </div>
            </div>
          )}

          {/* Financeiro Tab */}
          {tab === "financeiro" && (
            <div className="space-y-4">
              {!isAdmin ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30">
                  <Lock className="h-8 w-8 mb-3" />
                  <p className="text-sm font-medium">Acesso restrito</p>
                  <p className="text-xs mt-1">Apenas administradores podem ver dados financeiros</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3" /> Salário
                    </Label>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                        placeholder="Ex: 5000.00"
                        className={inputCls}
                      />
                    ) : (
                      <p className="text-sm mt-1 font-heading">
                        {(profile as any).salary
                          ? `R$ ${Number((profile as any).salary).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Percent className="h-3 w-3" /> Tipo de Comissão
                      </Label>
                      {editing ? (
                        <Select value={form.commission_type} onValueChange={(v) => setForm({ ...form, commission_type: v })}>
                          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                          <SelectContent className={selectContentCls}>
                            <SelectItem value="percentual" className={selectItemCls}>Percentual (%)</SelectItem>
                            <SelectItem value="fixo" className={selectItemCls}>Valor Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm mt-1 capitalize">{(profile as any).commission_type || "Percentual"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Valor da Comissão</Label>
                      {editing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={form.commission_value}
                          onChange={(e) => setForm({ ...form, commission_value: e.target.value })}
                          placeholder={form.commission_type === "percentual" ? "Ex: 10" : "Ex: 500.00"}
                          className={inputCls}
                        />
                      ) : (
                        <p className="text-sm mt-1 font-heading">
                          {(profile as any).commission_value
                            ? (profile as any).commission_type === "percentual"
                              ? `${(profile as any).commission_value}%`
                              : `R$ ${Number((profile as any).commission_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : "Não informado"}
                        </p>
                      )}
                    </div>
                  </div>

                  {!editing && (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-xs border-white/[0.1] bg-white/[0.03] mt-2">
                      <Edit2 className="h-3 w-3 mr-1" /> Editar dados financeiros
                    </Button>
                  )}

                  {editing && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setEditing(false)} className="text-white/40 hover:text-white">
                        <X className="h-4 w-4 mr-1" /> Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white font-semibold rounded-full px-6">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Histórico Tab */}
          {tab === "historico" && (
            <div className="space-y-3">
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">Nenhum registro de alteração</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{log.action}</span>
                      <span className="text-[10px] text-white/30 font-heading">
                        {new Date(log.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    {log.detail && <p className="text-xs text-white/50">{log.detail}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
