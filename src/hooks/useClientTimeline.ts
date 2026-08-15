import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoClientObservations, demoProfilesList } from "@/data/demoData";

export interface TimelineEntry {
  id: string;
  type: "observation" | "audit";
  content: string;
  userName: string;
  createdAt: string;
}

export function useClientTimeline(clientId: string) {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      const profileMap = new Map((demoProfilesList as any[]).map((p) => [p.user_id, p.full_name]));
      const obs = (demoClientObservations as any[])
        .filter((o) => o.client_id === clientId)
        .map((o) => ({
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
        supabase.from("client_observations").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
        supabase.from("audit_logs").select("*").eq("entity_type", "client").eq("entity_id", clientId).order("created_at", { ascending: false }).limit(50),
      ]);

      if (obsError) throw obsError;
      if (auditError) throw auditError;

      let profileQuery = supabase.from("profiles").select("user_id, full_name");
      if (tenant?.organization_id) profileQuery = profileQuery.eq("organization_id", tenant.organization_id);
      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      const obsEntries: TimelineEntry[] = (obs || []).map((o: any) => ({
        id: o.id,
        type: "observation",
        content: o.content,
        userName: profileMap.get(o.user_id) || "Usuário",
        createdAt: o.created_at,
      }));

      const auditEntries: TimelineEntry[] = (audits || []).map((a: any) => ({
        id: a.id,
        type: "audit",
        content: [a.action, a.detail].filter(Boolean).join(" — "),
        userName: profileMap.get(a.user_id) || "Sistema",
        createdAt: a.created_at,
      }));

      const all = [...obsEntries, ...auditEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(all);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar timeline");
    } finally {
      setLoading(false);
    }
  }, [clientId, isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const addObservation = async (content: string, userId: string) => {
    if (isDemoMode) {
      toast({ title: "Modo Demo", description: "Ação simulada." });
      return true;
    }
    const { error } = await supabase.from("client_observations").insert({
      client_id: clientId,
      user_id: userId,
      content,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { entries, loading, error, addObservation, refetch: fetch };
}
