import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { demoClients } from "@/data/demoData";
import { getClientDisplayName } from "@/lib/clients";

export type ClientRow = Tables<"clients"> & {
  company_name?: string | null;
  contact_name?: string | null;
  cnpj?: string | null;
  contracts?: { value: number | null; plan_id: string | null; status: string; plans?: { name: string } | null }[];
};

export function useClients() {
  const { isDemoMode } = useDemo();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setClients(demoClients as ClientRow[]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setClients([]);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*, contracts(value, plan_id, status, plans(name))");

      if (error) throw error;
      const sorted = ((data as ClientRow[]) || []).sort((a, b) =>
        getClientDisplayName(a).localeCompare(getClientDisplayName(b), "pt-BR")
      );
      setClients(sorted);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const addClient = async (values: Partial<Tables<"clients">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    const { error } = await supabase.from("clients").insert(values as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Cliente criado", description: getClientDisplayName(values as ClientRow) });
    return true;
  };

  const updateClient = async (id: string, values: Partial<Tables<"clients">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    const { error } = await supabase.from("clients").update(values).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteClient = async (id: string) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { clients, loading, refetch: fetch, addClient, updateClient, deleteClient };
}
