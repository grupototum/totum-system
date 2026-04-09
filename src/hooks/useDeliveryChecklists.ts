import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { demoDeliveryChecklists } from "@/data/demoData";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type ChecklistRow = Tables<"delivery_checklists"> & {
  clients?: { name: string } | null;
  plans?: { name: string } | null;
  delivery_checklist_items?: Tables<"delivery_checklist_items">[];
};

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

export function useDeliveryChecklists() {
  const { isDemoMode } = useDemo();
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setChecklists(demoDeliveryChecklists as unknown as ChecklistRow[]);
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChecklists([]);
        return;
      }

      const { data, error } = await supabase
        .from("delivery_checklists")
        .select("*, clients(name), plans(name), delivery_checklist_items(*)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setChecklists((data as ChecklistRow[]) || []);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateItemStatus = async (
    itemId: string,
    status: Enums<"delivery_item_status">,
    justification?: string
  ) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const updates: any = { status };
    if (justification !== undefined) updates.justification = justification;
    if (status === "entregue") updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("delivery_checklist_items")
      .update(updates)
      .eq("id", itemId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const updateItemJustification = async (itemId: string, justification: string) => {
    if (isDemoMode) { return true; }
    const { error } = await supabase
      .from("delivery_checklist_items")
      .update({ justification })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const finalizeChecklist = async (checklistId: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return false;

    const items = checklist.delivery_checklist_items || [];
    const actionable = items.filter(i => i.status !== "nao_aplicavel");
    const delivered = actionable.filter(i => i.status === "entregue").length;
    const pct = actionable.length > 0 ? Math.round((delivered / actionable.length) * 100) : 0;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("delivery_checklists")
      .update({
        fulfillment_pct: pct,
        completed_at: new Date().toISOString(),
        completed_by: user?.id || null,
      })
      .eq("id", checklistId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }

    await fetch();
    toast({ title: "Checklist finalizado", description: `Cumprimento: ${pct}%` });
    return true;
  };

  return { checklists, loading, refetch: fetch, updateItemStatus, updateItemJustification, finalizeChecklist };
}
