import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export async function listErrorLogs(limit = 200): Promise<Tables<"error_logs">[]> {
  const { data, error } = await supabase
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createErrorLog(entry: TablesInsert<"error_logs">) {
  const { error } = await supabase.from("error_logs").insert(entry);
  if (error) throw error;
}
