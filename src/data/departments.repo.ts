import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function listDepartments(): Promise<Tables<"departments">[]> {
  const { data, error } = await supabase.from("departments").select("*").order("name");
  if (error) throw error;
  return data || [];
}
