import { supabase } from "@/integrations/supabase/client";

export async function listAdminUserIds(): Promise<string[]> {
  const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  if (error) throw error;
  return (data || []).map((r) => r.user_id);
}

export async function grantAdmin(userId: string) {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
  if (error) throw error;
}

export async function revokeAdmin(userId: string) {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
  if (error) throw error;
}
