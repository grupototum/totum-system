import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientDisplayName } from "@/lib/clients";
import { useTenant } from "@/contexts/TenantContext";
import { attachOrganizationId } from "@/lib/tenant";

export interface FinancialFormLookups {
  categories: { id: string; name: string; type: string }[];
  costCenters: { id: string; name: string }[];
  expenseTypes: { id: string; name: string }[];
  clients: { id: string; name?: string | null; company_name?: string | null; status?: string | null }[];
  loading: boolean;
}

export function useFinancialFormLookups(open: boolean): FinancialFormLookups {
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [costCenters, setCostCenters] = useState<{ id: string; name: string }[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name?: string | null; company_name?: string | null; status?: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      supabase.from("financial_categories").select("id, name, type").eq("is_active", true),
      supabase.from("cost_centers").select("id, name").eq("is_active", true),
      supabase.from("expense_types").select("id, name").eq("is_active", true),
      supabase.from("clients").select("*"),
    ]).then(([cat, cc, et, cl]) => {
      setCategories((cat.data as any) || []);
      setCostCenters((cc.data as any) || []);
      setExpenseTypes((et.data as any) || []);
      const activeClients = ((cl.data as any[]) || [])
        .filter((c) => ["ativo", "active"].includes((c.status || "").toLowerCase()))
        .sort((a, b) => getClientDisplayName(a).localeCompare(getClientDisplayName(b), "pt-BR"));
      setClients(activeClients);
      setLoading(false);
    });
  }, [open]);

  return { categories, costCenters, expenseTypes, clients, loading };
}

export function useClientContractsByClientId(clientId: string | null) {
  const [contracts, setContracts] = useState<{ id: string; status: string; plans?: { name?: string | null } | null; value?: number | null }[]>([]);

  useEffect(() => {
    if (!clientId || clientId === "none") { setContracts([]); return; }
    supabase
      .from("contracts")
      .select("id, status, value, plans(name)")
      .eq("client_id", clientId)
      .order("start_date", { ascending: false })
      .then(({ data }) => setContracts((data as any) || []));
  }, [clientId]);

  return contracts;
}

export function useCreateFinancialEntry() {
  const { tenant } = useTenant();

  const createEntries = async (entries: any[]): Promise<string | null> => {
    const payload = entries.map((e) => attachOrganizationId(e, tenant?.organization_id));
    const { error } = await supabase.from("financial_entries").insert(payload);
    return error ? error.message : null;
  };

  return { createEntries };
}
