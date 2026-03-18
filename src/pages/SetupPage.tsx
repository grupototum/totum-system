import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import logoRed from "@/assets/logo-red.png";
import { Mail, Lock, Eye, EyeOff, Loader2, User, ShieldCheck } from "lucide-react";

export default function SetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    if (!email || !password || !fullName) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin", {
        body: { email, password, full_name: fullName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Administrador criado com sucesso!", description: "Fazendo login..." });

      // Auto-login
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        toast({ title: "Conta criada! Faça login manualmente.", description: loginError.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao criar administrador", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-white/[0.05] border-white/[0.1] rounded-xl h-11 text-sm pl-10 focus:border-primary/50 focus:ring-primary/20";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src={logoRed} alt="Totum" className="h-10" />
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-heading text-lg font-semibold text-foreground">Configuração Inicial</h1>
          <p className="text-sm text-white/40 text-center">
            Nenhum administrador encontrado. Crie o primeiro usuário administrador para começar.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome completo"
              className={inputCls}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email do administrador"
              className={inputCls}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <Input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha (mín. 6 caracteres)"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && handleSetup()}
            />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button
            onClick={handleSetup}
            disabled={loading}
            className="w-full gradient-primary border-0 text-white font-semibold rounded-xl h-11"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Criar Administrador
          </Button>
        </div>

        <p className="text-center text-[10px] text-white/20">
          Este usuário terá acesso total ao sistema.
        </p>
      </div>
    </div>
  );
}
