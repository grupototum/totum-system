import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import type { Tables } from "@/integrations/supabase/types";
import {
  listActivePackagesWithItems,
  createPackage,
  updatePackage as updatePackageRepo,
  deactivatePackage,
  createDeliveryModelItem,
  updateDeliveryModelItem,
  deleteDeliveryModelItem,
  reorderDeliveryModelItems,
  type PackageRow,
} from "@/data/plans.repo";

export type { PackageRow };

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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
      const data = await listActivePackagesWithItems();
      // Sort items inside each package by sort_order
      const sorted = data.map(pkg => ({
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
    try {
      await createPackage(values);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Pacote criado", description: values.name });
    return true;
  };

  const updatePackage = async (id: string, values: Partial<Tables<"plans">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await updatePackageRepo(id, values);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deletePackage = async (id: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await deactivatePackage(id);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  // ─── delivery_model_items CRUD ─────────────────────────────────────────────

  const addDeliveryItem = async (
    planId: string,
    item: { name: string; task_type?: string; suggested_priority?: string; sort_order?: number }
  ) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }

    const pkg = packages.find(p => p.id === planId);
    const maxOrder = (pkg?.items || []).reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);

    try {
      await createDeliveryModelItem({
        planId,
        name: item.name,
        taskType: item.task_type,
        suggestedPriority: item.suggested_priority,
        sortOrder: item.sort_order ?? maxOrder + 1,
      });
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Item adicionado", description: item.name });
    return true;
  };

  const updateDeliveryItem = async (
    itemId: string,
    values: Partial<Pick<Tables<"delivery_model_items">, "name" | "task_type" | "suggested_priority" | "sort_order" | "suggested_responsible_id">>
  ) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await updateDeliveryModelItem(itemId, values);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteDeliveryItem = async (itemId: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await deleteDeliveryModelItem(itemId);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Item removido" });
    return true;
  };

  /** Reorder all items in a plan by providing the ordered array of IDs. */
  const reorderDeliveryItems = async (planId: string, orderedIds: string[]) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await reorderDeliveryModelItems(planId, orderedIds);
    } catch (error) {
      toast({ title: "Erro ao reordenar", description: errorMessage(error), variant: "destructive" });
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
