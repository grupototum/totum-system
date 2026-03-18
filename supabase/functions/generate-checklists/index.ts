import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Calculates the current period string based on frequency and reference date.
 * - semanal   → "2026-W12"
 * - quinzenal → "2026-03-Q1" or "2026-03-Q2"
 * - mensal    → "2026-03"
 */
function currentPeriod(
  frequency: string,
  refDate: Date = new Date()
): string {
  const y = refDate.getFullYear();
  const m = String(refDate.getMonth() + 1).padStart(2, "0");

  if (frequency === "semanal") {
    // ISO week number
    const jan1 = new Date(y, 0, 1);
    const days = Math.floor(
      (refDate.getTime() - jan1.getTime()) / 86_400_000
    );
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, "0")}`;
  }

  if (frequency === "quinzenal") {
    const half = refDate.getDate() <= 15 ? "Q1" : "Q2";
    return `${y}-${m}-${half}`;
  }

  // mensal (default) or personalizada
  return `${y}-${m}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Optional body params: { contract_id?, period?, force? }
    let contractIdFilter: string | undefined;
    let periodOverride: string | undefined;
    let force = false;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        contractIdFilter = body.contract_id;
        periodOverride = body.period;
        force = body.force === true;
      } catch {
        // no body is fine
      }
    }

    // 1. Fetch active contracts with plan
    let query = supabase
      .from("contracts")
      .select("id, client_id, plan_id, billing_frequency, plans(id, name, frequency)")
      .eq("status", "ativo")
      .not("plan_id", "is", null);

    if (contractIdFilter) {
      query = query.eq("id", contractIdFilter);
    }

    const { data: contracts, error: contractsErr } = await query;
    if (contractsErr) throw contractsErr;
    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum contrato ativo com plano encontrado.", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalCreated = 0;
    const results: Array<{ contract_id: string; client: string; period: string; items: number }> = [];

    for (const contract of contracts) {
      const freq = contract.billing_frequency || (contract.plans as any)?.frequency || "mensal";
      const period = periodOverride || currentPeriod(freq);

      // 2. Check if checklist already exists for this contract+period
      if (!force) {
        const { data: existing } = await supabase
          .from("delivery_checklists")
          .select("id")
          .eq("contract_id", contract.id)
          .eq("period", period)
          .limit(1);

        if (existing && existing.length > 0) continue;
      }

      // 3. Fetch delivery model items for this plan
      const { data: modelItems, error: modelErr } = await supabase
        .from("delivery_model_items")
        .select("*")
        .eq("plan_id", contract.plan_id!)
        .order("sort_order");

      if (modelErr) throw modelErr;
      if (!modelItems || modelItems.length === 0) continue;

      // 4. Create checklist
      const { data: checklist, error: clErr } = await supabase
        .from("delivery_checklists")
        .insert({
          client_id: contract.client_id,
          contract_id: contract.id,
          plan_id: contract.plan_id,
          period,
          frequency: freq,
        })
        .select("id")
        .single();

      if (clErr) throw clErr;

      // 5. Create checklist items from model
      const items = modelItems.map((mi: any, idx: number) => ({
        checklist_id: checklist.id,
        delivery_model_item_id: mi.id,
        name: mi.name,
        sort_order: mi.sort_order ?? idx,
        responsible_id: mi.suggested_responsible_id || null,
      }));

      const { error: itemsErr } = await supabase
        .from("delivery_checklist_items")
        .insert(items);

      if (itemsErr) throw itemsErr;

      totalCreated++;
      results.push({
        contract_id: contract.id,
        client: contract.client_id,
        period,
        items: items.length,
      });
    }

    return new Response(
      JSON.stringify({
        message: `${totalCreated} checklist(s) gerado(s) com sucesso.`,
        created: totalCreated,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-checklists error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
