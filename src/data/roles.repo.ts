import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type RoleRow = Tables<"roles">;

export async function listRoles(): Promise<RoleRow[]> {
  const { data, error } = await supabase.from("roles").select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function createRole(role: { name: string; description?: string | null; permissions: any; is_system?: boolean }) {
  const { error } = await supabase.from("roles").insert(role);
  if (error) throw error;
}

export async function updateRole(id: string, role: { name: string; description?: string | null; permissions: any }) {
  const { error } = await supabase.from("roles").update(role).eq("id", id);
  if (error) throw error;
}

export async function deleteRole(id: string) {
  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) throw error;
}
