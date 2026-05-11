import { createClient } from "jsr:@supabase/supabase-js@2";

const VERCEL_TOKEN      = Deno.env.get("VERCEL_TOKEN") ?? Deno.env.get("Verce_token") ?? "";
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID") ?? "prj_qguwQfF2l6ibecnLdpCXND3A6ZrM";
const VERCEL_TEAM_ID    = Deno.env.get("VERCEL_TEAM_ID")    ?? "team_rR93irV9qw4tvRoJy8ESDohW";
const BASE_DOMAIN       = Deno.env.get("BASE_DOMAIN")       ?? "pixelsystem.online";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InitialUser {
  email: string;
  password: string;
  full_name?: string;
  is_admin?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate via Supabase JWT — must be master user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is master
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("is_master")
      .eq("user_id", user.id)
      .single();

    if (!callerProfile?.is_master) {
      return new Response(JSON.stringify({ error: "Forbidden: only master users can provision tenants" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      subdomain,
      org_name,
      org_slug,
      logo_url,
      primary_color,
      initial_users = [],
    } = body as {
      subdomain: string;
      org_name: string;
      org_slug: string;
      logo_url?: string;
      primary_color?: string;
      initial_users?: InitialUser[];
    };

    if (!subdomain || !org_name || !org_slug) {
      return new Response(JSON.stringify({ error: "subdomain, org_name e org_slug são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    const hostname = `${cleanSubdomain}.${BASE_DOMAIN}`;

    // 1. Check subdomain availability
    const { data: available } = await supabase.rpc("check_subdomain_available", {
      _subdomain: cleanSubdomain,
    });

    if (!available) {
      return new Response(JSON.stringify({ error: `Subdomínio '${cleanSubdomain}' já está em uso` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create org in DB
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: org_name,
        slug: org_slug,
        subdomain: cleanSubdomain,
        logo_url: logo_url ?? null,
        primary_color: primary_color ?? null,
        vercel_domain_status: "pending",
        is_active: true,
      })
      .select()
      .single();

    if (orgError) {
      return new Response(JSON.stringify({ error: orgError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Add domain to Vercel
    let vercelStatus = "active";
    let vercelError  = null;

    if (VERCEL_TOKEN) {
      const vercelRes = await fetch(
        `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: hostname }),
        }
      );

      const vercelData = await vercelRes.json();

      if (!vercelRes.ok) {
        vercelStatus = "error";
        vercelError  = vercelData?.error?.message ?? "Erro desconhecido no Vercel";
        console.error("[provision-subdomain] Vercel error:", vercelData);
      }
    } else {
      vercelStatus = "no_token";
      console.warn("[provision-subdomain] VERCEL_TOKEN não configurado");
    }

    // 4. Update org with final Vercel status
    await supabase
      .from("organizations")
      .update({ vercel_domain_status: vercelStatus })
      .eq("id", org.id);

    // 5. Create initial users for the new tenant (if provided)
    const createdUsers: Array<{ email: string; status: string; error?: string }> = [];

    for (const u of initial_users) {
      try {
        const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            full_name: u.full_name ?? u.email.split("@")[0],
            organization_id: org.id,
            client_id: org_slug,
            is_master: false,
          },
        });

        if (userErr) {
          createdUsers.push({ email: u.email, status: "error", error: userErr.message });
        } else {
          createdUsers.push({ email: u.email, status: "created" });
        }
      } catch (err) {
        createdUsers.push({ email: u.email, status: "error", error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        organization: { ...org, vercel_domain_status: vercelStatus },
        hostname,
        vercel_error: vercelError,
        created_users: createdUsers,
        message: vercelStatus === "active"
          ? `Subdomínio ${hostname} provisionado com sucesso!`
          : `Organização criada. Configure o DNS manualmente: CNAME ${hostname} → cname.vercel-dns.com`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[provision-subdomain] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
