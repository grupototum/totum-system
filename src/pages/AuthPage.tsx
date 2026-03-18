import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logoRed from "@/assets/logo-red.png";
import { Mail, Lock, Eye, EyeOff, Loader2, Clock, User } from "lucide-react";

export default function AuthPage() {
  const { isPending } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(isPending);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setShowPendingMessage(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    }
    // If user is pending, useAuth will sign them out and set isPending
    // We detect this via a small delay
    setTimeout(() => {
      // Check if we got signed out due to pending status
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session && !error) {
          setShowPendingMessage(true);
        }
      });
    }, 1500);
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } else {
      setShowPendingMessage(true);
      // Sign out immediately since user is pending
      await supabase.auth.signOut();
      setMode("login");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada." });
      setMode("login");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Erro", description: String(result.error), variant: "destructive" });
    }
    setLoading(false);
  };

  const inputCls = "bg-white/[0.05] border-white/[0.1] rounded-xl h-11 text-sm pl-10 focus:border-primary/50 focus:ring-primary/20";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src={logoRed} alt="Totum" className="h-10" />
          <p className="text-sm text-white/40">
            {mode === "login" ? "Acesse sua conta" : mode === "signup" ? "Criar nova conta" : "Recuperar senha"}
          </p>
        </div>

        {/* Pending approval message */}
        {showPendingMessage && (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-amber-500/20 bg-amber-500/[0.05]">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="font-heading font-semibold text-amber-200">Aguardando Aprovação</h3>
            <p className="text-sm text-white/50">
              Seu cadastro foi realizado com sucesso. O administrador precisa aprovar seu acesso antes que você possa utilizar o sistema.
            </p>
            <Button
              variant="ghost"
              onClick={() => setShowPendingMessage(false)}
              className="text-xs text-white/40 hover:text-white"
            >
              Voltar ao login
            </Button>
          </div>
        )}

        {!showPendingMessage && (
          <>
            <div className="glass-card rounded-2xl p-6 space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo"
                    className={inputCls}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
              </div>

              {mode !== "forgot" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className={inputCls}
                    onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {mode === "login" && (
                <button onClick={() => setMode("forgot")} className="text-xs text-primary/70 hover:text-primary">
                  Esqueceu a senha?
                </button>
              )}

              <Button
                onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword}
                disabled={loading}
                className="w-full gradient-primary border-0 text-white font-semibold rounded-xl h-11"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Enviar Link"}
              </Button>

              {mode !== "forgot" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.08]" />
                    <span className="text-[10px] text-white/20 uppercase">ou</span>
                    <div className="flex-1 h-px bg-white/[0.08]" />
                  </div>
                  <Button onClick={handleGoogleLogin} variant="outline" disabled={loading} className="w-full border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-xl h-11">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Entrar com Google
                  </Button>
                </>
              )}
            </div>

            <p className="text-center text-xs text-white/30">
              {mode === "login" ? (
                <>Não tem conta? <button onClick={() => setMode("signup")} className="text-primary/70 hover:text-primary">Criar conta</button></>
              ) : (
                <>Já tem conta? <button onClick={() => setMode("login")} className="text-primary/70 hover:text-primary">Entrar</button></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
