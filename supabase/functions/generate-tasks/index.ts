import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function currentPeriod(frequency: string, refDate: Date = new Date()): string {
  const y = refDate.getFullYear();
  const m = String(refDate.getMonth() + 1).padStart(2, "0");

  if (frequency === "semanal") {
    const jan1 = new Date(y, 0, 1);
    const days = Math.floor((refDate.getTime() - jan1.getTime()) / 86_400_000);
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  if (frequency === "quinzenal") {
    const half = refDate.getDate() <= 15 ? "Q1" : "Q2";
    return `${y}-${m}-${half}`;
  }
  return `${y}-${m}`;
}

function periodDueDate(frequency: string, refDate: Date = new Date()): string {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();

  if (frequency === "semanal") {
    const d = new Date(refDate);
    d.setDate(d.getDate() + (7 - d.getDay()));
    return d.toISOString().slice(0, 10);
  }
  if (frequency === "quinzenal") {
    if (refDate.getDate() <= 15) {
      return `${y}-${String(m + 1).padStart(2, "0")}-15`;
    }
    const last = new Date(y, m + 1, 0);
    return last.toISOString().slice(0, 10);
  }
  // mensal — last day of month
  const last = new Date(y, m + 1, 0);
  return last.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let contractIdFilter: string | undefined;
    let periodOverride: string | undefined;
    let force = false;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        contractIdFilter = body.contract_id;
        periodOverride = body.period;
        force = body.force === true;
      } catch { /* no body */ }
    }

    // 1. Fetch active contracts with plans
    let query = supabase
      .from("contracts")
      .select("id, client_id, plan_id, billing_frequency, plans(id, name, frequency)")
      .eq("status", "ativo")
      .not("plan_id", "is", null);

    if (contractIdFilter) query = query.eq("id", contractIdFilter);

    const { data: contracts, error: cErr } = await query;
    if (cErr) throw cErr;
    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum contrato ativo com plano encontrado.", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalCreated = 0;
    const results: Array<{ contract_id: string; period: string; tasks: number }> = [];

    for (const contract of contracts) {
      const freq = contract.billing_frequency || (contract.plans as any)?.frequency || "mensal";
      const period = periodOverride || currentPeriod(freq);
      const dueDate = periodDueDate(freq);

      // 2. Skip if tasks already generated for this contract+period
      if (!force) {
        const { data: existing } = await supabase
          .from("tasks")
          .select("id")
          .eq("contract_id", contract.id)
          .eq("generation_period", period)
          .limit(1);

        if (existing && existing.length > 0) continue;
      }

      // 3. Fetch delivery model items for this plan
      const { data: modelItems, error: mErr } = await supabase
        .from("delivery_model_items")
        .select("*")
        .eq("plan_id", contract.plan_id!)
        .order("sort_order");

      if (mErr) throw mErr;
      if (!modelItems || modelItems.length === 0) continue;

      // 4. Create tasks from model items
      const tasks = modelItems.map((mi: any) => ({
        title: mi.name,
        description: mi.description || null,
        client_id: contract.client_id,
        contract_id: contract.id,
        plan_id: contract.plan_id,
        delivery_model_item_id: mi.id,
        task_type: mi.task_type || "outro",
        priority: mi.suggested_priority || "media",
        status: "pendente",
        responsible_id: mi.suggested_responsible_id || null,
        due_date: dueDate,
        generation_period: period,
      }));

      const { error: tErr } = await supabase.from("tasks").insert(tasks);
      if (tErr) throw tErr;

      totalCreated += tasks.length;
      results.push({ contract_id: contract.id, period, tasks: tasks.length });
    }

    return new Response(
      JSON.stringify({
        message: `${totalCreated} tarefa(s) gerada(s) com sucesso.`,
        created: totalCreated,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-tasks error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
