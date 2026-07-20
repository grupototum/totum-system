import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PopRow = Tables<"pops"> & {
  pop_steps?: Tables<"pop_steps">[];
  pop_checklist_items?: Tables<"pop_checklist_items">[];
};

export async function listPopsWithDetails(): Promise<PopRow[]> {
  const { data, error } = await supabase
    .from("pops")
    .select("*, pop_steps(*), pop_checklist_items(*)")
    .order("title");
  if (error) throw error;
  return (data as PopRow[]) || [];
}

// Usada pela tela de gestão de POPs (usePops) — mais recentes primeiro.
export async function listPopsWithDetailsRecent(): Promise<PopRow[]> {
  const { data, error } = await supabase
    .from("pops")
    .select("*, pop_steps(*), pop_checklist_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as PopRow[]) || [];
}

interface PopInput {
  title: string;
  category: string;
  description: string;
  expected_outcome: string;
  linked_task_type: string | null;
}

export async function createPop(pop: PopInput): Promise<string> {
  const { data, error } = await supabase.from("pops").insert(pop).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updatePop(id: string, pop: PopInput) {
  const { error } = await supabase.from("pops").update(pop).eq("id", id);
  if (error) throw error;
}

export async function replacePopSteps(popId: string, steps: { title: string; description: string }[]) {
  const { error: deleteErr } = await supabase.from("pop_steps").delete().eq("pop_id", popId);
  if (deleteErr) throw deleteErr;
  if (steps.length === 0) return;
  const { error } = await supabase.from("pop_steps").insert(
    steps.map((s, i) => ({ pop_id: popId, title: s.title, description: s.description || "", sort_order: i }))
  );
  if (error) throw error;
}

export async function replacePopChecklistItems(popId: string, items: { text: string }[]) {
  const { error: deleteErr } = await supabase.from("pop_checklist_items").delete().eq("pop_id", popId);
  if (deleteErr) throw deleteErr;
  if (items.length === 0) return;
  const { error } = await supabase.from("pop_checklist_items").insert(
    items.map((c, i) => ({ pop_id: popId, text: c.text, sort_order: i }))
  );
  if (error) throw error;
}

export async function deletePop(id: string) {
  const { error } = await supabase.from("pops").delete().eq("id", id);
  if (error) throw error;
}
