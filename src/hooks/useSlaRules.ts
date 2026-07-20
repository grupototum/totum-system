import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { reportError } from "@/lib/errorHandler";
import { listAllSlaRules, createSlaRule, updateSlaRule, deleteSlaRule as deleteSlaRuleRepo } from "@/data/sla-rules.repo";

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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useSlaRules() {
  const [slaRules, setSlaRules] = useState<SlaRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlaRules = useCallback(async () => {
    setLoading(true);
    try {
      setSlaRules(await listAllSlaRules() as any);
    } catch (err) {
      reportError("Error fetching SLA rules:", err, "sla_rules_list");
      toast({ title: "Erro ao carregar SLAs", description: errorMessage(err), variant: "destructive" });
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
      const payload = {
        name: rule.name,
        priority: rule.priority,
        max_response_minutes: rule.max_response_minutes,
        max_resolution_minutes: rule.max_resolution_minutes,
        conditions: rule.conditions,
        is_active: rule.is_active,
      } as any;

      if (rule.id) {
        await updateSlaRule(rule.id, payload);
      } else {
        await createSlaRule(payload);
      }

      toast({ title: rule.id ? "SLA atualizado" : "SLA criado", description: `"${rule.name}" salvo com sucesso.` });
      await fetchSlaRules();
      return true;
    } catch (err) {
      toast({ title: "Erro ao salvar SLA", description: errorMessage(err), variant: "destructive" });
      return false;
    }
  };

  const deleteSlaRule = async (id: string) => {
    try {
      await deleteSlaRuleRepo(id);
      toast({ title: "SLA excluído" });
      await fetchSlaRules();
      return true;
    } catch (err) {
      toast({ title: "Erro ao excluir", description: errorMessage(err), variant: "destructive" });
      return false;
    }
  };

  return { slaRules, loading, saveSlaRule, deleteSlaRule, refetch: fetchSlaRules };
}
