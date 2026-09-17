import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedStatuses = [
  "placed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

// Helper to restore inventory stock
async function restoreInventory(adminClient: any, item: any) {
  const invId =
    item.inventory_id ||
    (typeof item.product_snapshot === "object" ? item.product_snapshot?.id : null);

  let inventory = null;

  if (invId) {
    const { data } = await adminClient
      .from("inventory")
      .select("id, stock, status")
      .eq("id", invId)
      .maybeSingle();
    inventory = data;
  }

  if (!inventory && item.sku) {
    const { data } = await adminClient
      .from("inventory")
      .select("id, stock, status")
      .eq("sku", item.sku)
      .maybeSingle();
    inventory = data;
  }

  if (!inventory) {
    console.warn(`Inventory not found for item ${item.id} (invId: ${invId}, sku: ${item.sku})`);
    return null;
  }

  const currentStock = Number(inventory.stock || 0);
  const quantityToRestore = Number(item.quantity || 1);
  const newStock = currentStock + quantityToRestore;

  const updatePayload: any = {
    stock: newStock,
  };

  // Reactivate product if it was marked inactive
  if (inventory.status === "inactive" && newStock > 0) {
    updatePayload.status = "active";
  }

  const { data: updatedInventory, error: stockError } = await adminClient
    .from("inventory")
    .update(updatePayload)
    .eq("id", inventory.id)
    .select("id, stock, status")
    .single();

  if (stockError || !updatedInventory) {
    throw new Error(`Failed to restore inventory stock: ${stockError?.message || "Update failed"}`);
  }

  console.log(`Restored stock for inventory ${inventory.id}: ${currentStock} -> ${newStock}`);
  return updatedInventory;
}

// Helper to handle referral coin maturation and redemption refunds on status transitions
async function handleCoinTransitionsOnStatusChange(
  adminClient: any,
  orderId: string,
  orderNumber: string,
  newStatus: string
) {
  const norm = (newStatus || "").toLowerCase();

  // 1. If delivered: schedule maturation after the admin's return window
  if (norm === "delivered") {
    try {
      const { data: refSettings } = await adminClient
        .from("referral_settings")
        .select("return_window_days")
        .eq("id", "default")
        .maybeSingle();

      const returnWindowDays = Math.max(0, Number(refSettings?.return_window_days ?? 7));
      const nowMs = Date.now();
      const maturationDate = new Date(nowMs + returnWindowDays * 24 * 60 * 60 * 1000).toISOString();

      const { data: pendingRewards } = await adminClient
        .from("coin_transactions")
        .select("*")
        .eq("order_id", orderId)
        .eq("type", "REFERRAL_REWARD")
        .eq("status", "PENDING");

      if (pendingRewards && pendingRewards.length > 0) {
        for (const rewardTx of pendingRewards) {
          const rewardAmt = Number(rewardTx.amount || 0);
          const referrerId = rewardTx.user_id;

          if (returnWindowDays > 0) {
            // Keep status as PENDING, but set expires_at as the return window maturation deadline
            await adminClient
              .from("coin_transactions")
              .update({
                expires_at: maturationDate,
                description: `Pending ${returnWindowDays}-day return window (matures ${maturationDate.split('T')[0]})`
              })
              .eq("id", rewardTx.id);
          } else {
            // Zero return window: mature immediately
            await adminClient
              .from("coin_transactions")
              .update({
                status: "COMPLETED",
                description: `Referral reward completed upon delivery`
              })
              .eq("id", rewardTx.id);

            const { data: refWallet } = await adminClient
              .from("user_wallets")
              .select("pending_balance, available_balance, total_earned")
              .eq("user_id", referrerId)
              .maybeSingle();

            if (refWallet) {
              const curPending = Number(refWallet.pending_balance || 0);
              const curAvail = Number(refWallet.available_balance || 0);
              const curEarned = Number(refWallet.total_earned || 0);

              await adminClient
                .from("user_wallets")
                .update({
                  pending_balance: Math.max(0, curPending - rewardAmt),
                  available_balance: curAvail + rewardAmt,
                  total_earned: curEarned + rewardAmt,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", referrerId);
            }

            await adminClient
              .from("referrals")
              .update({
                status: "REWARDED",
                rewarded_at: new Date().toISOString(),
              })
              .eq("qualifying_order_id", orderId);
          }
        }
      }
    } catch (maturationErr) {
      console.warn("Coin return window scheduling error on delivered:", maturationErr);
    }
  }

  // 1b. Sweep: Mature any transactions whose return window deadline has safely passed
  try {
    const { data: maturedList } = await adminClient
      .from("coin_transactions")
      .select("id, user_id, amount, order_id, expires_at")
      .eq("type", "REFERRAL_REWARD")
      .eq("status", "PENDING")
      .not("expires_at", "is", null)
      .lte("expires_at", new Date().toISOString());

    if (maturedList && maturedList.length > 0) {
      for (const mTx of maturedList) {
        if (!mTx.order_id) continue;
        const { data: oRow } = await adminClient
          .from("orders")
          .select("order_status")
          .eq("id", mTx.order_id)
          .maybeSingle();

        if (oRow?.order_status === "delivered") {
          const amt = Number(mTx.amount || 0);
          await adminClient
            .from("coin_transactions")
            .update({
              status: "COMPLETED",
              description: "Referral reward credited: Return window successfully completed"
            })
            .eq("id", mTx.id);

          const { data: wRow } = await adminClient
            .from("user_wallets")
            .select("pending_balance, available_balance, total_earned")
            .eq("user_id", mTx.user_id)
            .maybeSingle();

          if (wRow) {
            await adminClient
              .from("user_wallets")
              .update({
                pending_balance: Math.max(0, Number(wRow.pending_balance || 0) - amt),
                available_balance: Number(wRow.available_balance || 0) + amt,
                total_earned: Number(wRow.total_earned || 0) + amt,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", mTx.user_id);
          }

          await adminClient
            .from("referrals")
            .update({
              status: "REWARDED",
              rewarded_at: new Date().toISOString()
            })
            .eq("qualifying_order_id", mTx.order_id);
        }
      }
    }
  } catch (sweepErr) {
    console.warn("Matured coins sweep warning:", sweepErr);
  }

  // 2. If cancelled or returned: void pending referral reward & refund redeemed coins
  if (norm === "cancelled" || norm === "returned") {
    try {
      // Void pending referral rewards
      const { data: pendingRewards } = await adminClient
        .from("coin_transactions")
        .select("*")
        .eq("order_id", orderId)
        .eq("type", "REFERRAL_REWARD")
        .eq("status", "PENDING");

      if (pendingRewards && pendingRewards.length > 0) {
        for (const rewardTx of pendingRewards) {
          const rewardAmt = Number(rewardTx.amount || 0);
          const referrerId = rewardTx.user_id;

          await adminClient
            .from("coin_transactions")
            .update({ status: "CANCELLED" })
            .eq("id", rewardTx.id);

          const { data: refWallet } = await adminClient
            .from("user_wallets")
            .select("pending_balance")
            .eq("user_id", referrerId)
            .maybeSingle();

          if (refWallet) {
            const curPending = Number(refWallet.pending_balance || 0);
            await adminClient
              .from("user_wallets")
              .update({
                pending_balance: Math.max(0, curPending - rewardAmt),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", referrerId);
          }

          await adminClient
            .from("referrals")
            .update({ status: "VOIDED" })
            .eq("qualifying_order_id", orderId);
        }
      }

      // Refund any coins redeemed by the customer
      const { data: redemptionTxs } = await adminClient
        .from("coin_transactions")
        .select("*")
        .eq("order_id", orderId)
        .eq("type", "ORDER_REDEMPTION")
        .eq("status", "COMPLETED");

      if (redemptionTxs && redemptionTxs.length > 0) {
        for (const redTx of redemptionTxs) {
          const refundCoins = Math.abs(Number(redTx.amount || 0));
          const customerUserId = redTx.user_id;

          if (refundCoins > 0 && customerUserId) {
            const { data: existingRefund } = await adminClient
              .from("coin_transactions")
              .select("id")
              .eq("order_id", orderId)
              .eq("type", "ORDER_CANCELLED_REFUND")
              .maybeSingle();

            if (!existingRefund) {
              await adminClient.from("coin_transactions").insert({
                user_id: customerUserId,
                amount: refundCoins,
                type: "ORDER_CANCELLED_REFUND",
                status: "COMPLETED",
                order_id: orderId,
                description: `Refund of ${refundCoins} Banarasi Coins for cancelled order #${orderNumber || ''}`,
              });

              const { data: custWallet } = await adminClient
                .from("user_wallets")
                .select("available_balance")
                .eq("user_id", customerUserId)
                .maybeSingle();

              if (custWallet) {
                await adminClient
                  .from("user_wallets")
                  .update({
                    available_balance: Number(custWallet.available_balance || 0) + refundCoins,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", customerUserId);
              }
            }
          }
        }
      }
    } catch (voidErr) {
      console.warn("Coin void/refund error on cancellation:", voidErr);
    }
  }
}

Deno.serve(async (req) => {
  // --------------------------------------------------
  // CORS
  // --------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // --------------------------------------------------
    // ENV
    // --------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --------------------------------------------------
    // AUTH CLIENT
    // --------------------------------------------------
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // --------------------------------------------------
    // ADMIN CLIENT (Service role bypasses RLS)
    // --------------------------------------------------
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // --------------------------------------------------
    // CHECK ADMIN / STAFF ROLE IN PROFILES
    // --------------------------------------------------
    // In this database, user roles are strictly: 'admin', 'staff', 'user'.
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    const callerRole = (profile?.role || "user").toLowerCase().trim();

    // STRICT CHECK: Only admin and staff are permitted to update order status
    if (callerRole !== "admin" && callerRole !== "staff") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Forbidden: Admin or staff access required to update order status",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------
    const body = await req.json();

    const {
      order_id,
      order_item_id,
      status,
      note,
    } = body;

    if (!order_id) {
      throw new Error("order_id is required");
    }

    if (!status) {
      throw new Error("status is required");
    }

    const normalizedStatus = status.toLowerCase().trim();

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid order status: ${status}`);
    }

    // --------------------------------------------------
    // GET ORDER
    // --------------------------------------------------
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id);
    let orderQuery = adminClient.from("orders").select("*");
    if (isUuid) {
      orderQuery = orderQuery.eq("id", order_id);
    } else {
      orderQuery = orderQuery.eq("order_number", order_id);
    }

    const { data: order, error: orderError } = await orderQuery.maybeSingle();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // ==================================================
    // CANCEL SINGLE ITEM
    // ==================================================
    if (normalizedStatus === "cancelled" && order_item_id) {
      console.log(
        `User ${user.id} cancelling item ${order_item_id} from order ${order.id}`
      );

      // ----------------------------------------------
      // Get all order items for this order
      // ----------------------------------------------
      const { data: allItems, error: itemsError } = await adminClient
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsError || !allItems || allItems.length === 0) {
        throw new Error("Order items not found");
      }

      // Locate target item (match by id, inventory_id, sku, or snapshot)
      const item = allItems.find((it: any) =>
        it.id === order_item_id ||
        it.inventory_id === order_item_id ||
        it.sku === order_item_id ||
        (typeof it.product_snapshot === "object" && it.product_snapshot?.id === order_item_id)
      );

      if (!item) {
        throw new Error(`Order item ${order_item_id} not found in order ${order.order_number || order.id}`);
      }

      // Already cancelled?
      if ((item.item_status || "").toLowerCase() === "cancelled") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Order item is already cancelled",
            order_id: order.id,
            order_item_id: item.id,
            order_status: order.order_status,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----------------------------------------------
      // Restore inventory stock
      // ----------------------------------------------
      const updatedInventory = await restoreInventory(adminClient, item);

      // ----------------------------------------------
      // Mark item cancelled in order_items
      // ----------------------------------------------
      const { error: itemUpdateError } = await adminClient
        .from("order_items")
        .update({
          item_status: "cancelled",
        })
        .eq("id", item.id);

      if (itemUpdateError) {
        throw new Error(`Failed to cancel order item: ${itemUpdateError.message}`);
      }

      // ----------------------------------------------
      // Get remaining active items (exclude cancelled, treat NULL as active)
      // ----------------------------------------------
      const remainingItems = allItems.filter(
        (it: any) => it.id !== item.id && (it.item_status || "").toLowerCase() !== "cancelled"
      );

      const isEntireOrderCancelled = remainingItems.length === 0;

      // ----------------------------------------------
      // Calculate new subtotal & total
      // ----------------------------------------------
      const itemPrice = Number(
        item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 1))
      );
      const newSubtotal = Math.max(0, Number(order.subtotal || 0) - itemPrice);
      const newTotal = isEntireOrderCancelled ? 0 : Math.max(0, Number(order.total_amount || 0) - itemPrice);
      const newOrderStatus = isEntireOrderCancelled ? "cancelled" : order.order_status;

      // ----------------------------------------------
      // Update order
      // ----------------------------------------------
      const { error: orderUpdateError } = await adminClient
        .from("orders")
        .update({
          subtotal: newSubtotal,
          total_amount: newTotal,
          order_status: newOrderStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderUpdateError) {
        throw new Error(`Failed to update order: ${orderUpdateError.message}`);
      }

      // ----------------------------------------------
      // Status History
      // ----------------------------------------------
      const historyNote =
        note ||
        (isEntireOrderCancelled
          ? `Cancelled "${item.product_name}" (all items cancelled; order cancelled)`
          : `Item cancelled by admin`);

      await adminClient.from("order_status_history").insert({
        order_id: order.id,
        status: isEntireOrderCancelled ? "cancelled" : order.order_status,
        note: historyNote,
      });

      if (isEntireOrderCancelled) {
        await handleCoinTransitionsOnStatusChange(adminClient, order.id, order.order_number, "cancelled");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Order item cancelled and inventory restored",
          order_id: order.id,
          order_item_id: item.id,
          order_status: newOrderStatus,
          cancelledEntireOrder: isEntireOrderCancelled,
          restored_quantity: Number(item.quantity || 1),
          new_stock: updatedInventory?.stock,
          subtotal: newSubtotal,
          total_amount: newTotal,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ==================================================
    // CANCEL ENTIRE ORDER
    // ==================================================
    if (normalizedStatus === "cancelled" && !order_item_id) {
      console.log(`User ${user.id} cancelling entire order ${order.id}`);

      // ----------------------------------------------
      // Already cancelled?
      // ----------------------------------------------
      if (order.order_status === "cancelled") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Order is already cancelled",
            order_id: order.id,
            order_status: "cancelled",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----------------------------------------------
      // Get all items in order
      // ----------------------------------------------
      const { data: items, error: itemsError } = await adminClient
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsError) {
        throw new Error(`Failed to get order items: ${itemsError.message}`);
      }

      // Filter items that are active (not already cancelled, NULL is treated as active)
      const activeItems = (items || []).filter(
        (it: any) => (it.item_status || "").toLowerCase() !== "cancelled"
      );

      // ----------------------------------------------
      // Restore inventory for all active items
      // ----------------------------------------------
      for (const item of activeItems) {
        await restoreInventory(adminClient, item);
      }

      // ----------------------------------------------
      // Cancel all items in order
      // ----------------------------------------------
      await adminClient
        .from("order_items")
        .update({
          item_status: "cancelled",
        })
        .eq("order_id", order.id);

      // ----------------------------------------------
      // Cancel order
      // ----------------------------------------------
      const { error: orderUpdateError } = await adminClient
        .from("orders")
        .update({
          order_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderUpdateError) {
        throw new Error(`Failed to cancel order: ${orderUpdateError.message}`);
      }

      // ----------------------------------------------
      // Status History
      // ----------------------------------------------
      await adminClient.from("order_status_history").insert({
        order_id: order.id,
        status: "cancelled",
        note: note || "Order cancelled by admin",
      });

      await handleCoinTransitionsOnStatusChange(adminClient, order.id, order.order_number, "cancelled");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Order cancelled and inventory restored successfully",
          order_id: order.id,
          order_status: "cancelled",
          restored_items: activeItems.length,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ==================================================
    // NORMAL STATUS UPDATE
    // ==================================================
    console.log(
      `User ${user.id} changing order ${order.id} status: ${order.order_status} → ${normalizedStatus}`
    );

    const { error: statusUpdateError } = await adminClient
      .from("orders")
      .update({
        order_status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (statusUpdateError) {
      throw new Error(`Failed to update order status: ${statusUpdateError.message}`);
    }

    // ----------------------------------------------
    // Status history
    // ----------------------------------------------
    await adminClient.from("order_status_history").insert({
      order_id: order.id,
      status: normalizedStatus,
      note: note || `Order status changed to ${normalizedStatus} by ${callerRole}`,
    });

    // Handle referral maturation (delivered) or void/refund (cancelled / returned)
    await handleCoinTransitionsOnStatusChange(adminClient, order.id, order.order_number, normalizedStatus);

    // --------------------------------------------------
    // Trigger FCM Push Notification to Customer
    // (packed, shipped, out_for_delivery, delivered, confirmed, cancelled)
    // Never send push for 'processing', or when send_push is false
    // --------------------------------------------------
    const shouldSendPush = body.send_push !== false && normalizedStatus !== "processing";
    if (order.user_id && shouldSendPush) {
      try {
        const statusMap: Record<string, { title: string; body: string; imageFallback?: string }> = {
          confirmed: {
            title: "Order Confirmed! 🪡",
            body: `Your order #${order.order_number} has been verified and confirmed by our master weavers.`,
            imageFallback: "/notifications/order-confirmed.webp",
          },
          packed: {
            title: "Order Packed! 🎁",
            body: `Your order #${order.order_number} has been inspected and safely packed in our authentic fabric pouch.`,
            imageFallback: "/notifications/order-confirmed.webp",
          },
          shipped: {
            title: "Order Dispatched! 🚚",
            body: `Your order #${order.order_number} is on the way! Dispatched with our priority courier partner.`,
            imageFallback: "/notifications/order-confirmed.webp",
          },
          out_for_delivery: {
            title: "Out for Delivery! 🛵",
            body: `Your order #${order.order_number} is out for delivery! Our delivery partner will reach your doorstep shortly.`,
            imageFallback: "/notifications/out-for-delivery.webp",
          },
          delivered: {
            title: "Order Delivered! ✨",
            body: `Your order #${order.order_number} has been delivered. We hope you love your new Banarasi Saree!`,
            imageFallback: "/notifications/order-delivered.webp",
          },
          cancelled: {
            title: "Order Cancelled",
            body: `Your order #${order.order_number} has been cancelled.`,
          },
        };

        const notifInfo = statusMap[normalizedStatus];
        if (notifInfo) {
          const targetUrl = normalizedStatus === "delivered"
            ? `/review?orderId=${encodeURIComponent(order.order_number)}`
            : `/account?orderId=${encodeURIComponent(order.order_number)}`;

          // Find first item image
          const { data: firstItem } = await adminClient
            .from("order_items")
            .select("product_snapshot")
            .eq("order_id", order.id)
            .limit(1)
            .maybeSingle();

          let imageUrl: string | null = null;
          if (firstItem?.product_snapshot) {
            const snap = typeof firstItem.product_snapshot === "string"
              ? JSON.parse(firstItem.product_snapshot)
              : firstItem.product_snapshot;
            const snapImgs = snap?.images || [];
            imageUrl = typeof snapImgs[0] === "string"
              ? snapImgs[0]
              : (snapImgs[0]?.image_url || snap?.image || null);
          }
          if (!imageUrl && notifInfo.imageFallback) {
            imageUrl = notifInfo.imageFallback;
          }

          await adminClient.functions.invoke("send-push", {
            body: {
              audience: "user",
              target_user_id: order.user_id,
              order_status: normalizedStatus,
              order_number: order.order_number,
              customer_name: order.customer_name,
              total_amount: Number(order.total_amount),
              title: notifInfo.title,
              body: notifInfo.body,
              image_url: imageUrl,
              notification_type: "order",
              url: targetUrl,
            },
          });
        }
      } catch (pushErr) {
        console.warn("Failed to send push notification from update-order-status:", pushErr);
      }
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        message: "Order status updated successfully",
        order_id: order.id,
        previous_status: order.order_status,
        order_status: normalizedStatus,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("update-order-status error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
