import { supabase } from "@/integrations/supabase/client";

export async function listActiveProductsWithType() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, product_types(name)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}
