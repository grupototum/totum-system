import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProvisionResult {
  success: boolean;
  organization?: Record<string, unknown>;
  hostname?: string;
  message?: string;
  error?: string;
  vercel_error?: string;
}

/**
 * Verifica se um subdomínio está disponível (sem criar nada).
 */
export async function checkSubdomainAvailable(subdomain: string): Promise<boolean> {
  const clean = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
  if (!clean) return false;

  const { data, error } = await (supabase.rpc as any)("check_subdomain_available", {
    _subdomain: clean,
  });

  if (error) return false;
  return data === true;
}

/**
 * Hook para provisionar um novo subdomínio para um tenant.
 * Chama a Edge Function provision-subdomain que:
 *  1. Verifica disponibilidade
 *  2. Cria a org no banco
 *  3. Adiciona o domínio no Vercel via API
 */
export function useProvisionSubdomain() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const provision = async (params: {
    subdomain: string;
    org_name: string;
    org_slug: string;
  }): Promise<ProvisionResult> => {
    setLoading(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) throw new Error("Usuário não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-subdomain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );

      const data: ProvisionResult = await res.json();
      setResult(data);
      return data;
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      const r: ProvisionResult = { success: false, error };
      setResult(r);
      return r;
    } finally {
      setLoading(false);
    }
  };

  return { provision, loading, result };
}
