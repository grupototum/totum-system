import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar chaves:", error);
      toast({ title: "Erro ao carregar chaves de API", description: error.message, variant: "destructive" });
      setKeys([]);
    } else {
      setKeys(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (name: string, scopes: string[]): Promise<CreatedApiKey | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: { name, scopes },
      });

      if (error) {
        console.error("Erro ao criar chave:", error);
        toast({ title: "Erro ao criar chave de API", description: error.message, variant: "destructive" });
        return null;
      }

      await fetchKeys();
      return data as CreatedApiKey;
    } catch (e) {
      console.error("Erro ao criar chave:", e);
      toast({ title: "Erro ao criar chave de API", description: "Tente novamente em instantes.", variant: "destructive" });
      return null;
    }
  };

  const revokeKey = async (id: string) => {
    const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
    if (error) {
      console.error("Erro ao revogar chave:", error);
      toast({ title: "Erro ao revogar chave", description: error.message, variant: "destructive" });
    } else {
      await fetchKeys();
    }
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir chave:", error);
      toast({ title: "Erro ao excluir chave", description: error.message, variant: "destructive" });
    } else {
      await fetchKeys();
    }
  };

  return { keys, loading, createKey, revokeKey, deleteKey };
}
