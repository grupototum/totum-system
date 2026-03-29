import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import type { Tables } from "@/integrations/supabase/types";

export type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  loyalty_enabled: boolean | null;
  loyalty_months: number | null;
  total_cost: number | null;
  total_sale: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  items?: (Tables<"package_items"> & {
    products?: Tables<"products"> | null;
  })[];
};

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

export function usePackages() {
  const { isDemoMode } = useDemo();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      // Return empty for now in demo, or I could add mock data
      setPackages([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*, items:package_items(*, products(*))")
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

  const addPackage = async (values: any, items: any[]) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    
    const { data: pkg, error: pkgErr } = await supabase
      .from("packages")
      .insert(values)
      .select()
      .single();

    if (pkgErr) { toast({ title: "Erro", description: pkgErr.message, variant: "destructive" }); return false; }

    if (items.length > 0) {
      const itemRows = items.map(item => ({
        ...item,
        package_id: pkg.id
      }));
      const { error: itemsErr } = await supabase.from("package_items").insert(itemRows);
      if (itemsErr) { toast({ title: "Erro nos itens", description: itemsErr.message, variant: "destructive" }); }
    }

    await fetch();
    toast({ title: "Pacote criado", description: values.name });
    return true;
  };

  const updatePackage = async (id: string, values: any, items: any[]) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    
    const { error: pkgErr } = await supabase.from("packages").update(values).eq("id", id);
    if (pkgErr) { toast({ title: "Erro", description: pkgErr.message, variant: "destructive" }); return false; }

    // Update items: delete and re-insert (simplest way for now)
    await supabase.from("package_items").delete().eq("package_id", id);
    if (items.length > 0) {
      const itemRows = items.map(item => ({
        ...item,
        package_id: id
      }));
      await supabase.from("package_items").insert(itemRows);
    }

    await fetch();
    return true;
  };

  const deletePackage = async (id: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const { error } = await supabase.from("packages").update({ is_active: false }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  return { packages, loading, refetch: fetch, addPackage, updatePackage, deletePackage };
}
