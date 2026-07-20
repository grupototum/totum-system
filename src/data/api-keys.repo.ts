import { supabase } from "@/integrations/supabase/client";

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

export async function listApiKeys(): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function revokeApiKey(id: string) {
  const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function deleteApiKey(id: string) {
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) throw error;
}
