import { useState, useEffect, useCallback } from "react";
import { Loader2, FileText, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoContracts } from "@/data/demoData";
import { format } from "date-fns";
import { ContractFormDialog } from "@/components/contracts/ContractFormDialog";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Props { clientId: string; }

const statusCls: Record<string, string> = {
  ativo: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pausado: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  cancelado: "text-red-400 bg-red-500/10 border-red-500/20",
  encerrado: "text-muted-foreground bg-white/5 border-border",
};

export function ClientHubContracts({ clientId }: Props) {
  const { isDemoMode } = useDemo();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setContracts(demoContracts.filter(c => c.client_id === clientId));
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("contracts")
      .select("*, plans(name), contract_types(name)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }, [clientId, isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleUpdate = async (values: any) => {
    if (isDemoMode) {
      setContracts(prev => prev.map(c => c.id === editingContract.id ? { ...c, ...values } : c));
      toast({ title: "Sucesso", description: "Contrato atualizado (Modo Demo)." });
      return true;
    }
    const { error } = await supabase
      .from("contracts")
      .update(values)
      .eq("id", editingContract.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Sucesso", description: "Contrato atualizado com sucesso." });
    fetch();
    return true;
  };

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
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCls[c.status] || statusCls.encerrado}`}>
                    {c.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/40 hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      setEditingContract(c);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Plano</span>
                  <p className="font-medium">{(c.plans as any)?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor</span>
                  <p className="font-medium font-heading">{c.value ? `R$ ${Number(c.value).toLocaleString("pt-BR")}` : "—"}</p>
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
      <ContractFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        editData={editingContract}
      />
    </div>
  );
}
