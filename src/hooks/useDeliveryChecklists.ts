import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type ChecklistRow = Tables<"delivery_checklists"> & {
  clients?: { name: string } | null;
  plans?: { name: string } | null;
  delivery_checklist_items?: Tables<"delivery_checklist_items">[];
};

export function useDeliveryChecklists() {
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_checklists")
      .select("*, clients(name), plans(name), delivery_checklist_items(*)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) console.error("Error fetching checklists:", error);
    else setChecklists((data as ChecklistRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateItemStatus = async (
    itemId: string,
    status: Enums<"delivery_item_status">,
    justification?: string
  ) => {
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
