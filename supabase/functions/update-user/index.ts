
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
      return new Response(JSON.stringify({ message: "Hello from update-user Edge Function! I am reachable." }), {
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
      data: { user: requester },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requester) {
      console.error("Auth verification failed:", authError);
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid token'}`);
    }

    console.log(`DEBUG: Token verified. Requester: ${requester.id}. Checking DB role...`);
    const requesterId = requester.id;
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterId)
      .single();

    console.log(`DEBUG: Requester role found in DB: "${requesterProfile?.role}".`);
    if (profileError || !requesterProfile || requesterProfile.role?.toLowerCase() !== "admin") {
      console.error("Permission error:", profileError || "Not an admin");
      throw new Error(`Access Denied: You must be an admin to update employees (Found role: ${requesterProfile?.role || 'NONE'})`);
    }

    const { userId, email, password, name, role, avatar_url } = await req.json();
    if (!userId) throw new Error("User ID is required for update");

    console.log(`DEBUG: Target User ID: ${userId}.`);
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetError || !targetProfile) {
      console.warn("Target user profile not found, but continuing to update Auth if possible.");
    }

    // Standard two-role check
    if (role && role !== "admin" && role !== "employee") {
      throw new Error("Invalid role. Role must be 'admin' or 'employee'");
    }

    const userMetadata: any = {};
    if (name) userMetadata.full_name = name;
    if (role) userMetadata.role = role;
    if (avatar_url) userMetadata.avatar_url = avatar_url;

    const updateData: any = {};
    if (Object.keys(userMetadata).length > 0) updateData.user_metadata = userMetadata;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    updateData.email_confirm = true;

    console.log(`DEBUG: Updating Auth User Data for ${userId}...`);
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
    if (updateError) {
      console.error("Update Auth User error:", updateError);
      throw updateError;
    }

    console.log("DEBUG: User updated successfully in Auth. Profile trigger should handle the rest.");
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
