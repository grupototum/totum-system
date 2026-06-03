import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ============================================================
// Totum REST API v1 — autenticada por API key (totum_sk_...).
// Toda query é estritamente filtrada por organization_id da chave.
// Erros no formato RFC 7807 (application/problem+json).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function problem(status: number, title: string, detail?: string, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ type: "about:blank", title, status, detail, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/problem+json" },
  });
}

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function pick(o: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in o) out[k] = o[k];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 1. Autenticação via API key.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token.startsWith("totum_sk_")) {
    return problem(401, "Unauthorized", "Forneça uma API key válida no header Authorization: Bearer totum_sk_...");
  }

  const keyHash = await sha256Hex(token);
  const { data: key } = await admin
    .from("api_keys")
    .select("id, organization_id, scopes, is_active, expires_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!key || !key.is_active) return problem(401, "Unauthorized", "API key inválida ou revogada");
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return problem(401, "Unauthorized", "API key expirada");
  }

  const orgId: string = key.organization_id;
  const canWrite = (key.scopes || []).includes("write");

  // Marca uso (best-effort, não bloqueia a resposta em caso de falha).
  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);

  // 2. Roteamento manual.
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/api-v1/, "").replace(/\/+$/, "") || "/";
  const seg = path.split("/").filter(Boolean); // ex.: ["v1","projects","<id>"]
  const m = req.method;

  if (seg[0] !== "v1") return problem(404, "Not Found", "Rota desconhecida");

  const requireWrite = () => (canWrite ? null : problem(403, "Forbidden", "Esta chave não possui o escopo 'write'"));
  const pagination = () => {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 100);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
    return { limit, offset };
  };
  // Em writes, o client_id precisa pertencer à org da chave (o trigger carimba a org a partir do client).
  const assertClientInOrg = async (clientId: string) => {
    const { data } = await admin.from("clients").select("id").eq("id", clientId).eq("organization_id", orgId).maybeSingle();
    return !!data;
  };

  try {
    const resource = seg[1];
    const id = seg[2];

    // ───────────── PROJECTS ─────────────
    if (resource === "projects" && !id) {
      if (m === "GET") {
        const { limit, offset } = pagination();
        const { data, count, error } = await admin
          .from("projects")
          .select("*", { count: "exact" })
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return problem(400, "Bad Request", error.message);
        return ok({ data, meta: { limit, offset, totalCount: count ?? 0 } });
      }
      if (m === "POST") {
        const w = requireWrite(); if (w) return w;
        const b = await req.json().catch(() => ({}));
        if (!b.client_id || !b.name) return problem(422, "Unprocessable Entity", "client_id e name são obrigatórios");
        if (!(await assertClientInOrg(b.client_id))) return problem(422, "Unprocessable Entity", "client_id não pertence à sua organização");
        const { data, error } = await admin
          .from("projects")
          .insert({
            name: b.name,
            description: b.description ?? null,
            client_id: b.client_id,
            contract_id: b.contract_id ?? null,
            responsible_id: b.responsible_id ?? null,
            status: b.status ?? "pendente",
            start_date: b.start_date ?? null,
            due_date: b.due_date ?? null,
          })
          .select("*")
          .single();
        if (error) return problem(400, "Bad Request", error.message);
        return ok(data, 201);
      }
      return problem(405, "Method Not Allowed");
    }

    if (resource === "projects" && id) {
      if (m === "GET") {
        const { data } = await admin.from("projects").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
        return data ? ok(data) : problem(404, "Not Found", "Projeto não encontrado", { instance: path });
      }
      if (m === "PATCH") {
        const w = requireWrite(); if (w) return w;
        const b = await req.json().catch(() => ({}));
        const updates = pick(b, ["name", "description", "status", "contract_id", "responsible_id", "start_date", "due_date"]);
        const { data, error } = await admin
          .from("projects").update(updates).eq("id", id).eq("organization_id", orgId).select("*").maybeSingle();
        if (error) return problem(400, "Bad Request", error.message);
        return data ? ok(data) : problem(404, "Not Found", "Projeto não encontrado", { instance: path });
      }
      return problem(405, "Method Not Allowed");
    }

    // ───────────── TASKS ─────────────
    if (resource === "tasks" && !id) {
      if (m === "GET") {
        const { limit, offset } = pagination();
        let q = admin.from("tasks").select("*", { count: "exact" }).eq("organization_id", orgId);
        const projectId = url.searchParams.get("project_id");
        const status = url.searchParams.get("status");
        if (projectId) q = q.eq("project_id", projectId);
        if (status) q = q.eq("status", status);
        const { data, count, error } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        if (error) return problem(400, "Bad Request", error.message);
        return ok({ data, meta: { limit, offset, totalCount: count ?? 0 } });
      }
      if (m === "POST") {
        const w = requireWrite(); if (w) return w;
        const b = await req.json().catch(() => ({}));
        if (!b.client_id || !b.title) return problem(422, "Unprocessable Entity", "client_id e title são obrigatórios");
        if (!(await assertClientInOrg(b.client_id))) return problem(422, "Unprocessable Entity", "client_id não pertence à sua organização");
        const { data, error } = await admin
          .from("tasks")
          .insert({
            title: b.title,
            description: b.description ?? null,
            client_id: b.client_id,
            project_id: b.project_id ?? null,
            contract_id: b.contract_id ?? null,
            responsible_id: b.responsible_id ?? null,
            status: b.status ?? "pendente",
            priority: b.priority ?? "media",
            task_type: b.task_type ?? "outro",
            start_date: b.start_date ?? null,
            due_date: b.due_date ?? null,
          })
          .select("*")
          .single();
        if (error) return problem(400, "Bad Request", error.message);
        return ok(data, 201);
      }
      return problem(405, "Method Not Allowed");
    }

    if (resource === "tasks" && id) {
      if (m === "GET") {
        const { data } = await admin.from("tasks").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
        return data ? ok(data) : problem(404, "Not Found", "Tarefa não encontrada", { instance: path });
      }
      if (m === "PATCH") {
        const w = requireWrite(); if (w) return w;
        const b = await req.json().catch(() => ({}));
        const updates = pick(b, ["title", "description", "status", "priority", "task_type", "project_id", "contract_id", "responsible_id", "start_date", "due_date"]);
        const { data, error } = await admin
          .from("tasks").update(updates).eq("id", id).eq("organization_id", orgId).select("*").maybeSingle();
        if (error) return problem(400, "Bad Request", error.message);
        return data ? ok(data) : problem(404, "Not Found", "Tarefa não encontrada", { instance: path });
      }
      return problem(405, "Method Not Allowed");
    }

    return problem(404, "Not Found", "Rota desconhecida", { instance: path });
  } catch (e) {
    return problem(500, "Internal Server Error", String(e));
  }
});
