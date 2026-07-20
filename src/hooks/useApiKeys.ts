import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/errorHandler";
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
      reportError("Erro ao carregar chaves:", error, "api_keys_list");
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
        reportError("Erro ao criar chave:", error, "api_key_create");
        return null;
      }

      await fetchKeys();
      return data as CreatedApiKey;
    } catch (e) {
      reportError("Erro ao criar chave:", e, "api_key_create");
      return null;
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await revokeApiKey(id);
      await fetchKeys();
    } catch (error) {
      reportError("Erro ao revogar chave:", error, "api_key_revoke");
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await deleteApiKey(id);
      await fetchKeys();
    } catch (error) {
      reportError("Erro ao excluir chave:", error, "api_key_delete");
    }
  };

  return { keys, loading, createKey, revokeKey, deleteKey };
}
