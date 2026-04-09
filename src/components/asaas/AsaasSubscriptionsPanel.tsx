import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAsaasConfig,
  useAsaasSubscriptions,
  useDeleteAsaasSubscription,
  formatAsaasStatus,
  formatCycle,
} from "@/hooks/useAsaas";

interface AsaasSubscriptionsPanelProps {
  clientId?: string;
}

export function AsaasSubscriptionsPanel({ clientId }: AsaasSubscriptionsPanelProps) {
  const { data: config } = useAsaasConfig();
  const { data: subscriptions, isLoading } = useAsaasSubscriptions(clientId);
  const deleteSub = useDeleteAsaasSubscription();

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  if (!subscriptions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <RotateCcw className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Nenhuma assinatura encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(subscriptions as any[]).map((sub: any, i: number) => {
        const statusInfo = formatAsaasStatus(sub.status);
        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-lg p-3.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {sub.description || `Assinatura #${(sub.asaas_subscription_id || "").slice(-6)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCycle(sub.cycle)} · {fmt(Number(sub.value))}
                {sub.next_due_date && ` · Próx: ${new Date(sub.next_due_date + "T12:00:00").toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
              {sub.status === "ACTIVE" && config?.api_key && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteSub.mutate({ subscriptionId: sub.asaas_subscription_id, apiKey: config.api_key })}
                  disabled={deleteSub.isPending}
                >
                  {deleteSub.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
