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
