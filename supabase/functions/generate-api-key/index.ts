import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método não permitido" });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Cliente com o JWT do chamador, para identificá-lo.
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !user) return json(401, { error: "Não autenticado" });

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve a organização do chamador.
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id, is_master")
      .eq("user_id", user.id)
      .maybeSingle();

    // Autorização: admin via user_roles (is_admin) OU master via profiles.is_master.
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin && !profile?.is_master) return json(403, { error: "Sem permissão" });

    const body = await req.json().catch(() => ({}));
    let orgId: string | null = profile?.organization_id ?? null;
    // Apenas masters podem emitir chaves para outra organização.
    if (body.organization_id && profile?.is_master) orgId = body.organization_id;
    if (!orgId) return json(400, { error: "organization_id não resolvido" });

    const validScopes = (Array.isArray(body.scopes) ? body.scopes : ["read"])
      .filter((s: string) => s === "read" || s === "write");

    // Gera a chave: totum_sk_<32 hex>
    const rand = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    const fullKey = `totum_sk_${rand}`;
    const keyHash = await sha256Hex(fullKey);
    const keyPrefix = fullKey.slice(0, 16);

    const { data, error } = await admin
      .from("api_keys")
      .insert({
        organization_id: orgId,
        name: (body.name as string)?.trim() || "API Key",
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: validScopes.length ? validScopes : ["read"],
        expires_at: body.expires_at || null,
        created_by: user.id,
      })
      .select("id, name, key_prefix, scopes, is_active, expires_at, created_at")
      .single();

    if (error) return json(400, { error: error.message });

    // A chave completa é retornada UMA ÚNICA vez.
    return json(200, { ...data, key: fullKey });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
