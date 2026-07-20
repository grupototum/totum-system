import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { reportError } from "@/lib/errorHandler";
import {
  listPopsWithDetailsRecent,
  createPop,
  updatePop,
  replacePopSteps,
  replacePopChecklistItems,
  deletePop as deletePopRepo,
} from "@/data/pops.repo";

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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function usePops() {
  const [pops, setPops] = useState<Pop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPopsWithDetailsRecent();

      const mapped: Pop[] = data.map((p: any) => ({
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
    } catch (err) {
      reportError("Error fetching POPs:", err, "pops_list");
      toast({ title: "Erro ao carregar POPs", description: errorMessage(err), variant: "destructive" });
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
      const popInput = {
        title: pop.title,
        category: pop.category,
        description: pop.description,
        expected_outcome: pop.expected_outcome,
        linked_task_type: pop.linked_task_type || null,
      };

      const popId = pop.id ? pop.id : await createPop(popInput);
      if (pop.id) await updatePop(pop.id, popInput);

      await replacePopSteps(popId, pop.steps);
      await replacePopChecklistItems(popId, pop.checklist);

      toast({ title: pop.id ? "POP atualizado" : "POP criado", description: `"${pop.title}" salvo com sucesso.` });
      await fetchPops();
      return true;
    } catch (err) {
      toast({ title: "Erro ao salvar POP", description: errorMessage(err), variant: "destructive" });
      return false;
    }
  };

  const deletePop = async (id: string) => {
    try {
      await deletePopRepo(id);
      toast({ title: "POP excluído" });
      await fetchPops();
      return true;
    } catch (err) {
      toast({ title: "Erro ao excluir", description: errorMessage(err), variant: "destructive" });
      return false;
    }
  };

  return { pops, loading, savePop, deletePop, refetch: fetchPops };
}
