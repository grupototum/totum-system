// Camada de acesso a dados de `profiles`. Expandir por caso de uso real,
// não especular.
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ProfileRow = Tables<"profiles"> & {
  roles?: { name: string; permissions: any } | null;
  departments?: { name: string } | null;
};

export async function listProfilesForAdmin(organizationId?: string): Promise<ProfileRow[]> {
  let query = supabase
    .from("profiles")
    .select("*, roles(name, permissions), departments(name)")
    .order("full_name");

  // Explicit org filter on top of RLS: master users bypass RLS and would
  // otherwise see profiles from ALL organizations.
  if (organizationId) {
    // Inclui perfis com organization_id NULL (órfãos de signups antigos):
    // .eq() nunca casa NULL, o que os tornava invisíveis para o admin em
    // /usuarios — impossibilitando aprová-los ou corrigi-los pela UI.
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as ProfileRow[]) || [];
}

export async function getProfileWithRelations(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, roles(name, permissions), departments(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function updateProfileAdmin(id: string, updates: Partial<Tables<"profiles">>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);
  if (error) throw error;
}

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
