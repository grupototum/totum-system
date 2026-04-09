import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function shouldGenerate(task: any, now: Date): { should: boolean; nextDueDate: string } {
  const recType = task.recurrence_type;
  const config = task.recurrence_config || {};
  const lastGen = task.last_generated_at ? new Date(task.last_generated_at) : null;
  const endDate = task.recurrence_end_date ? new Date(task.recurrence_end_date) : null;

  if (endDate && now > endDate) return { should: false, nextDueDate: "" };

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (recType === "diaria") {
    // Generate if no task generated today
    if (lastGen && lastGen.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)) {
      return { should: false, nextDueDate: "" };
    }
    return { should: true, nextDueDate: today.toISOString().slice(0, 10) };
  }

  if (recType === "semanal") {
    const dayOfWeek = today.getDay();
    const weekDays: number[] = config.week_days || [1]; // default Monday
    if (!weekDays.includes(dayOfWeek)) return { should: false, nextDueDate: "" };
    if (lastGen && lastGen.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)) {
      return { should: false, nextDueDate: "" };
    }
    return { should: true, nextDueDate: today.toISOString().slice(0, 10) };
  }

  if (recType === "mensal") {
    const monthDay = config.month_day || 1;
    if (today.getDate() !== monthDay) return { should: false, nextDueDate: "" };
    if (lastGen && lastGen.toISOString().slice(0, 7) === today.toISOString().slice(0, 7)) {
      return { should: false, nextDueDate: "" };
    }
    return { should: true, nextDueDate: today.toISOString().slice(0, 10) };
  }

  if (recType === "personalizada") {
    const intervalDays = config.interval_days || 7;
    if (!lastGen) return { should: true, nextDueDate: today.toISOString().slice(0, 10) };
    const diffMs = today.getTime() - new Date(lastGen.toISOString().slice(0, 10)).getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays >= intervalDays) {
      return { should: true, nextDueDate: today.toISOString().slice(0, 10) };
    }
    return { should: false, nextDueDate: "" };
  }

  return { should: false, nextDueDate: "" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();

    // Fetch all recurring parent tasks
    const { data: recurringTasks, error: rErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_recurring", true)
      .is("parent_task_id", null);

    if (rErr) throw rErr;
    if (!recurringTasks || recurringTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma tarefa recorrente encontrada.", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalCreated = 0;

    for (const task of recurringTasks) {
      const { should, nextDueDate } = shouldGenerate(task, now);
      if (!should) continue;

      // Create new occurrence
      const { error: insertErr } = await supabase.from("tasks").insert({
        title: task.title,
        description: task.description,
        client_id: task.client_id,
        contract_id: task.contract_id,
        plan_id: task.plan_id,
        project_id: task.project_id,
        responsible_id: task.responsible_id,
        task_type: task.task_type,
        priority: task.priority,
        status: "pendente",
        due_date: nextDueDate,
        parent_task_id: task.id,
        is_recurring: false,
      });

      if (insertErr) {
        console.error("Error creating occurrence for task", task.id, insertErr);
        continue;
      }

      // Update last_generated_at
      await supabase
        .from("tasks")
        .update({ last_generated_at: now.toISOString() })
        .eq("id", task.id);

      // Log history
      await supabase.from("task_history").insert({
        task_id: task.id,
        action: "Ocorrência gerada",
        detail: `Nova ocorrência para ${nextDueDate}`,
      });

      totalCreated++;
    }

    return new Response(
      JSON.stringify({ message: `${totalCreated} ocorrência(s) gerada(s).`, created: totalCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-recurring-tasks error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
