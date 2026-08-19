import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID");
    const CASHFREE_SECRET = Deno.env.get("CASHFREE_SECRET_KEY");
    const IS_PROD = Deno.env.get("CASHFREE_ENV") === "production";
    const BASE_URL = IS_PROD
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:3000";

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET) {
      throw new Error("Cashfree API keys missing in environment variables");
    }

    const { orderId, amount, customerName, customerPhone, customerEmail, userId } =
      await req.json();

    if (!orderId || !amount || !customerPhone) {
      return new Response(
        JSON.stringify({ error: "Missing required order details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number (Cashfree expects 10 digit number)
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);

    const payload = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: userId || `CUST_${cleanPhone}`,
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "customer@shreebanarasisarees.com",
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: `${APP_URL}/payment/status?order_id=${orderId}`,
      },
    };

    const cfResponse = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "x-api-version": "2025-01-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error("Cashfree API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Cashfree order creation failed" }),
        { status: cfResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        payment_session_id: data.payment_session_id,
        cf_order_id: data.cf_order_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
