import { supabase } from "@/integrations/supabase/client";

export async function listActiveContractsForDropdown() {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, title, client_id")
    .eq("status", "ativo")
    .order("title");
  if (error) throw error;
  return data || [];
}
