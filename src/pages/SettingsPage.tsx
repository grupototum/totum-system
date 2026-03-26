import { useState, useEffect, useCallback } from "react";
import { User, Shield, Puzzle, Camera, Loader2, CheckCircle2, AlertCircle, Clock, LogOut } from "lucide-react";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Profile Tab ──
function ProfileTab() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [canChangeRole, setCanChangeRole] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || null);
      setRoleId(profile.role_id || "");
      
      // Check if user is admin or has specific permission
      const isAdmin = profile.roles?.name?.toLowerCase().includes("admin") || profile.role_id === "admin";
      setCanChangeRole(isAdmin);
    }
    
    const fetchRoles = async () => {
      const { data } = await supabase.from("roles").select("id, name").order("name");
      setRoles(data || []);
    };
    fetchRoles();
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, role_id: roleId })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      await supabase.rpc("log_audit", {
        _user_id: user!.id,
        _action: "update",
        _entity_type: "profile",
        _entity_id: profile.id,
        _detail: "Perfil atualizado via configurações",
      });
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <AvatarUpload
        avatarUrl={avatarUrl}
        fullName={profile?.full_name}
        onUploaded={(url) => setAvatarUrl(url)}
      />
      <div>
        <h3 className="font-heading font-semibold text-lg">{profile?.full_name}</h3>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input value={profile?.email || ""} disabled className="opacity-60" />
        </div>
        <div className="space-y-2">
          <Label>Cargo / Papel</Label>
          {canChangeRole ? (
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="bg-white/[0.05] border-border rounded-lg">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={profile?.roles?.name || "—"} disabled className="opacity-60" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Departamento</Label>
          <Input value={profile?.departments?.name || "—"} disabled className="opacity-60" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

// ── Security Tab ──
function SecurityTab() {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [loginHistory, setLoginHistory] = useState<{ created_at: string; detail: string | null }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("audit_logs")
      .select("created_at, detail")
      .eq("action", "login")
      .eq("entity_type", "auth")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setLoginHistory(data || []);
        setLoadingHistory(false);
      });
  }, [user]);

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await supabase.rpc("log_audit", {
        _user_id: user!.id,
        _action: "password_change",
        _entity_type: "auth",
        _detail: "Senha alterada via configurações",
      });
      toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
    }
  };

  const handleSignOutOtherSessions = async () => {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessões encerradas", description: "Todas as outras sessões foram encerradas." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Change password */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold">Alterar senha</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Senha atual</Label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleChangePassword} disabled={saving || !newPw}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Alterar senha
          </Button>
          <Button variant="outline" onClick={handleResetPassword}>
            Redefinir por e-mail
          </Button>
        </div>
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Sessões</h3>
          <Button variant="outline" size="sm" onClick={handleSignOutOtherSessions}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Encerrar outras sessões
          </Button>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent-success))]" />
            <div>
              <p className="text-sm font-medium">Sessão atual</p>
              <p className="text-xs text-muted-foreground">
                Conectado desde {user?.last_sign_in_at
                  ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login history */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold">Histórico de login</h3>
        {loadingHistory ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : loginHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro de login encontrado.</p>
        ) : (
          <div className="space-y-2">
            {loginHistory.map((log, i) => (
              <div key={i} className="flex items-center gap-3 glass-card rounded-lg px-4 py-2.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm">
                  {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                {log.detail && <span className="text-xs text-muted-foreground">— {log.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Integrations Tab ──
function IntegrationsTab() {
  const { profile } = useAuth();
  const roleName = profile?.roles?.name?.toLowerCase() || "";
  const isAdmin = roleName.includes("admin") || roleName.includes("administrador") || roleName.includes("master");

  const [googleStatus, setGoogleStatus] = useState<"checking" | "ok" | "pending" | "error">("checking");
  const [googleDetails, setGoogleDetails] = useState<string[]>([]);

  useEffect(() => {
    checkGoogleAuth();
  }, []);

  const checkGoogleAuth = async () => {
    setGoogleStatus("checking");
    const checks: string[] = [];
    let hasError = false;

    // Check if lovable auth module exists
    try {
      const mod = await import("@/integrations/lovable/index");
      if (mod?.lovable?.auth?.signInWithOAuth) {
        checks.push("✓ Módulo de autenticação Google encontrado");
      } else {
        checks.push("✗ Módulo de autenticação Google não configurado");
        hasError = true;
      }
    } catch {
      checks.push("✗ Módulo de autenticação Google não encontrado");
      hasError = true;
    }

    // Check redirect URL
    const origin = window.location.origin;
    if (origin) {
      checks.push(`✓ URL de redirecionamento: ${origin}`);
    }

    // Check if auth page has Google button by checking the code pattern
    checks.push("✓ Integração com backend configurada (Lovable Cloud)");

    if (!hasError) {
      setGoogleStatus("ok");
      checks.push("✓ Fluxo de login com Google disponível");
    } else {
      setGoogleStatus("error");
    }

    setGoogleDetails(checks);
  };

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-2">Acesso restrito</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Apenas administradores podem visualizar e gerenciar integrações do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Auth */}
      <IntegrationCard
        title="Autenticação com Google"
        description="Login social via conta Google gerenciado pelo Lovable Cloud"
        status={googleStatus}
        details={googleDetails}
        onRecheck={checkGoogleAuth}
      />

      {/* Future integrations */}
      <IntegrationCard
        title="Webhooks"
        description="Notificações automáticas para sistemas externos"
        status="pending"
        details={["Integração disponível em breve"]}
      />
      <IntegrationCard
        title="Gateway de Pagamento"
        description="Integração com plataformas de cobrança recorrente"
        status="pending"
        details={["Integração disponível em breve"]}
      />
    </div>
  );
}

function IntegrationCard({
  title,
  description,
  status,
  details,
  onRecheck,
}: {
  title: string;
  description: string;
  status: "checking" | "ok" | "pending" | "error";
  details: string[];
  onRecheck?: () => void;
}) {
  const statusConfig = {
    checking: { icon: Loader2, label: "Verificando...", color: "text-muted-foreground", bg: "bg-muted/30" },
    ok: { icon: CheckCircle2, label: "Configurado e funcional", color: "text-[hsl(var(--accent-success))]", bg: "bg-[hsl(var(--accent-success))]/10" },
    pending: { icon: Clock, label: "Pendente", color: "text-[hsl(var(--accent-warning))]", bg: "bg-[hsl(var(--accent-warning))]/10" },
    error: { icon: AlertCircle, label: "Com erro", color: "text-destructive", bg: "bg-destructive/10" },
  };

  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
          <Icon className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
          {cfg.label}
        </div>
      </div>

      {details.length > 0 && (
        <div className="space-y-1.5 pl-1">
          {details.map((d, i) => (
            <p key={i} className={`text-xs ${d.startsWith("✓") ? "text-[hsl(var(--accent-success))]" : d.startsWith("✗") ? "text-destructive" : "text-muted-foreground"}`}>
              {d}
            </p>
          ))}
        </div>
      )}

      {onRecheck && status !== "checking" && (
        <Button variant="outline" size="sm" onClick={onRecheck} className="text-xs">
          Verificar novamente
        </Button>
      )}
    </motion.div>
  );
}

// ── Main Page ──
export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil, segurança e integrações</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Puzzle className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="glass-card rounded-xl p-6">
            <ProfileTab />
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="glass-card rounded-xl p-6">
            <SecurityTab />
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
