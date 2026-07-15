import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ============================================================
// admin-update-user — permite que um admin altere o e-mail de login
// (auth.users.email) de outro usuário e/ou dispare um reset de senha.
// Corrige o bug em /usuarios onde a alteração de e-mail não persistia.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método não permitido" });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: caller }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !caller) return json(401, { error: "Não autenticado" });

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "totum_system" },
    });

    const { profile_id, email, password, send_password_reset } = await req.json();
    if (!profile_id) return json(400, { error: "profile_id é obrigatório" });

    // Carrega o profile alvo.
    const { data: target } = await admin
      .from("profiles")
      .select("id, user_id, organization_id, email")
      .eq("id", profile_id)
      .maybeSingle();
    if (!target?.user_id) return json(404, { error: "Usuário não encontrado" });

    // Autorização: admin global. Se não for master, precisa ser da mesma organização do alvo.
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("organization_id, is_master")
      .eq("user_id", caller.id)
      .maybeSingle();
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: caller.id });
    const isMaster = !!callerProfile?.is_master;
    // Admin pode vir de user_roles (is_admin) OU do flag profiles.is_master (master admin).
    if (!isAdmin && !isMaster) return json(403, { error: "Sem permissão" });

    const sameOrg = callerProfile?.organization_id && callerProfile.organization_id === target.organization_id;
    if (!isMaster && !sameOrg) {
      return json(403, { error: "Sem permissão para gerenciar usuários de outra organização" });
    }

    let emailChanged = false;
    if (email && email !== target.email) {
      const { error: aErr } = await admin.auth.admin.updateUserById(target.user_id, {
        email,
        email_confirm: true,
      });
      if (aErr) return json(400, { error: aErr.message });
      await admin.from("profiles").update({ email }).eq("id", profile_id);
      emailChanged = true;
    }

    let passwordChanged = false;
    if (password) {
      const { error: pErr } = await admin.auth.admin.updateUserById(target.user_id, { password });
      if (pErr) return json(400, { error: pErr.message });
      passwordChanged = true;
    }

    let resetLink: string | undefined;
    if (send_password_reset) {
      const { data: link, error: lErr } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: email || target.email,
      });
      if (lErr) return json(400, { error: lErr.message });
      resetLink = link?.properties?.action_link;
    }

    // Auditoria (best-effort).
    try {
      await admin.rpc("log_audit", {
        _user_id: caller.id,
        _action: emailChanged ? "Alteração de e-mail de login" : "Atualização de usuário (admin)",
        _details: `profile=${profile_id}${emailChanged ? ` novo_email=${email}` : ""}${send_password_reset ? " reset=true" : ""}`,
      });
    } catch (_) { /* log_audit é opcional */ }

    return json(200, { success: true, emailChanged, passwordChanged, resetLink });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
