import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoContracts } from "@/data/demoData";
import { reportError } from "@/lib/errorHandler";
import {
  listContractsWithRelations,
  createContract,
  updateContract as updateContractRepo,
  generateDeliveriesForActivatedContract,
  type ContractRow,
} from "@/data/contracts.repo";

export type { ContractRow };

export function useContracts() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setContracts(demoContracts as ContractRow[]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setContracts(await listContractsWithRelations());
    } catch (err) {
      reportError("Error fetching contracts:", err, "contracts_list");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const addContract = async (values: Partial<Tables<"contracts">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    try {
      await createContract(values, tenant?.organization_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Contrato criado", description: values.title });
    return true;
  };

  const updateContract = async (id: string, values: Partial<Tables<"contracts">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }

    const prevContract = contracts.find(c => c.id === id);
    const isActivating = values.status === 'ativo' && prevContract?.status !== 'ativo';

    try {
      await updateContractRepo(id, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }

    // Auto-generate deliveries when activating a contract with a plan
    const planId = values.plan_id || prevContract?.plan_id;
    if (isActivating && planId) {
      try {
        const count = await generateDeliveriesForActivatedContract({
          contractId: id,
          clientId: prevContract?.client_id as string,
          planId,
          billingFrequency: prevContract?.billing_frequency,
          organizationId: tenant?.organization_id,
        });
        if (count > 0) {
          toast({ title: "🚀 Entregas geradas", description: `${count} itens adicionados ao checklist.` });
        }
      } catch (err) {
        reportError("Erro na automação de entregas:", err, "contract_activation_deliveries");
      }
    }

    await fetch();
    return true;
  };

  return { contracts, loading, refetch: fetch, addContract, updateContract };
}
