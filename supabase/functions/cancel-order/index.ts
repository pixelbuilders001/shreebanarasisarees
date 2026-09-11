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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order_id = body.order_id || body.orderId || body.order_number;
    if (!order_id || typeof order_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Authenticate caller via JWT token
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^bearer\s+/i, "").trim();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch caller role from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, phone_number")
      .eq("id", user.id)
      .maybeSingle();

    const callerRole = (profile?.role || "user").toLowerCase().trim();
    const isAdminOrStaff = callerRole === "admin" || callerRole === "staff";

    // 3. Fetch the target order (support both UUID id and order_number)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id);
    let query = supabase
      .from("orders")
      .select("id, order_number, order_status, total_amount, subtotal, user_id, customer_phone");

    if (isUuid) {
      query = query.eq("id", order_id);
    } else {
      query = query.eq("order_number", order_id);
    }

    const { data: order, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !order) {
      console.error("Order lookup error:", fetchErr);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Ownership verification: If caller is not admin or staff, they must own the order
    if (!isAdminOrStaff) {
      const isOwner = order.user_id === user.id;

      // Also allow if it was an unassigned guest order and the profile phone matches the order phone
      const profilePhone = profile?.phone_number ? String(profile.phone_number).replace(/\D/g, "").slice(-10) : null;
      const orderPhone = order.customer_phone ? String(order.customer_phone).replace(/\D/g, "").slice(-10) : null;
      const isGuestPhoneMatch = !order.user_id && profilePhone && orderPhone && profilePhone === orderPhone;

      if (!isOwner && !isGuestPhoneMatch) {
        return new Response(
          JSON.stringify({ error: "Forbidden: You do not have permission to cancel this order" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const rawStatus = (order.order_status || "").toLowerCase().trim();

    // If already cancelled, return success
    if (rawStatus === "cancelled") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Order is already cancelled",
          order_id: order.order_number,
          id: order.id,
          status: "cancelled"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow cancellation for placed, confirmed, processing, or packed orders
    const cancellableStatuses = ["placed", "order placed", "confirmed", "processing", "packed"];
    const isCancellable = cancellableStatuses.includes(rawStatus);

    if (!isCancellable) {
      return new Response(
        JSON.stringify({
          error: `Cannot cancel order in status: ${order.order_status}. Only placed, confirmed, processing, and packed orders can be cancelled.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Update order status to 'cancelled' (Service Role bypasses RLS)
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    if (updateErr) {
      console.error("Failed to update order status:", updateErr);
      return new Response(
        JSON.stringify({ error: "Failed to update order status: " + updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also update all order items to item_status = 'cancelled'
    const { error: itemsUpdateErr } = await supabase
      .from("order_items")
      .update({
        item_status: "cancelled"
      })
      .eq("order_id", order.id);

    if (itemsUpdateErr) {
      console.warn("Could not update order items to cancelled:", itemsUpdateErr);
    }

    const cancellerNote = isAdminOrStaff
      ? `Order cancelled by ${callerRole}: ${body.note || body.reason || "Administrative cancellation"}`
      : (body.note || body.reason || "Order cancelled by customer");

    // 3. Record status history entry
    const { error: historyErr } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order.id,
        status: "cancelled",
        note: cancellerNote
      });

    if (historyErr) {
      console.warn("Could not insert order status history entry:", historyErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order cancelled successfully",
        order_id: order.order_number,
        id: order.id,
        status: "cancelled"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Exception in cancel-order Edge Function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
