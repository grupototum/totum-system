import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, status")
      .eq("email", email)
      .limit(1);

    let userId: string;

    if (existingProfiles && existingProfiles.length > 0) {
      // User exists - update their status to active
      userId = existingProfiles[0].user_id;
      await supabaseAdmin
        .from("profiles")
        .update({ status: "ativo", full_name: full_name || undefined })
        .eq("user_id", userId);
    } else {
      // Create new user via admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = authData.user.id;

      // Wait a moment for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile status to active
      await supabaseAdmin
        .from("profiles")
        .update({ status: "ativo" })
        .eq("user_id", userId);
    }

    // Ensure admin role exists in user_roles
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);

    if (!existingRole || existingRole.length === 0) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: "Admin user created/updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
