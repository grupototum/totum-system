// Camada de acesso a dados de `profiles`. Mínimo por enquanto — só o caso de
// uso que existia (dropdown de responsáveis); expandir por caso de uso real,
// não especular.
import { supabase } from "@/integrations/supabase/client";

export async function listActiveProfilesForDropdown(organizationId?: string) {
  let query = supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("status", "ativo")
    .order("full_name");

  // Usuários normais já são filtrados por RLS; masters bypassam RLS, então
  // sem organizationId explícito restringimos a não-masters para não vazar
  // todo mundo. Ver useSupabaseTasks original para o motivo desta regra.
  query = organizationId ? query.eq("organization_id", organizationId) : query.eq("is_master", false);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listProfilesWithAvatarByOrg(organizationId?: string) {
  let query = supabase.from("profiles").select("user_id, full_name, avatar_url");
  if (organizationId) query = query.eq("organization_id", organizationId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
