import { supabase } from "@/integrations/supabase/client";

/**
 * Busca profiles filtrando por organização.
 * Belt-and-suspenders sobre o RLS: master users bypassam todas as policies
 * org-scoped, então o filtro explícito de organization_id é obrigatório.
 */
export async function fetchOrgProfiles(
  organizationId: string | undefined,
  select = "user_id, full_name"
): Promise<{ user_id: string; full_name: string; avatar_url?: string | null }[]> {
  let q = supabase.from("profiles").select(select);
  if (organizationId) q = q.eq("organization_id", organizationId);
  const { data } = await q;
  return data || [];
}
