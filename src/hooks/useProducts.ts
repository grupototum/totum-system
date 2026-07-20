import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { demoProducts, demoProductTypes } from "@/data/demoData";
import type { Tables } from "@/integrations/supabase/types";
import {
  listProductsWithType,
  createProduct,
  updateProduct as updateProductRepo,
  deactivateProduct,
  listActiveProductTypes,
  type ProductRow,
} from "@/data/products.repo";

export type { ProductRow };

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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
      setProducts(await listProductsWithType());
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetch(); }, [fetch]);

  const addProduct = async (values: Partial<Tables<"products">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await createProduct(values);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Produto criado", description: values.name });
    return true;
  };

  const updateProduct = async (id: string, values: Partial<Tables<"products">>) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await updateProductRepo(id, values);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteProduct = async (id: string) => {
    if (isDemoMode) { toast(DEMO_TOAST); return true; }
    try {
      await deactivateProduct(id);
    } catch (error) {
      toast({ title: "Erro", description: errorMessage(error), variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { products, loading, refetch: fetch, addProduct, updateProduct, deleteProduct };
}

export function useProductTypes() {
  const { isDemoMode } = useDemo();
  const [types, setTypes] = useState<Tables<"product_types">[]>([]);

  useEffect(() => {
    if (isDemoMode) {
      setTypes(demoProductTypes as unknown as Tables<"product_types">[]);
      return;
    }
    listActiveProductTypes()
      .then(setTypes)
      .catch((err) => console.error("Error fetching product types:", err));
  }, [isDemoMode]);

  return types;
}
