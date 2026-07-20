import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoClients } from "@/data/demoData";
import { getClientDisplayName } from "@/lib/clients";
import { reportError } from "@/lib/errorHandler";
import { listClients, createClient, updateClient as updateClientRow, deleteClient as deleteClientRow, type ClientRow } from "@/data/clients.repo";

export type { ClientRow };

export function useClients() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
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
      const data = await listClients();
      const sorted = data.sort((a, b) =>
        getClientDisplayName(a).localeCompare(getClientDisplayName(b), "pt-BR")
      );
      setClients(sorted);
    } catch (error) {
      reportError("Error fetching clients:", error, "clients_list");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const addClient = async (values: Partial<Tables<"clients">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    try {
      await createClient(values, tenant?.organization_id);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Cliente criado", description: getClientDisplayName(values as ClientRow) });
    return true;
  };

  const updateClient = async (id: string, values: Partial<Tables<"clients">>) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    try {
      await updateClientRow(id, values);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteClient = async (id: string) => {
    if (isDemoMode) { toast({ title: "Modo Demo", description: "Ação simulada com sucesso." }); return true; }
    try {
      await deleteClientRow(id);
    } catch (error) {
      toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { clients, loading, refetch: fetch, addClient, updateClient, deleteClient };
}
