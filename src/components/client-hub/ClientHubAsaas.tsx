import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  CreditCard,
  RefreshCw,
  ExternalLink,
  FileText,
  QrCode,
  Plus,
  UserCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useAsaasConfig,
  useAsaasPaymentsByClient,
  useAsaasCustomerMapping,
  useSyncClientToAsaas,
  formatAsaasStatus,
  formatBillingType,
} from "@/hooks/useAsaas";
import { AsaasSubscriptionsPanel } from "@/components/asaas/AsaasSubscriptionsPanel";
import { useQueryClient } from "@tanstack/react-query";
import { AsaasChargeDialog } from "@/components/asaas/AsaasChargeDialog";

interface ClientHubAsaasProps {
  clientId: string;
  clientName: string;
}

export function ClientHubAsaas({ clientId, clientName }: ClientHubAsaasProps) {
  const { data: config, isLoading: configLoading } = useAsaasConfig();
  const { data: mapping, isLoading: mappingLoading } = useAsaasCustomerMapping(clientId);
  const { data: payments, isLoading: paymentsLoading, refetch } = useAsaasPaymentsByClient(clientId);
  const syncClient = useSyncClientToAsaas();
  const qc = useQueryClient();

  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  const handleSyncClient = async () => {
    if (!config?.api_key) return;
    await syncClient.mutateAsync({ clientId, apiKey: config.api_key });
    qc.invalidateQueries({ queryKey: ["asaas_payments", "client", clientId] });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (configLoading || mappingLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
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

  const totalPending = (payments as any[])?.filter((p: any) => p.status === "PENDING").reduce((s: number, p: any) => s + Number(p.value), 0) || 0;
  const totalReceived = (payments as any[])?.filter((p: any) => ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status)).reduce((s: number, p: any) => s + Number(p.value), 0) || 0;
  const totalOverdue = (payments as any[])?.filter((p: any) => p.status === "OVERDUE").reduce((s: number, p: any) => s + Number(p.value), 0) || 0;

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Cobranças Asaas</h3>
          {(mapping as any)?.asaas_customer_id && (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              <UserCheck className="h-3 w-3 mr-1" /> Sincronizado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!(mapping as any)?.asaas_customer_id ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncClient}
              disabled={syncClient.isPending}
              className="gap-1.5 text-xs"
            >
              {syncClient.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              Sincronizar cliente
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={handleRefresh} className="gap-1.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={() => setChargeDialogOpen(true)}
                className="gradient-primary text-white gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova cobrança
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Resumo financeiro */}
      {payments && payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalReceived)}</p>
          </div>
          <div className="glass-card rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{fmt(totalPending)}</p>
          </div>
          <div className="glass-card rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Vencido</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{fmt(totalOverdue)}</p>
          </div>
        </div>
      )}

      {/* Lista de cobranças */}
      {paymentsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : !payments?.length ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <CreditCard className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {(mapping as any)?.asaas_customer_id
              ? "Nenhuma cobrança encontrada para este cliente."
              : "Sincronize o cliente com o Asaas para ver e criar cobranças."}
          </p>
        </div>
      ) : (
         <div className="space-y-2">
          {(payments as any[])?.map((payment: any, i: number) => {
            const statusInfo = formatAsaasStatus(payment.status);
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
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
                      {payment.description || `Cobrança #${payment.asaas_payment_id.slice(-6)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBillingType(payment.billing_type)} ·{" "}
                      Vence {new Date(payment.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
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

      {/* Diálogo de nova cobrança */}
      <AsaasChargeDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
        clientId={clientId}
        clientName={clientName}
      />
    </div>
  );
}
