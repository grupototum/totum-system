import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function listClientObservations(clientId: string): Promise<Tables<"client_observations">[]> {
  const { data, error } = await supabase
    .from("client_observations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createClientObservation(clientId: string, userId: string, content: string) {
  const { error } = await supabase.from("client_observations").insert({
    client_id: clientId,
    user_id: userId,
    content,
  });
  if (error) throw error;
}
