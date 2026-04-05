import "@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    const ONESIGNAL_APP_ID = "2b1a2a08-fa45-43cd-b4ca-33e02f06a317";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" 
    );

    if (!ONESIGNAL_REST_API_KEY) {
      return new Response("Missing OneSignal API Key", { status: 500 });
      }

    const { record } = await req.json();

    const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'owner']);
    const adminIds = admins?.map(admin => admin.id) || [];

    const { data: userData } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', record.user_id)
    .single();
const customerName = userData?.full_name || "New User";

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: adminIds, 
        web_push_topic: record.id 
        headings: { en: "New Order!" },
        contents: { 
          en: `Order #${record.invoice} by ${customerName}. Total: \$${record.total_price}`,
        },

// ${record.id}
        url: `https://zaki-dashboard.vercel.app/dashboard/orders/`,
        chrome_web_icon: "https://qpxgafmzblnjcztkwenf.supabase.co/storage/v1/object/public/avatars/icons/Zaki-Dashboard-Logo2.png",
        firefox_icon: "https://qpxgafmzblnjcztkwenf.supabase.co/storage/v1/object/public/avatars/icons/Zaki-Dashboard-Logo2.png",
        small_icon: "https://qpxgafmzblnjcztkwenf.supabase.co/storage/v1/object/public/avatars/icons/Zaki-Dashboard-Logo2.png",
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { status: 200 });

  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
})
