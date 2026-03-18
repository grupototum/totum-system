import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import logoRed from "@/assets/logo-red.png";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast({ title: "Link inválido", description: "Use o link enviado por email.", variant: "destructive" });
    }
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada", description: "Você pode fazer login agora." });
      navigate("/");
    }
  };

  const inputCls = "bg-white/[0.05] border-white/[0.1] rounded-xl h-11 text-sm pl-10 focus:border-primary/50";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src={logoRed} alt="Totum" className="h-10" />
          <p className="text-sm text-white/40">Redefinir senha</p>
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <Input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={handleReset} disabled={loading} className="w-full gradient-primary border-0 text-white font-semibold rounded-xl h-11">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Redefinir Senha
          </Button>
        </div>
      </div>
    </div>
  );
}
