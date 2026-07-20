import { supabase } from "@/integrations/supabase/client";

export async function createImportBatch(userId: string, totalRecords: number) {
  const { data, error } = await supabase
    .from("import_batches")
    .insert({ user_id: userId, entity_types: ["financial_entries", "clients"], total_records: totalRecords, status: "completed" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateImportBatchCounts(batchId: string, financialCount: number, clientCount: number) {
  const { error } = await supabase
    .from("import_batches")
    .update({ financial_count: financialCount, client_count: clientCount })
    .eq("id", batchId);
  if (error) throw error;
}

export async function getLastCompletedImportBatch() {
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function rollbackImportBatch(batchId: string) {
  const { error } = await supabase.rpc("rollback_import" as any, { _batch_id: batchId });
  if (error) throw error;
}
