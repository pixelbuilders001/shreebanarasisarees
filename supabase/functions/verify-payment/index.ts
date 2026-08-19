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
    const IS_PROD = Deno.env.get("CASHFREE_ENV") === "production";
    const BASE_URL = IS_PROD
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET) {
      throw new Error("Cashfree API keys missing in environment variables");
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify order status directly with Cashfree PG API
    const cfResponse = await fetch(`${BASE_URL}/orders/${orderId}`, {
      headers: {
        "x-api-version": "2025-01-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET,
      },
    });

    const data = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error("Cashfree verification error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to verify order status with Cashfree" }),
        { status: cfResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderStatus = data.order_status; // "PAID", "ACTIVE", "EXPIRED", etc.

    // If order is PAID, update order status in Supabase Database
    if (orderStatus === "PAID") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: orderRow, error: fetchErr } = await supabase
          .from("orders")
          .select("id, payment_status, total_amount")
          .eq("order_number", orderId)
          .single();

        if (!fetchErr && orderRow) {
          if (orderRow.payment_status !== "paid") {
            const cfAmount = Number(data.order_amount);
            const dbAmount = Number(orderRow.total_amount);

            if (Math.abs(cfAmount - dbAmount) > 0.01) {
              console.error(`Amount mismatch for order ${orderId}: Cashfree ${cfAmount} vs DB ${dbAmount}`);
              return new Response(
                JSON.stringify({ error: "Payment amount does not match order total" }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                order_status: "confirmed",
                notes: `Online payment verified via Cashfree. CF Order ID: ${data.cf_order_id}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderRow.id);

            await supabase.from("order_status_history").insert({
              order_id: orderRow.id,
              status: "confirmed",
              note: "Payment received & verified via Cashfree Hosted Checkout",
            });

            // Send payment confirmation email with the current (paid) status
            const { data: fullOrder } = await supabase
              .from("orders")
              .select("*, order_items(*)")
              .eq("id", orderRow.id)
              .single();

            if (fullOrder) {
              const sa = fullOrder.shipping_address || {};
              const emailOrder = {
                orderId: fullOrder.order_number,
                customerName: fullOrder.customer_name || sa.name || "Valued Customer",
                customerEmail: fullOrder.customer_email,
                customerPhone: fullOrder.customer_phone || sa.phone || "",
                address: sa.address || "Store Pickup",
                city: sa.city || "Samastipur",
                state: sa.state || "Bihar",
                pinCode: sa.pinCode || "848103",
                deliveryMethod: sa.deliveryMethod || "Home Delivery",
                items: (fullOrder.order_items || []).map((it: any) => ({
                  name: it.product_name || "Banarasi Saree",
                  quantity: it.quantity || 1,
                  price: it.unit_price || 0,
                })),
                subtotal: fullOrder.subtotal,
                shipping: fullOrder.shipping_fee,
                discount: fullOrder.discount,
                total: fullOrder.total_amount,
                paymentMethod: "Online Payment",
                paymentStatus: "Paid",
                isGift: fullOrder.is_gift,
                giftRecipientName: fullOrder.gift_recipient_name,
                giftMessage: fullOrder.gift_message,
              };

              await supabase.functions.invoke("send-email", {
                body: { action: "ORDER_CONFIRMED", order: emailOrder },
              });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        order_status: orderStatus,
        cf_order_id: data.cf_order_id,
        order_amount: data.order_amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Verify payment edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
