import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { demoProducts, demoProductTypes } from "@/data/demoData";
import type { Tables } from "@/integrations/supabase/types";

export type ProductRow = Tables<"products"> & {
  product_types?: { name: string } | null;
};

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

export function useProducts() {
  const { isDemoMode } = useDemo();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setProducts(demoProducts as unknown as ProductRow[]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_types(name)")
        .order("name");
      if (error) throw error;
      setProducts((data as ProductRow[]) || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const addProduct = async (values: Partial<Tables<"products">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const { error } = await supabase.from("products").insert(values as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    toast({ title: "Produto criado", description: values.name });
    return true;
  };

  const updateProduct = async (id: string, values: Partial<Tables<"products">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const { error } = await supabase.from("products").update(values).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  const deleteProduct = async (id: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetch();
    return true;
  };

  return { products, loading, refetch: fetch, addProduct, updateProduct, deleteProduct };
}

export function useProductTypes() {
  const { isDemoMode } = useDemo();
  const [types, setTypes] = useState<Tables<"product_types">[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setTypes(demoProductTypes as unknown as Tables<"product_types">[]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("product_types").select("*").eq("is_active", true).order("name");
    setTypes(data || []);
    setLoading(false);
  }, [isDemoMode]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return { types, loading, refetch: fetchTypes };
}
