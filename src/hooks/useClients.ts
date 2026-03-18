import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ClientRow = Tables<"clients"> & {
  client_types?: { name: string } | null;
  contracts?: { value: number | null; plan_id: string | null; status: string; plans?: { name: string } | null }[];
};

export function useClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*, client_types(name), contracts(value, plan_id, status, plans(name))")
      .order("name");

    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients((data as ClientRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addClient = async (values: Partial<Tables<"clients">>) => {
    const { error } = await supabase.from("clients").insert(values as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Cliente criado", description: values.name });
    return true;
  };

  const updateClient = async (id: string, values: Partial<Tables<"clients">>) => {
    const { error } = await supabase.from("clients").update(values).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteClient = async (id: string) => {
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
