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
      return new Response(JSON.stringify({ message: "Hello from delete-user Edge Function! I am reachable." }), {
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

    console.log(`DEBUG: SERVICE_ROLE_KEY prefix: "${serviceRoleKey.substring(0, 15)}..."`);

    // Let's count profiles to see if we can even see the table
    const { count, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    console.log(`DEBUG: Total Profiles in DB: ${count ?? 0}. Count Error: ${countError?.message || 'NONE'}`);

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

    const requesterId = user.id;
    console.log(`DEBUG: Token verified. Requester: ${requesterId}. Checking DB role...`);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterId)
      .single();

    console.log(`DEBUG: Searching for ID: ${requesterId}. Result: ${profile ? JSON.stringify(profile) : 'NULL'}. Error: ${profileError?.message || 'NONE'}`);
    
    if (profileError || !profile || profile.role?.toLowerCase() !== "admin") {
      console.error("Permission error:", profileError?.message || "Not an admin");
      throw new Error(`Access Denied: You must be an admin to delete employees (Requester ID: ${requesterId}, Total Profiles: ${count ?? 0}, Found role: ${profile?.role || 'NONE'})`);
    }

    const { userId } = await req.json();
    if (!userId) throw new Error('User ID is required');
    
    if (user.id === userId) throw new Error("You cannot delete your own account");

    console.log(`DEBUG: Attempting to delete user ${userId}...`);
    const { data: userData, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getError) {
      console.warn("Could not find target user in Auth, but proceeding to delete from Profile if necessary.");
    }

    const avatarUrl = userData?.user?.user_metadata?.avatar_url;
    if (avatarUrl) {
      try {
        const fileName = avatarUrl.split('/').pop();
        await supabaseAdmin.storage.from('avatars').remove([fileName]);
        console.log("DEBUG: Avatar deleted successfully.");
      } catch (e) {
        console.warn("Avatar delete failed (ignoring):", e.message);
      }
    }

    const { data, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Delete Auth User error:", deleteError);
      throw deleteError;
    }

    console.log("DEBUG: User deleted successfully from Auth and Storage. Profile trigger should handle the rest.");
    return new Response(JSON.stringify({ message: 'User deleted successfully', data }), {
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
      status: 400, // Return 400 so we can see the error in 'data'
    });
  }
})