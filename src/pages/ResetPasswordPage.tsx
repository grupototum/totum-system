import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, CircleAlert, Check } from "lucide-react";

type Stage = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const { tenant } = useTenant();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tenant theming (espelha o AuthPage)
  const hasTenantBg = !!tenant?.bg_color;
  const logoSrc = hasTenantBg
    ? (tenant?.logo_url ?? "/logo-red.png")
    : isDark
      ? (tenant?.logo_url ?? "/logo-red.png")
      : (tenant?.logo_url_light ?? tenant?.logo_url ?? "/logo-red.png");
  const bgStyle = tenant?.bg_color ? { backgroundColor: tenant.bg_color } : undefined;
  const cardClass = tenant?.card_color ? "tenant-card" : "";
  const cardStyle = tenant?.card_color ? { backgroundColor: tenant.card_color } : undefined;

  // Valida o link de recuperação. O Supabase (detectSessionInUrl) troca o
  // token do fragmento por uma sessão e dispara PASSWORD_RECOVERY. Se o link
  // expirou/é inválido, os erros voltam no próprio hash (#error=...).
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("error")) {
      setStage("invalid");
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStage("ready");
    });

    // Fallback: se o hash traz type=recovery, libera o formulário mesmo que o
    // evento já tenha disparado antes da montagem; senão, confere a sessão.
    if (hashParams.get("type") === "recovery") {
      setStage("ready");
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setStage((prev) => (prev === "checking" ? (session ? "ready" : "invalid") : prev));
      });
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 6;

  const handleReset = async () => {
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", description: "Confirme a mesma senha nos dois campos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível redefinir", description: error.message, variant: "destructive" });
      return;
    }
    setStage("done");
    setTimeout(() => navigate("/"), 2600);
  };

  const inputCls = `bg-secondary border-border rounded-xl h-11 text-sm pl-10 focus:border-primary/50 focus:ring-primary/20 text-foreground ${hasTenantBg ? "placeholder:text-white/70" : "placeholder:text-muted-foreground"}`;
  const subtitleCls = `text-sm ${hasTenantBg ? "text-white/60" : "text-muted-foreground"}`;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${hasTenantBg ? "auth-page-bg" : "bg-background"}`}
      style={bgStyle}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src={logoSrc}
            alt={tenant?.display_name ?? "Totum"}
            className="h-12 max-w-[200px] object-contain"
            width={200}
            height={48}
          />
          <p className={subtitleCls}>Redefinir sua senha</p>
        </div>

        {/* Link inválido / expirado */}
        {stage === "invalid" && (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-amber-500/20 bg-amber-500/[0.05]">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <CircleAlert className="h-6 w-6 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            </div>
            <h3 className="font-heading font-semibold text-amber-700 dark:text-amber-200">Link expirado</h3>
            <p className="text-sm text-muted-foreground">
              Este link de redefinição não é mais válido. Peça um novo na tela de login, em
              &nbsp;“Esqueceu a senha?”.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full gradient-primary border-0 text-white font-semibold rounded-xl h-11"
            >
              Voltar ao login
            </Button>
          </div>
        )}

        {/* Sucesso */}
        {stage === "done" && (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-emerald-500/20 bg-emerald-500/[0.05]">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="font-heading font-semibold text-emerald-700 dark:text-emerald-200">Senha redefinida!</h3>
            <p className="text-sm text-muted-foreground">
              Tudo certo. Estamos te levando para o sistema…
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Ir agora
            </Button>
          </div>
        )}

        {/* Formulário */}
        {(stage === "ready" || stage === "checking") && (
          <div className={`glass-card rounded-2xl p-6 space-y-4 ${cardClass}`} style={cardStyle}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary/70" aria-hidden="true" />
              Escolha uma nova senha para sua conta.
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha"
                aria-label="Nova senha"
                autoComplete="new-password"
                disabled={stage === "checking"}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
              <Input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirme a nova senha"
                aria-label="Confirme a nova senha"
                autoComplete="new-password"
                disabled={stage === "checking"}
                className={inputCls}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
              />
            </div>

            {(tooShort || mismatch) && (
              <p className="text-xs text-primary/80">
                {tooShort ? "A senha precisa ter ao menos 6 caracteres." : "As senhas não coincidem."}
              </p>
            )}

            <Button
              onClick={handleReset}
              disabled={loading || stage === "checking" || password.length < 6 || password !== confirm}
              className="w-full gradient-primary border-0 text-white font-semibold rounded-xl h-11"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />}
              Redefinir senha
            </Button>

            <button
              onClick={() => navigate("/login")}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
