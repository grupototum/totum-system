import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar token do webhook (opcional, mas recomendado)
    const webhookToken = req.headers.get("asaas-access-token");
    const { data: config } = await supabase
      .from("asaas_config")
      .select("webhook_token, auto_create_financial")
      .eq("is_active", true)
      .single();

    if (config?.webhook_token && webhookToken !== config.webhook_token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { event, payment } = payload;

    // Registrar log do webhook
    await supabase.from("asaas_webhook_logs").insert({
      event,
      payment_id: payment?.id,
      payload,
      processed: false,
    });

    if (!payment?.id) {
      return new Response(JSON.stringify({ ok: true, message: "No payment data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualizar status da cobrança
    const { data: existingPayment } = await supabase
      .from("asaas_payments")
      .select("id, client_id, contract_id, value, due_date, description, financial_entry_id")
      .eq("asaas_payment_id", payment.id)
      .single();

    if (existingPayment) {
      await supabase
        .from("asaas_payments")
        .update({
          status: payment.status,
          payment_date: payment.paymentDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("asaas_payment_id", payment.id);

      // Se pagamento recebido e auto_create_financial ativo, criar lançamento financeiro
      if (
        ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event) &&
        config?.auto_create_financial &&
        !existingPayment.financial_entry_id
      ) {
        // Buscar categoria de receita padrão
        const { data: category } = await supabase
          .from("financial_categories")
          .select("id")
          .eq("type", "receita")
          .limit(1)
          .single();

        const { data: entry } = await supabase
          .from("financial_entries")
          .insert({
            type: "receber",
            category_id: category?.id || null,
            client_id: existingPayment.client_id,
            contract_id: existingPayment.contract_id,
            description: existingPayment.description || `Cobrança Asaas #${payment.id}`,
            value: existingPayment.value,
            due_date: existingPayment.due_date,
            payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
            status: "pago",
            recurrence: "unica",
            notes: `Sincronizado automaticamente via webhook Asaas. ID: ${payment.id}`,
          })
          .select("id")
          .single();

        if (entry) {
          await supabase
            .from("asaas_payments")
            .update({ financial_entry_id: entry.id })
            .eq("asaas_payment_id", payment.id);
        }
      }

      // Marcar log como processado
      await supabase
        .from("asaas_webhook_logs")
        .update({ processed: true })
        .eq("payment_id", payment.id)
        .eq("event", event);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
