import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get archive_after_days from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("archive_after_days")
      .limit(1)
      .single();

    const archiveDays = settings?.archive_after_days ?? 30;

    // Calculate cutoff date
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - archiveDays);
    const cutoffISO = cutoff.toISOString();

    // Find completed tasks older than cutoff that aren't already archived
    const { data: tasksToArchive, error: fetchErr } = await supabase
      .from("tasks")
      .select("id")
      .eq("status", "concluido")
      .lt("updated_at", cutoffISO);

    if (fetchErr) throw fetchErr;

    if (!tasksToArchive || tasksToArchive.length === 0) {
      return new Response(
        JSON.stringify({ archived: 0, message: "Nenhuma tarefa para arquivar" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = tasksToArchive.map((t: any) => t.id);

    const { error: updateErr } = await supabase
      .from("tasks")
      .update({ status: "arquivado" })
      .in("id", ids);

    if (updateErr) throw updateErr;

    // Log in task_history
    const historyEntries = ids.map((id: string) => ({
      task_id: id,
      action: "Arquivada automaticamente",
      detail: `Arquivada após ${archiveDays} dias de conclusão`,
    }));

    await supabase.from("task_history").insert(historyEntries);

    return new Response(
      JSON.stringify({ archived: ids.length, message: `${ids.length} tarefas arquivadas` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
