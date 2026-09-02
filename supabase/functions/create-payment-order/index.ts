import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const IS_PROD = Deno.env.get("CASHFREE_ENV") === "production";
    const BASE_URL = IS_PROD
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:3000";

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { orderId, customerName, customerPhone, customerEmail, userId } =
      await req.json();

    if (!orderId || !customerPhone) {
      return new Response(
        JSON.stringify({ error: "Missing required order details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Load the order from the database (authoritative).
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, payment_status, shipping_fee, discount")
      .eq("order_number", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.payment_status === "paid") {
      return new Response(
        JSON.stringify({ error: "Order already paid" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Recompute the amount from inventory.selling_price (server price authority).
    const { data: items } = await supabase
      .from("order_items")
      .select("inventory_id, quantity")
      .eq("order_id", order.id);

    let serverSubtotal = 0;
    if (items && items.length > 0) {
      const { data: inventory } = await supabase
        .from("storefront_products")
        .select("id, selling_price")
        .in("id", items.map((i: any) => i.inventory_id));

      const priceMap = new Map(
        (inventory ?? []).map((row: any) => [row.id, Number(row.selling_price)])
      );

      for (const it of items) {
        const price = priceMap.get(it.inventory_id);
        if (price === undefined) {
          return new Response(
            JSON.stringify({ error: "Product price not found; order rejected" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        serverSubtotal += price * it.quantity;
      }
    }

    const serverAmount = Math.round(
      (serverSubtotal - (Number(order.discount) || 0) + (Number(order.shipping_fee) || 0)) * 100
    ) / 100;

    // Clean phone number (Cashfree expects 10 digit number)
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);

    // 3. Never trust the client amount — charge the server amount.
    const payload = {
      order_id: orderId,
      order_amount: serverAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId || order.id || `CUST_${cleanPhone}`,
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
        amount: serverAmount,
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