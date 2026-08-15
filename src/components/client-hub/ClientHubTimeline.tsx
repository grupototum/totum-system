import { useState } from "react";
import { Loader2, MessageSquare, Send, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClientTimeline } from "@/hooks/useClientTimeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { clientId: string; }

export function ClientHubTimeline({ clientId }: Props) {
  const { user } = useAuth();
  const { entries, loading, error, addObservation, refetch } = useClientTimeline(clientId);
  const [newObs, setNewObs] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddObs = async () => {
    if (!newObs.trim()) return;
    setSaving(true);
    const ok = await addObservation(newObs.trim(), user?.id || "");
    setSaving(false);
    if (ok) {
      setNewObs("");
      toast({ title: "Observação adicionada" });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-12 text-sm text-destructive">
      <AlertCircle className="h-5 w-5" />
      <span>{error}</span>
      <Button variant="ghost" size="sm" onClick={refetch} className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add observation */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Nova Observação
        </h3>
        <Textarea
          value={newObs}
          onChange={e => setNewObs(e.target.value)}
          placeholder="Ex: Cliente pediu alteração no layout, Cliente não respondeu..."
          rows={3}
          className="bg-white/[0.04] border-border resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={handleAddObs} disabled={saving || !newObs.trim()} size="sm" className="gap-2">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Adicionar
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum registro na timeline</div>
        ) : entries.map(entry => (
          <div key={entry.id} className="flex gap-3 py-3 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${entry.type === "observation" ? "bg-primary" : "bg-muted-foreground/50"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{entry.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {entry.userName} · {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
