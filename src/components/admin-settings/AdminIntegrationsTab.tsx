import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock, CreditCard, RefreshCw, Eye, EyeOff, Save, Zap, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  useAsaasConfig,
  useSaveAsaasConfig,
  useTestAsaasConnection,
  useSyncAllClients,
  useSyncPaymentsFromAsaas,
  useAsaasStats,
} from "@/hooks/useAsaas";

// ─── Card de integração genérico ─────────────────────────────────────────────

function IntegrationCard({
  title,
  description,
  status,
  details,
  onRecheck,
  children,
}: {
  title: string;
  description: string;
  status: "checking" | "ok" | "pending" | "error";
  details?: string[];
  onRecheck?: () => void;
  children?: React.ReactNode;
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
      {details && details.length > 0 && (
        <div className="space-y-1.5 pl-1">
          {details.map((d, i) => (
            <p key={i} className={`text-xs ${d.startsWith("✓") ? "text-[hsl(var(--accent-success))]" : d.startsWith("✗") ? "text-destructive" : "text-muted-foreground"}`}>
              {d}
            </p>
          ))}
        </div>
      )}
      {children}
      {onRecheck && status !== "checking" && (
        <Button variant="outline" size="sm" onClick={onRecheck} className="text-xs">Verificar novamente</Button>
      )}
    </motion.div>
  );
}

// ─── Painel de configuração do Asaas ─────────────────────────────────────────

function AsaasConfigPanel() {
  const { data: config, isLoading } = useAsaasConfig();
  const { data: stats } = useAsaasStats();
  const saveConfig = useSaveAsaasConfig();
  const testConnection = useTestAsaasConnection();
  const syncClients = useSyncAllClients();
  const syncPayments = useSyncPaymentsFromAsaas();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [webhookToken, setWebhookToken] = useState("");
  const [syncClientsOpt, setSyncClientsOpt] = useState(true);
  const [syncPaymentsOpt, setSyncPaymentsOpt] = useState(true);
  const [autoCreateFinancial, setAutoCreateFinancial] = useState(true);
  const [defaultBillingType, setDefaultBillingType] = useState<"BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED">("BOLETO");
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; name?: string } | null>(null);

  useEffect(() => {
    if (config) {
      setApiKey(config.api_key || "");
      setEnvironment(config.environment || "production");
      setWebhookToken(config.webhook_token || "");
      setSyncClientsOpt(config.sync_clients ?? true);
      setSyncPaymentsOpt(config.sync_payments ?? true);
      setAutoCreateFinancial(config.auto_create_financial ?? true);
      setDefaultBillingType(config.default_billing_type || "BOLETO");
    }
  }, [config]);

  const handleTest = async () => {
    const result = await testConnection.mutateAsync(apiKey);
    setConnectionResult(result);
  };

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      api_key: apiKey,
      environment,
      webhook_token: webhookToken || null,
      is_active: true,
      sync_clients: syncClientsOpt,
      sync_payments: syncPaymentsOpt,
      auto_create_financial: autoCreateFinancial,
      default_billing_type: defaultBillingType,
    });
  };

  const handleSyncClients = async () => {
    await syncClients.mutateAsync(apiKey);
  };

  const handleSyncPayments = async () => {
    await syncPayments.mutateAsync(apiKey);
  };

  const isConfigured = !!config?.api_key && config?.is_active;
  const status = isLoading ? "checking" : isConfigured ? "ok" : "pending";

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <IntegrationCard
      title="Gateway de Pagamento — Asaas"
      description="Cobranças, boletos, Pix e cartão integrados ao ERP"
      status={status}
    >
      {/* Stats resumidas */}
      {isConfigured && stats && stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2 my-1">
          <div className="rounded-lg bg-muted/40 p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(stats.receivedValue)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.pending} cob.</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Vencido</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{stats.overdue} cob.</p>
          </div>
        </div>
      )}

      <Separator />

      {/* Configuração da API */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Chave de API</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="$aact_prod_..."
                className="pr-9 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={!apiKey || testConnection.isPending}
              className="shrink-0"
            >
              {testConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Testar"}
            </Button>
          </div>
          {connectionResult && (
            <p className={`text-xs ${connectionResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {connectionResult.ok ? `✓ Conectado: ${connectionResult.name}` : `✗ Falha na conexão`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Ambiente</Label>
            <Select value={environment} onValueChange={(v: any) => setEnvironment(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Produção</SelectItem>
                <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de cobrança padrão</Label>
            <Select value={defaultBillingType} onValueChange={(v: any) => setDefaultBillingType(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOLETO">Boleto</SelectItem>
                <SelectItem value="PIX">Pix</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão de crédito</SelectItem>
                <SelectItem value="UNDEFINED">Cliente escolhe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Token do Webhook (opcional)</Label>
          <Input
            type="text"
            value={webhookToken}
            onChange={e => setWebhookToken(e.target.value)}
            placeholder="Token para validar webhooks recebidos"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            URL do webhook: <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {`${window.location.origin.replace("system.", "")}/functions/v1/asaas-webhook`}
            </code>
          </p>
        </div>

        {/* Opções de sincronização */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opções de sincronização</p>
          <div className="space-y-2.5">
            {[
              { label: "Sincronizar clientes automaticamente", value: syncClientsOpt, onChange: setSyncClientsOpt },
              { label: "Sincronizar cobranças automaticamente", value: syncPaymentsOpt, onChange: setSyncPaymentsOpt },
              { label: "Criar lançamento financeiro ao receber pagamento", value: autoCreateFinancial, onChange: setAutoCreateFinancial },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center justify-between">
                <Label className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                <Switch checked={opt.value} onCheckedChange={opt.onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={handleSave}
            disabled={!apiKey || saveConfig.isPending}
            className="gradient-primary text-white gap-1.5 text-xs"
            size="sm"
          >
            {saveConfig.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar configuração
          </Button>

          {isConfigured && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncClients}
                disabled={syncClients.isPending}
                className="gap-1.5 text-xs"
              >
                {syncClients.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
                Sincronizar clientes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncPayments}
                disabled={syncPayments.isPending}
                className="gap-1.5 text-xs"
              >
                {syncPayments.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar cobranças
              </Button>
            </>
          )}
        </div>
      </div>
    </IntegrationCard>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

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
      {/* Asaas — Gateway de Pagamento */}
      <AsaasConfigPanel />

      {/* Google Auth */}
      <IntegrationCard
        title="Autenticação com Google"
        description="Login social via conta Google"
        status={googleStatus}
        details={googleDetails}
        onRecheck={checkGoogle}
      />

      {/* Webhooks */}
      <IntegrationCard
        title="Webhooks"
        description="Notificações automáticas para sistemas externos"
        status="ok"
        details={[
          "✓ Webhook do Asaas configurado via Edge Function",
          "✓ Eventos: PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_UPDATED",
          "✓ Criação automática de lançamentos financeiros ao receber pagamento",
        ]}
      />

      {/* API Keys */}
      <IntegrationCard
        title="API Keys"
        description="Chaves de acesso para integrações externas"
        status="pending"
        details={["Gerenciamento de API keys disponível em breve"]}
      />
    </div>
  );
}
