import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { demoContracts } from "@/data/demoData";

export type ContractRow = Tables<"contracts"> & {
  clients?: { name: string } | null;
  plans?: { name: string } | null;
  contract_types?: { name: string } | null;
};

export function useContracts() {
  const { isDemoMode } = useDemo();
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
      const { data, error } = await supabase
        .from("contracts")
        .select("*, clients(name), plans(name), contract_types(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setContracts((data as ContractRow[]) || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const addContract = async (values: Partial<Tables<"contracts">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    const { error } = await supabase.from("contracts").insert(values as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Contrato criado", description: values.title });
    return true;
  };

  const updateContract = async (id: string, values: Partial<Tables<"contracts">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    
    // Check if status is transitioning to 'ativo'
    const prevContract = contracts.find(c => c.id === id);
    const isActivating = values.status === 'ativo' && prevContract?.status !== 'ativo';

    const { error } = await supabase.from("contracts").update(values).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }

    // Automate Deliveries if activating and package is linked
    const packageId = (values as any).package_id || prevContract?.package_id;
    if (isActivating && packageId) {
      try {
        const { data: pkgItems } = await supabase.from("package_items").select("*, products(name)").eq("package_id", packageId);
        
        if (pkgItems && pkgItems.length > 0) {
          // 1. Create Checklist
          const { data: checklist, error: checkErr } = await supabase.from("delivery_checklists").insert({
            client_id: prevContract?.client_id as string,
            contract_id: id,
            period: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date()),
            frequency: prevContract?.billing_frequency || 'mensal',
            fulfillment_pct: 0
          }).select().single();

          if (checklist) {
            // 2. Create Checklist Items
            const itemsToInsert = pkgItems.map(it => ({
              checklist_id: checklist.id,
              name: (it.products as any)?.name || "Serviço",
              status: "pending" as any
            }));
            await supabase.from("delivery_checklist_items").insert(itemsToInsert);

            // 3. Create records in the new 'contract_deliveries' table for long-term tracking
            const deliveryRows = pkgItems.map(it => ({
                contract_id: id,
                client_id: prevContract?.client_id as string,
                product_id: it.product_id,
                package_id: packageId,
                status: 'Pendente',
                planned_date: new Date().toISOString().split('T')[0]
            }));
            await supabase.from("contract_deliveries").insert(deliveryRows);

            toast({ title: "🚀 Automação: Entregas Geradas", description: `${pkgItems.length} itens adicionados ao checklist operacional.` });
          }
        }
      } catch (err) {
        console.error("Erro na automação de entregas:", err);
      }
    }

    await fetch();
    return true;
  };

  return { contracts, loading, refetch: fetch, addContract, updateContract };
}
