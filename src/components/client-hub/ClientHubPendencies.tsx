import { Loader2, AlertTriangle, Clock, Package } from "lucide-react";
import { format } from "date-fns";
import { useClientPendencies } from "@/hooks/useClientPendencies";

interface Props { clientId: string; }

export function ClientHubPendencies({ clientId }: Props) {
  const { lateTasks, incompleteDeliveries, loading } = useClientPendencies(clientId);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const hasIssues = lateTasks.length > 0 || incompleteDeliveries.length > 0;

  return (
    <div className="space-y-6">
      {!hasIssues ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Nenhuma pendência encontrada
        </div>
      ) : (
        <>
          {lateTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-400" />
                Tarefas Atrasadas ({lateTasks.length})
              </h3>
              <div className="space-y-2">
                {lateTasks.map(t => (
                  <div key={t.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {t.due_date ? format(new Date(t.due_date), "dd/MM/yyyy") : "—"} · {t.priority}
                      </p>
                    </div>
                    <span className="text-xs text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incompleteDeliveries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-400" />
                Entregas Incompletas ({incompleteDeliveries.length})
              </h3>
              <div className="space-y-2">
                {incompleteDeliveries.map(d => (
                  <div key={d.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(d.plans as any)?.name || "Sem pacote"}</p>
                      <p className="text-xs text-muted-foreground">{d.period} · {d.frequency}</p>
                    </div>
                    <span className="text-xs text-amber-400 font-heading">{d.fulfillment_pct || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
