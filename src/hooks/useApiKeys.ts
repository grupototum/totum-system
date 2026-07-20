import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listApiKeys, revokeApiKey, deleteApiKey, type ApiKey } from "@/data/api-keys.repo";

export type { ApiKey };

export interface CreatedApiKey extends ApiKey {
  key: string;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      setKeys(await listApiKeys());
    } catch (error) {
      console.error("Erro ao carregar chaves:", error);
      setKeys([]);
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
        return null;
      }

      await fetchKeys();
      return data as CreatedApiKey;
    } catch (e) {
      console.error("Erro ao criar chave:", e);
      return null;
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await revokeApiKey(id);
      await fetchKeys();
    } catch (error) {
      console.error("Erro ao revogar chave:", error);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await deleteApiKey(id);
      await fetchKeys();
    } catch (error) {
      console.error("Erro ao excluir chave:", error);
    }
  };

  return { keys, loading, createKey, revokeKey, deleteKey };
}
