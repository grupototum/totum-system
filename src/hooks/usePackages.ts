import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import type { Tables } from "@/integrations/supabase/types";

// Packages are stored in the "plans" table with label = 'pacote'
export type PackageRow = Tables<"plans"> & {
  items?: Tables<"delivery_model_items">[];
};

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

export function usePackages() {
  const { isDemoMode } = useDemo();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setPackages([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*, items:delivery_model_items(*)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setPackages((data as PackageRow[]) || []);
    } catch (err) {
      console.error("Error fetching packages:", err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const addPackage = async (values: Partial<Tables<"plans">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    
    const { error } = await supabase
      .from("plans")
      .insert({ ...values, name: values.name || "Novo Pacote" } as any);

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }

    await fetch();
    toast({ title: "Pacote criado", description: values.name });
    return true;
  };

  const updatePackage = async (id: string, values: Partial<Tables<"plans">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    
    const { error } = await supabase.from("plans").update(values).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }

    await fetch();
    return true;
  };

  const deletePackage = async (id: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const { error } = await supabase.from("plans").update({ is_active: false }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  return { packages, loading, refetch: fetch, addPackage, updatePackage, deletePackage };
}
