import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  CreditCard,
  RefreshCw,
  ExternalLink,
  FileText,
  QrCode,
  Search,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useAsaasConfig,
  useAsaasPayments,
  useAsaasStats,
  useSyncPaymentsFromAsaas,
  formatAsaasStatus,
  formatBillingType,
} from "@/hooks/useAsaas";

export function AsaasFinancialPanel() {
  const { data: config, isLoading: configLoading } = useAsaasConfig();
  const { data: stats } = useAsaasStats();
  const { data: payments, isLoading: paymentsLoading, refetch } = useAsaasPayments();
  const syncPayments = useSyncPaymentsFromAsaas();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSync = async () => {
    if (!config?.api_key) return;
    await syncPayments.mutateAsync(config.api_key);
    refetch();
  };

  const filtered = payments?.filter(p => {
    const matchSearch = !search ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      (p as any).clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (configLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;
  }

  if (!config?.is_active) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">Integração Asaas não configurada</p>
        <p className="text-sm text-muted-foreground/70">
          Acesse <strong>Configurações → Integrações</strong> para ativar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Cobranças Asaas</h3>
          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncPayments.isPending}
          className="gap-1.5 text-xs"
        >
          {syncPayments.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Sincronizar
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Recebido
            </div>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{fmt(stats.receivedValue)}</p>
            <p className="text-xs text-muted-foreground">{stats.received} cobranças</p>
          </div>
          <div className="glass-card rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Pendente
            </div>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400">
              {fmt(stats.totalValue - stats.receivedValue)}
            </p>
            <p className="text-xs text-muted-foreground">{stats.pending} cobranças</p>
          </div>
          <div className="glass-card rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              Vencido
            </div>
            <p className="text-base font-bold text-red-600 dark:text-red-400">
              {stats.overdue} cobranças
            </p>
          </div>
          <div className="glass-card rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Total
            </div>
            <p className="text-base font-bold">{fmt(stats.totalValue)}</p>
            <p className="text-xs text-muted-foreground">{stats.total} cobranças</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {[
            { value: "all", label: "Todas" },
            { value: "PENDING", label: "Pendentes" },
            { value: "RECEIVED", label: "Recebidas" },
            { value: "OVERDUE", label: "Vencidas" },
          ].map(f => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className="text-xs h-8"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {paymentsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <CreditCard className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma cobrança encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((payment, i) => {
            const statusInfo = formatAsaasStatus(payment.status);
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass-card rounded-lg p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-muted/60">
                    {payment.billing_type === "PIX" ? (
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {(payment as any).clients?.name || "Cliente não vinculado"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {payment.description || `Cobrança #${payment.asaas_payment_id?.slice(-6)}`}
                      {" · "}{formatBillingType(payment.billing_type)}
                      {" · "}Vence {new Date(payment.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {fmt(Number(payment.value))}
                    </p>
                    <p className={`text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </p>
                  </div>
                  {payment.invoice_url && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
