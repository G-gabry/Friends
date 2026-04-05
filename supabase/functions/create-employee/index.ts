
import "@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const isProbe = req.headers.get("x-probe") === "true";
    if (isProbe) {
      console.log("DEBUG: Probe request received. Function is reachable.");
      return new Response(JSON.stringify({ message: "Hello from create-employee Edge Function! I am reachable." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Try to get the service role key from multiple possible names
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || 
                          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey) {
      console.error("CRITICAL: SERVICE_ROLE_KEY is missing from environment secrets.");
      throw new Error("Server Misconfiguration: SERVICE_ROLE_KEY is missing. Please set it using 'supabase secrets set SERVICE_ROLE_KEY=...'");
    }

    console.log(`DEBUG: SERVICE_ROLE_KEY found (prefix: ${serviceRoleKey.substring(0, 10)}...)`);

    const supabaseAdmin = createClient(supabaseUrl ?? '', serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing auth header (Authorization)");
      throw new Error("Missing auth header (Authorization)");
    }
    const token = authHeader.replace('Bearer ', '');

    console.log("DEBUG: Verifying user token with admin client...");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth verification failed:", authError);
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid token'}`);
    }

    console.log(`DEBUG: Token verified. Requester: ${user.id}. Checking DB role...`);
    const requesterId = user.id;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterId)
      .single();

    console.log(`DEBUG: Requester role found in DB: "${profile?.role}".`);
    if (profileError || !profile || profile.role?.toLowerCase() !== "admin") {
      console.error("Permission error:", profileError || "Not an admin");
      throw new Error(`Access Denied: You must be an admin to create employees (Found role: ${profile?.role || 'NONE'})`);
    }

    const { email, password, name, role, avatar_url } = await req.json();

    if (!email || !password || !name || !role) {
      throw new Error("All fields (email, password, name, role) are required");
    }

    if (role !== "admin" && role !== "employee") {
      throw new Error("Invalid role. Role must be 'admin' or 'employee'");
    }

    console.log(`DEBUG: Attempting to create user ${email}...`);
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role, avatar_url }
    });

    if (createError) {
      console.error("Create User error:", createError);
      throw createError;
    }

    console.log("DEBUG: User created successfully in Auth. Profile trigger should handle the rest.");
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("GLOBAL CATCH:", error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})