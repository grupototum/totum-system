import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProvisionSubdomain } from "@/hooks/useProvisionSubdomain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
const logoWhite = "/logo-white.png";
const logoRed = "/logo-red.png";
import {
  User,
  Building2,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const BASE_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN ?? "pixelsystem.online";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export default function NovaAgenciaPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const logo = isDark ? logoWhite : logoRed;

  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [checkingMaster, setCheckingMaster] = useState(true);

  // Form fields
  const [responsavel, setResponsavel] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [doneHostname, setDoneHostname] = useState("");

  const { provision, loading: provisioning } = useProvisionSubdomain();

  // Verify master status after session is available
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setCheckingMaster(false);
      return;
    }

    supabase
      .from("profiles")
      .select("is_master")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => {
        setIsMaster(data?.is_master ?? false);
        setCheckingMaster(false);
      });
  }, [session, authLoading]);

  // Auto-fill subdomain from empresa name
  const handleEmpresaChange = (val: string) => {
    setEmpresa(val);
    if (!subdomain || subdomain === slugify(empresa)) {
      setSubdomain(slugify(val));
    }
  };

  const handleSubmit = async () => {
    if (!responsavel || !empresa || !subdomain || !email || !senha) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (senha.length < 8) {
      toast({ title: "Senha deve ter ao menos 8 caracteres", variant: "destructive" });
      return;
    }

    const orgSlug = slugify(subdomain);

    const result = await provision({
      subdomain: orgSlug,
      org_name: empresa,
      org_slug: orgSlug,
      initial_users: [
        {
          email,
          password: senha,
          full_name: responsavel,
        },
      ],
    });

    if (!result.success) {
      toast({
        title: "Erro ao criar agência",
        description: result.error ?? "Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setDoneHostname(result.hostname ?? `${orgSlug}.${BASE_DOMAIN}`);
    setDone(true);
    toast({
      title: "Agência criada com sucesso! 🎉",
      description: result.message,
    });
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (authLoading || checkingMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Not logged in ─────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-sm text-center space-y-6">
          <img src={logo} alt="Totum" className="h-8 mx-auto" />
          <div>
            <h1 className="text-xl font-semibold">Acesso restrito</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Faça login com a conta master para cadastrar uma nova agência.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/login">Fazer login</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao início
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ─── Logged in but not master ───────────────────────────────────────────────
  if (isMaster === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-sm text-center space-y-6">
          <img src={logo} alt="Totum" className="h-8 mx-auto" />
          <div>
            <h1 className="text-xl font-semibold">Sem permissão</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Apenas o usuário master pode cadastrar novas agências.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao início
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Agência criada! 🎉</h1>
            <p className="text-sm text-muted-foreground mt-2">
              O ambiente <span className="font-medium text-foreground">{empresa}</span> foi provisionado.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">URL de acesso</p>
              <a
                href={`https://${doneHostname}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline break-all"
              >
                https://{doneHostname}
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Login: <span className="text-foreground">{email}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setDone(false);
                setResponsavel("");
                setEmpresa("");
                setSubdomain("");
                setEmail("");
                setSenha("");
              }}
              variant="outline"
              className="w-full"
            >
              Cadastrar outra agência
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main form ─────────────────────────────────────────────────────────────
  const inputCls =
    "bg-secondary border-border rounded-xl h-11 text-sm pl-10 focus:border-primary/50 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link to="/">
            <img src={logo} alt="Totum System" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Cadastrar novo cliente</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados para criar o tenant.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            {/* Nome do responsável */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome do responsável</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="João Silva"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className={inputCls}
                  disabled={provisioning}
                />
              </div>
            </div>

            {/* Nome da empresa */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome da empresa</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Acme Soluções"
                  value={empresa}
                  onChange={(e) => handleEmpresaChange(e.target.value)}
                  className={inputCls}
                  disabled={provisioning}
                />
              </div>
            </div>

            {/* Subdomínio */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subdomínio</label>
              <div className="relative flex items-center">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="acme"
                  value={subdomain}
                  onChange={(e) => setSubdomain(slugify(e.target.value))}
                  className={`${inputCls} pr-32`}
                  disabled={provisioning}
                />
                <span className="absolute right-3 text-xs text-muted-foreground pointer-events-none">
                  .{BASE_DOMAIN}
                </span>
              </div>
              {subdomain && (
                <p className="text-xs text-muted-foreground pl-1">
                  URL:{" "}
                  <span className="text-primary font-medium">
                    {subdomain}.{BASE_DOMAIN}
                  </span>
                </p>
              )}
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type="email"
                  placeholder="joao@acme.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  disabled={provisioning}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`${inputCls} pr-10`}
                  disabled={provisioning}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={provisioning}
              className="w-full h-11 font-semibold rounded-xl mt-2"
            >
              {provisioning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando ambiente…
                </>
              ) : (
                "Criar conta do cliente"
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Logado como{" "}
            <span className="text-foreground font-medium">{session?.user?.email}</span>
            {" · "}
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
              className="text-primary hover:underline"
            >
              Sair
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
