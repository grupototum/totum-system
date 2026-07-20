import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type AuditLogRow = Tables<"audit_logs">;

export async function listAuditLogs(limit = 200): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listAuditLogsForEntity(entityType: string, entityId: string, limit = 50): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createAuditLog(entry: TablesInsert<"audit_logs">) {
  const { error } = await supabase.from("audit_logs").insert(entry);
  if (error) throw error;
}
