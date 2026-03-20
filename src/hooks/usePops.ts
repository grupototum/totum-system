import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PopStep {
  id: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface PopChecklistItem {
  id: string;
  text: string;
  sort_order: number;
}

export interface Pop {
  id: string;
  title: string;
  category: string;
  description: string;
  expected_outcome: string;
  linked_task_type: string | null;
  steps: PopStep[];
  checklist: PopChecklistItem[];
  created_at: string;
  updated_at: string;
}

export function usePops() {
  const [pops, setPops] = useState<Pop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPops = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("pops")
        .select("*, pop_steps(*), pop_checklist_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Pop[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category || "geral",
        description: p.description || "",
        expected_outcome: p.expected_outcome || "",
        linked_task_type: p.linked_task_type,
        steps: (p.pop_steps || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        checklist: (p.pop_checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      setPops(mapped);
    } catch (err: any) {
      console.error("Error fetching POPs:", err);
      toast({ title: "Erro ao carregar POPs", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPops();
  }, [fetchPops]);

  const savePop = async (pop: {
    id?: string;
    title: string;
    category: string;
    description: string;
    expected_outcome: string;
    linked_task_type: string | null;
    steps: { title: string; description: string }[];
    checklist: { text: string }[];
  }) => {
    try {
      let popId = pop.id;

      if (popId) {
        const { error } = await (supabase as any).from("pops").update({
          title: pop.title,
          category: pop.category,
          description: pop.description,
          expected_outcome: pop.expected_outcome,
          linked_task_type: pop.linked_task_type || null,
        }).eq("id", popId);
        if (error) throw error;

        // Delete old steps and checklist, then re-insert
        await (supabase as any).from("pop_steps").delete().eq("pop_id", popId);
        await (supabase as any).from("pop_checklist_items").delete().eq("pop_id", popId);
      } else {
        const { data, error } = await (supabase as any).from("pops").insert({
          title: pop.title,
          category: pop.category,
          description: pop.description,
          expected_outcome: pop.expected_outcome,
          linked_task_type: pop.linked_task_type || null,
        }).select("id").single();
        if (error) throw error;
        popId = data.id;
      }

      // Insert steps
      if (pop.steps.length > 0) {
        const steps = pop.steps.map((s, i) => ({
          pop_id: popId,
          title: s.title,
          description: s.description || "",
          sort_order: i,
        }));
        await (supabase as any).from("pop_steps").insert(steps);
      }

      // Insert checklist
      if (pop.checklist.length > 0) {
        const items = pop.checklist.map((c, i) => ({
          pop_id: popId,
          text: c.text,
          sort_order: i,
        }));
        await (supabase as any).from("pop_checklist_items").insert(items);
      }

      toast({ title: pop.id ? "POP atualizado" : "POP criado", description: `"${pop.title}" salvo com sucesso.` });
      await fetchPops();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao salvar POP", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deletePop = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("pops").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "POP excluído" });
      await fetchPops();
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { pops, loading, savePop, deletePop, refetch: fetchPops };
}
