import { useState, useEffect, useCallback } from "react";
import { Loader2, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Props { clientId: string; }

const statusCls: Record<string, string> = {
  ativo: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pausado: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  cancelado: "text-red-400 bg-red-500/10 border-red-500/20",
  encerrado: "text-muted-foreground bg-white/5 border-border",
};

export function ClientHubContracts({ clientId }: Props) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contracts")
      .select("*, plans(name), contract_types(name)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {contracts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum contrato vinculado a este cliente</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map(c => (
            <div key={c.id} className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">{(c.contract_types as any)?.name || "Sem tipo"}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCls[c.status] || statusCls.encerrado}`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Plano</span>
                  <p className="font-medium">{(c.plans as any)?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor</span>
                  <p className="font-medium font-mono">{c.value ? `R$ ${Number(c.value).toLocaleString("pt-BR")}` : "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Início</span>
                  <p className="font-medium">{c.start_date ? format(new Date(c.start_date), "dd/MM/yyyy") : "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Término</span>
                  <p className="font-medium">{c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy") : "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
