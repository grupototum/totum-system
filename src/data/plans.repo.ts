import { supabase } from "@/integrations/supabase/client";

export async function listActivePlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, value, frequency")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

// "Pacote Estratégico" no form de contrato reaproveita a tabela `plans` com
// outro shape (total_sale = value) — legado, preservado como está.
export async function listActivePlansAsPackageOptions() {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, value, frequency")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data || []).map((p) => ({ id: p.id, name: p.name, total_sale: p.value }));
}
