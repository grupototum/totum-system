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

      // Sort items inside each package by sort_order
      const sorted = ((data as PackageRow[]) || []).map(pkg => ({
        ...pkg,
        items: (pkg.items || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      }));

      setPackages(sorted);
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

  // ─── delivery_model_items CRUD ─────────────────────────────────────────────

  const addDeliveryItem = async (
    planId: string,
    item: { name: string; task_type?: string; suggested_priority?: string; sort_order?: number }
  ) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }

    // Determine next sort_order
    const pkg = packages.find(p => p.id === planId);
    const maxOrder = (pkg?.items || []).reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);

    const { error } = await supabase.from("delivery_model_items").insert({
      plan_id: planId,
      name: item.name,
      task_type: (item.task_type ?? "outro") as any,
      suggested_priority: (item.suggested_priority ?? "media") as any,
      sort_order: item.sort_order ?? maxOrder + 1,
    });

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    toast({ title: "Item adicionado", description: item.name });
    return true;
  };

  const updateDeliveryItem = async (
    itemId: string,
    values: Partial<Pick<Tables<"delivery_model_items">, "name" | "task_type" | "suggested_priority" | "sort_order" | "suggested_responsible_id">>
  ) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }

    const { error } = await supabase
      .from("delivery_model_items")
      .update(values as any)
      .eq("id", itemId);

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  const deleteDeliveryItem = async (itemId: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }

    const { error } = await supabase
      .from("delivery_model_items")
      .delete()
      .eq("id", itemId);

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    toast({ title: "Item removido" });
    return true;
  };

  /** Reorder all items in a plan by providing the ordered array of IDs. */
  const reorderDeliveryItems = async (planId: string, orderedIds: string[]) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }

    const updates = orderedIds.map((id, idx) =>
      supabase.from("delivery_model_items").update({ sort_order: idx }).eq("id", id).eq("plan_id", planId)
    );

    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed?.error) {
      toast({ title: "Erro ao reordenar", description: failed.error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return {
    packages,
    loading,
    refetch: fetch,
    addPackage,
    updatePackage,
    deletePackage,
    addDeliveryItem,
    updateDeliveryItem,
    deleteDeliveryItem,
    reorderDeliveryItems,
  };
}
