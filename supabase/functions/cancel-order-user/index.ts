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

    // 1. Fetch the target order (support both UUID id and order_number)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id);
    let query = supabase.from("orders").select("id, order_number, order_status, total_amount, subtotal");
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

    // Only allow cancellation for placed, confirmed, or processing orders
    const cancellableStatuses = ["placed", "order placed", "confirmed", "processing"];
    const isCancellable = cancellableStatuses.includes(rawStatus);

    if (!isCancellable) {
      return new Response(
        JSON.stringify({
          error: `Cannot cancel order in status: ${order.order_status}. Only placed, confirmed, and processing orders can be cancelled.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict payload: require order_item_id
    const order_item_id = body.order_item_id || body.item_id;
    if (!order_item_id || typeof order_item_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: order_item_id. Only item-by-item cancellation is supported." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch items belonging to this order
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (itemsErr || !orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not fetch items for order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the specific item to cancel
    const targetItem = orderItems.find((item: any) => {
      if (item.id === order_item_id) return true;
      if (item.inventory_id === order_item_id) return true;
      if (item.sku === order_item_id) return true;
      if (typeof item.product_snapshot === "object" && item.product_snapshot?.id === order_item_id) return true;
      return false;
    });

    if (!targetItem) {
      return new Response(
        JSON.stringify({ error: `Item ${order_item_id} not found in order ${order.order_number}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete the item from order_items
    const { error: deleteItemErr } = await supabase
      .from("order_items")
      .delete()
      .eq("id", targetItem.id);

    if (deleteItemErr) {
      console.error("Failed to delete order item:", deleteItemErr);
      return new Response(
        JSON.stringify({ error: "Failed to cancel item: " + deleteItemErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If this was the last remaining item, also update order status to cancelled
    const remainingCount = orderItems.length - 1;
    const isEntireOrderCancelled = remainingCount <= 0;

    // Recalculate totals
    const itemPrice = Number(targetItem.total_price || (Number(targetItem.unit_price || 0) * Number(targetItem.quantity || 1)));
    const newSubtotal = Math.max(0, Number(order.subtotal || 0) - itemPrice);
    const newTotal = Math.max(0, Number(order.total_amount || 0) - itemPrice);

    await supabase
      .from("orders")
      .update({
        subtotal: newSubtotal,
        total_amount: newTotal,
        order_status: isEntireOrderCancelled ? "cancelled" : order.order_status,
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    // Record status history
    await supabase
      .from("order_status_history")
      .insert({
        order_id: order.id,
        status: isEntireOrderCancelled ? "cancelled" : "item_cancelled",
        note: isEntireOrderCancelled
          ? `Cancelled "${targetItem.product_name}" (all items cancelled; order cancelled)`
          : `Cancelled "${targetItem.product_name}" from order`
      });

    return new Response(
      JSON.stringify({
        success: true,
        cancelledEntireOrder: isEntireOrderCancelled,
        newSubtotal,
        newTotal,
        message: `Cancelled "${targetItem.product_name}" successfully`,
        order_id: order.order_number,
        id: order.id,
        status: isEntireOrderCancelled ? "cancelled" : order.order_status
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
