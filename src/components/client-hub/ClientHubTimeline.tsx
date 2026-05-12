import { useState, useEffect, useCallback } from "react";
import { Loader2, MessageSquare, Send, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoClientObservations, demoProfilesList } from "@/data/demoData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { clientId: string; }

interface TimelineEntry {
  id: string;
  type: "observation" | "audit";
  content: string;
  userName: string;
  createdAt: string;
}

export function ClientHubTimeline({ clientId }: Props) {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newObs, setNewObs] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      const profileMap = new Map(demoProfilesList.map(p => [p.user_id, p.full_name]));
      const obs = demoClientObservations
        .filter(o => o.client_id === clientId)
        .map(o => ({
          id: o.id,
          type: "observation" as const,
          content: o.content,
          userName: profileMap.get(o.user_id) || "Usuário",
          createdAt: o.created_at,
        }));
      setEntries(obs);
      setLoading(false);
      return;
    }

    try {
      const [{ data: obs, error: obsError }, { data: audits, error: auditError }] = await Promise.all([
        supabase
          .from("client_observations")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("entity_type", "client")
          .eq("entity_id", clientId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (obsError) throw obsError;
      if (auditError) throw auditError;

      // Get profiles for user names — scoped to org to prevent cross-tenant leakage
      let profileQuery = supabase.from("profiles").select("user_id, full_name");
      if (tenant?.organization_id) profileQuery = profileQuery.eq("organization_id", tenant.organization_id);
      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      const obsEntries: TimelineEntry[] = (obs || []).map((o: any) => ({
        id: o.id,
        type: "observation" as const,
        content: o.content,
        userName: profileMap.get(o.user_id) || "Usuário",
        createdAt: o.created_at,
      }));

      const auditEntries: TimelineEntry[] = (audits || []).map((a: any) => ({
        id: a.id,
        type: "audit" as const,
        content: `${a.action}${a.detail ? `: ${a.detail}` : ""}`,
        userName: profileMap.get(a.user_id) || "Sistema",
        createdAt: a.created_at,
      }));

      const combined = [...obsEntries, ...auditEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setEntries(combined);
    } catch (err) {
      console.error("[ClientHubTimeline] Erro ao carregar timeline:", err);
      setError("Erro ao carregar o histórico. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [clientId, isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAddObs = async () => {
    if (!newObs.trim()) return;
    if (isDemoMode) {
      toast({ title: "🎭 Modo Demonstração", description: "Observação simulada — nenhuma alteração foi salva." });
      setNewObs("");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("client_observations").insert({
      client_id: clientId,
      user_id: user?.id || "",
      content: newObs.trim(),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setNewObs("");
    await fetch();
    toast({ title: "Observação adicionada" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-12 text-sm text-destructive">
      <AlertCircle className="h-5 w-5" />
      <span>{error}</span>
      <Button variant="ghost" size="sm" onClick={fetch} className="gap-2">
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
