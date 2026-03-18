import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ContractRow = Tables<"contracts"> & {
  clients?: { name: string } | null;
  plans?: { name: string } | null;
  contract_types?: { name: string } | null;
};

export function useContracts() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*, clients(name), plans(name), contract_types(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contracts:", error);
    } else {
      setContracts((data as ContractRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addContract = async (values: Partial<Tables<"contracts">>) => {
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
    const { error } = await supabase.from("contracts").update(values).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { contracts, loading, refetch: fetch, addContract, updateContract };
}
