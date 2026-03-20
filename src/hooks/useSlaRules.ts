import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SlaRule {
  id: string;
  name: string;
  priority: string;
  max_response_minutes: number;
  max_resolution_minutes: number;
  conditions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSlaRules() {
  const [slaRules, setSlaRules] = useState<SlaRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlaRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("sla_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSlaRules(data || []);
    } catch (err: any) {
      console.error("Error fetching SLA rules:", err);
      toast({ title: "Erro ao carregar SLAs", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlaRules();
  }, [fetchSlaRules]);

  const saveSlaRule = async (rule: {
    id?: string;
    name: string;
    priority: string;
    max_response_minutes: number;
    max_resolution_minutes: number;
    conditions: Record<string, any>;
    is_active: boolean;
  }) => {
    try {
      if (rule.id) {
        const { error } = await (supabase as any).from("sla_rules").update({
          name: rule.name,
          priority: rule.priority,
          max_response_minutes: rule.max_response_minutes,
          max_resolution_minutes: rule.max_resolution_minutes,
          conditions: rule.conditions,
          is_active: rule.is_active,
        }).eq("id", rule.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("sla_rules").insert({
          name: rule.name,
          priority: rule.priority,
          max_response_minutes: rule.max_response_minutes,
          max_resolution_minutes: rule.max_resolution_minutes,
          conditions: rule.conditions,
          is_active: rule.is_active,
        });
        if (error) throw error;
      }

      toast({ title: rule.id ? "SLA atualizado" : "SLA criado", description: `"${rule.name}" salvo com sucesso.` });
      await fetchSlaRules();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao salvar SLA", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteSlaRule = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("sla_rules").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "SLA excluído" });
      await fetchSlaRules();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { slaRules, loading, saveSlaRule, deleteSlaRule, refetch: fetchSlaRules };
}
