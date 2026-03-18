import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ProductRow = Tables<"products"> & {
  product_types?: { name: string } | null;
};

export function useProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, product_types(name)")
      .order("name");
    if (error) console.error("Error fetching products:", error);
    else setProducts((data as ProductRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addProduct = async (values: Partial<Tables<"products">>) => {
    const { error } = await supabase.from("products").insert(values as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    toast({ title: "Produto criado", description: values.name });
    return true;
  };

  const updateProduct = async (id: string, values: Partial<Tables<"products">>) => {
    const { error } = await supabase.from("products").update(values).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  return { products, loading, refetch: fetch, addProduct, updateProduct, deleteProduct };
}

export function useProductTypes() {
  const [types, setTypes] = useState<Tables<"product_types">[]>([]);

  useEffect(() => {
    supabase.from("product_types").select("*").eq("is_active", true).order("name")
      .then(({ data }) => setTypes(data || []));
  }, []);

  return types;
}
