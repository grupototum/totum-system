import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoDeliveryChecklists } from "@/data/demoData";
import { reportError } from "@/lib/errorHandler";
import {
  listChecklistsForOrg,
  updateChecklistItemStatus,
  updateChecklistItemJustification,
  finalizeChecklist as finalizeChecklistRepo,
} from "@/data/deliveries.repo";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type ChecklistRow = Tables<"delivery_checklists"> & {
  clients?: { name: string } | null;
  plans?: { name: string } | null;
  delivery_checklist_items?: (Tables<"delivery_checklist_items">)[];
};

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

/** Debounce hook — fires fn only after `delay` ms of silence. */
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay = 400) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay]
  );
}

function sortItems(c: ChecklistRow): ChecklistRow {
  return {
    ...c,
    delivery_checklist_items: (c.delivery_checklist_items || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };
}

export function useDeliveryChecklists() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
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
      if (!session) { setChecklists([]); return; }

      // RLS already scopes to the tenant; org_id filter is belt-and-suspenders
      const data = await listChecklistsForOrg(tenant?.organization_id, 50);
      setChecklists((data as ChecklistRow[]).map(sortItems));
    } catch (error) {
      reportError("Error fetching checklists:", error, "delivery_checklists_list");
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateItemStatus = async (
    itemId: string,
    status: Enums<"delivery_item_status">,
    justification?: string
  ) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }

    const updates: Partial<Tables<"delivery_checklist_items">> = { status };
    if (justification !== undefined) updates.justification = justification;
    updates.completed_at = status === "entregue" ? new Date().toISOString() : null;

    try {
      await updateChecklistItemStatus(itemId, updates);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  // Debounced: only hits DB after 400ms of silence (prevents per-keystroke calls)
  const _saveJustification = useCallback(async (itemId: string, justification: string) => {
    if (isDemoMode) return true;
    try {
      await updateChecklistItemJustification(itemId, justification);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
    // Silent refetch (no spinner flicker)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return true;
    const data = await listChecklistsForOrg(tenant?.organization_id, 50).catch(() => null);
    if (data) {
      setChecklists((data as ChecklistRow[]).map(sortItems));
    }
    return true;
  }, [isDemoMode, tenant?.organization_id]);

  const updateItemJustification = useDebouncedCallback(_saveJustification, 400);

  const finalizeChecklist = async (checklistId: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return false;

    const items = checklist.delivery_checklist_items || [];
    const actionable = items.filter(i => i.status !== "nao_aplicavel");
    const delivered = actionable.filter(i => i.status === "entregue").length;
    const pct = actionable.length > 0 ? Math.round((delivered / actionable.length) * 100) : 0;

    const { data: { user } } = await supabase.auth.getUser();

    try {
      await finalizeChecklistRepo(checklistId, { fulfillmentPct: pct, completedBy: user?.id || null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }

    await fetch();
    toast({ title: "Checklist finalizado", description: `Cumprimento: ${pct}%` });
    return true;
  };

  return { checklists, loading, refetch: fetch, updateItemStatus, updateItemJustification, finalizeChecklist };
}
