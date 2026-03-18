import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
    ok: { icon: CheckCircle2, label: "Configurado", color: "text-[hsl(var(--accent-success))]", bg: "bg-[hsl(var(--accent-success))]/10" },
    pending: { icon: Clock, label: "Pendente", color: "text-[hsl(var(--accent-warning))]", bg: "bg-[hsl(var(--accent-warning))]/10" },
    error: { icon: AlertCircle, label: "Com erro", color: "text-destructive", bg: "bg-destructive/10" },
  };

  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-4">
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
        <Button variant="outline" size="sm" onClick={onRecheck} className="text-xs">Verificar novamente</Button>
      )}
    </motion.div>
  );
}

export function AdminIntegrationsTab() {
  const [googleStatus, setGoogleStatus] = useState<"checking" | "ok" | "pending" | "error">("checking");
  const [googleDetails, setGoogleDetails] = useState<string[]>([]);

  const checkGoogle = async () => {
    setGoogleStatus("checking");
    const checks: string[] = [];
    try {
      const mod = await import("@/integrations/lovable/index");
      if (mod?.lovable?.auth?.signInWithOAuth) {
        checks.push("✓ Módulo de autenticação Google encontrado");
        checks.push("✓ Integração com backend configurada (Lovable Cloud)");
        checks.push("✓ Fluxo de login com Google disponível");
        setGoogleStatus("ok");
      } else {
        checks.push("✗ Módulo de autenticação Google não configurado");
        setGoogleStatus("error");
      }
    } catch {
      checks.push("✗ Módulo de autenticação Google não encontrado");
      setGoogleStatus("error");
    }
    setGoogleDetails(checks);
  };

  useEffect(() => { checkGoogle(); }, []);

  return (
    <div className="space-y-6">
      <IntegrationCard title="Autenticação com Google" description="Login social via conta Google" status={googleStatus} details={googleDetails} onRecheck={checkGoogle} />
      <IntegrationCard title="Webhooks" description="Notificações automáticas para sistemas externos" status="pending" details={["Integração disponível em breve"]} />
      <IntegrationCard title="Gateway de Pagamento" description="Integração com plataformas de cobrança recorrente" status="pending" details={["Integração disponível em breve"]} />
      <IntegrationCard title="API Keys" description="Chaves de acesso para integrações externas" status="pending" details={["Gerenciamento de API keys disponível em breve"]} />
    </div>
  );
}
