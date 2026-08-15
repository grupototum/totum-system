import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { demoContracts } from "@/data/demoData";

export function useClientContracts(clientId: string) {
  const { isDemoMode } = useDemo();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setContracts((demoContracts as any[]).filter((c) => c.client_id === clientId));
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

  const createContract = async (values: any) => {
    if (isDemoMode) {
      toast({ title: "Sucesso", description: "Contrato criado (Modo Demo)." });
      return true;
    }
    const { error } = await supabase.from("contracts").insert({ ...values, client_id: clientId });
    if (error) {
      toast({ title: "Erro ao criar contrato", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Sucesso", description: "Contrato criado com sucesso." });
    await fetch();
    return true;
  };

  const updateContract = async (id: string, values: any) => {
    if (isDemoMode) {
      setContracts((prev) => prev.map((c) => c.id === id ? { ...c, ...values } : c));
      toast({ title: "Sucesso", description: "Contrato atualizado (Modo Demo)." });
      return true;
    }
    const { error } = await supabase.from("contracts").update(values).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Sucesso", description: "Contrato atualizado com sucesso." });
    await fetch();
    return true;
  };

  return { contracts, loading, refetch: fetch, createContract, updateContract };
}
