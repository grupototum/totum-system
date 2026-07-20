import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ProductRow = Tables<"products"> & {
  product_types?: { name: string } | null;
};

export async function listActiveProductsWithType() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, product_types(name)")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function listProductsWithType(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("products").select("*, product_types(name)").order("name");
  if (error) throw error;
  return (data as ProductRow[]) || [];
}

export async function createProduct(values: Partial<Tables<"products">>) {
  const { error } = await supabase.from("products").insert(values as any);
  if (error) throw error;
}

export async function updateProduct(id: string, values: Partial<Tables<"products">>) {
  const { error } = await supabase.from("products").update(values).eq("id", id);
  if (error) throw error;
}

export async function deactivateProduct(id: string) {
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function listActiveProductTypes() {
  const { data, error } = await supabase.from("product_types").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return data || [];
}
