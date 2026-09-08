import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

interface CartItemInput {
  productId?: string;
  id?: string;
  product_id?: string;
  inventory_id?: string;
  quantity: number;
}

interface RequestBody {
  items?: CartItemInput[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: any;
  notes?: string;
  coupon_code?: string;
  payment_method?: string;
  delivery_option?: 'express' | 'same_day' | 'standard';
  delivery_method?: string;
  shipping_charge?: number;
  is_gift?: boolean;
  gift_recipient_name?: string | null;
  gift_message?: string | null;
  gift_wrap_charge?: number;
  user_id?: string | null;
}

const VALID_COUPONS: Record<string, { discountPercent?: number; fixedDiscount?: number; minOrder: number; description: string }> = {
  'WELCOME10': { discountPercent: 10, minOrder: 1000, description: '10% OFF on orders over ₹1,000' },
  'SHREE500': { fixedDiscount: 500, minOrder: 3000, description: '₹500 OFF on orders over ₹3,000' },
  'FESTIVE15': { discountPercent: 15, minOrder: 5000, description: '15% OFF on orders over ₹5,000' },
  'BANARASI10': { discountPercent: 10, minOrder: 1500, description: '10% OFF on Banarasi collection' },
  'WELCOME200': { fixedDiscount: 200, minOrder: 1999, description: '₹200 OFF on your order' },
};

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

Deno.serve(async (req) => {
  // --------------------------------------------------
  // CORS
  // --------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --------------------------------------------------
  // Only POST requests
  // --------------------------------------------------
  if (req.method !== "POST") {
    return response({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase service environment variables");
    }

    // --------------------------------------------------
    // Create admin client (Service Role)
    // --------------------------------------------------
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // --------------------------------------------------
    // Optional Authentication Check
    // (Supports both authenticated users & guest checkouts)
    // --------------------------------------------------
    let authenticatedUser: any = null;
    const authorization = req.headers.get("Authorization");

    if (authorization && SUPABASE_ANON_KEY) {
      try {
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: authorization,
            },
          },
        });
        const { data: authData } = await userClient.auth.getUser();
        if (authData?.user) {
          authenticatedUser = authData.user;
        }
      } catch (authErr) {
        console.warn("Auth token check skipped or failed:", authErr);
      }
    }

    // --------------------------------------------------
    // Read request body
    // --------------------------------------------------
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return response({ success: false, error: "Invalid request JSON body" }, 400);
    }

    const {
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      notes = null,
      coupon_code,
      payment_method = 'cod',
      is_gift = false,
      gift_recipient_name = null,
      gift_message = null,
      gift_wrap_charge = 0,
    } = body;

    // Determine user ID
    const userId = authenticatedUser?.id || body.user_id || null;

    // Validate customer name & phone
    const cleanCustomerName = (
      customer_name ||
      shipping_address?.full_name ||
      shipping_address?.name ||
      "Valued Customer"
    ).trim();

    const cleanCustomerPhone = (
      customer_phone ||
      shipping_address?.phone ||
      shipping_address?.mobileNumber ||
      ""
    ).trim();

    if (!cleanCustomerName) {
      return response({ success: false, error: "Customer name is required" }, 400);
    }

    if (!cleanCustomerPhone) {
      return response({ success: false, error: "Customer phone number is required" }, 400);
    }

    if (!shipping_address || typeof shipping_address !== "object") {
      return response({ success: false, error: "Shipping address is required" }, 400);
    }

    // User email (prefer verified auth email, fallback to body / address)
    const cleanCustomerEmail = authenticatedUser?.email || customer_email || shipping_address?.email || null;

    // --------------------------------------------------
    // 1. Resolve Items (from payload or user cart_items table)
    // --------------------------------------------------
    const itemMap = new Map<string, number>();

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      for (const item of body.items) {
        const pId = item.productId || item.product_id || item.id || item.inventory_id;
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        if (pId) {
          itemMap.set(pId, (itemMap.get(pId) || 0) + qty);
        }
      }
    } else if (userId) {
      // Fallback to database cart_items if no items explicitly provided in body
      const { data: dbCartItems, error: cartErr } = await admin
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", userId);

      if (cartErr) {
        console.error("Cart fetch error:", cartErr);
        return response({ success: false, error: "Unable to load your cart" }, 500);
      }

      if (dbCartItems && dbCartItems.length > 0) {
        for (const it of dbCartItems) {
          const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
          if (it.product_id) {
            itemMap.set(it.product_id, (itemMap.get(it.product_id) || 0) + qty);
          }
        }
      }
    }

    if (itemMap.size === 0) {
      return response({ success: false, error: "Cannot create order with an empty cart" }, 400);
    }

    const productIds = Array.from(itemMap.keys());

    // --------------------------------------------------
    // 2. Authoritative Product Read from storefront_products / inventory
    // Rule: Never trust price/discount/stock sent from browser.
    // --------------------------------------------------
    let dbProducts: any[] | null = null;
    let prodErr: any = null;

    // Step 2A: Query storefront_products with standard catalog fields & inventory_images
    const { data: sfData, error: sfErr } = await admin
      .from("storefront_products")
      .select(`
        id,
        saree_name,
        selling_price,
        mrp,
        discount_amount,
        discount_percentage,
        hsn_code,
        gst_rate,
        price_includes_gst,
        stock,
        status,
        category,
        fabric,
        color,
        sku,
        description,
        inventory_images (
          image_url,
          is_primary,
          sort_order
        )
      `)
      .in("id", productIds);

    if (!sfErr && sfData && sfData.length > 0) {
      dbProducts = sfData;
    } else {
      if (sfErr) {
        console.warn("storefront_products join query error:", sfErr.message);
      }
      // Step 2B: Fallback without nested relation on view
      const { data: sfFlatData, error: sfFlatErr } = await admin
        .from("storefront_products")
        .select(`
          id,
          saree_name,
          selling_price,
          mrp,
          discount_amount,
          discount_percentage,
          hsn_code,
          gst_rate,
          price_includes_gst,
          stock,
          status,
          category,
          fabric,
          color,
          sku,
          description
        `)
        .in("id", productIds);

      if (!sfFlatErr && sfFlatData && sfFlatData.length > 0) {
        dbProducts = sfFlatData;
      } else {
        // Step 2C: Fallback directly to underlying 'inventory' table
        const { data: invData, error: invErr } = await admin
          .from("inventory")
          .select(`
            id,
            saree_name,
            selling_price,
            mrp,
            discount_amount,
            discount_percentage,
            hsn_code,
            gst_rate,
            price_includes_gst,
            stock,
            status,
            category,
            fabric,
            color,
            sku,
            description
          `)
          .in("id", productIds);

        if (!invErr && invData && invData.length > 0) {
          dbProducts = invData;
        } else {
          // Step 2D: Fallback lookup by SKU in case client sent SKU instead of ID
          const { data: skuData, error: skuErr } = await admin
            .from("storefront_products")
            .select(`
              id,
              saree_name,
              selling_price,
              mrp,
              discount_amount,
              discount_percentage,
              hsn_code,
              gst_rate,
              price_includes_gst,
              stock,
              status,
              category,
              fabric,
              color,
              sku,
              description
            `)
            .in("sku", productIds);

          if (!skuErr && skuData && skuData.length > 0) {
            dbProducts = skuData;
          } else {
            prodErr = sfErr || sfFlatErr || invErr || skuErr;
          }
        }
      }
    }

    if (prodErr && (!dbProducts || dbProducts.length === 0)) {
      console.error("Storefront products fetch error:", prodErr);
      return response(
        {
          success: false,
          error: `Failed to verify products in catalog: ${prodErr?.message || prodErr?.details || "Product lookup failed"}`,
        },
        500
      );
    }

    if (!dbProducts || dbProducts.length === 0) {
      return response(
        {
          success: false,
          error: `Failed to verify products in catalog: No matching products found for ID(s) [${productIds.join(", ")}]`,
        },
        404
      );
    }

    // Attach inventory_images if needed
    const needsImages = dbProducts.some(
      (p: any) => !p.inventory_images || p.inventory_images.length === 0
    );
    if (needsImages) {
      try {
        const pIds = dbProducts.map((p: any) => p.id).filter(Boolean);
        if (pIds.length > 0) {
          const { data: imgRows } = await admin
            .from("inventory_images")
            .select("inventory_id, image_url, is_primary, sort_order")
            .in("inventory_id", pIds);

          if (imgRows && imgRows.length > 0) {
            for (const p of dbProducts) {
              if (!p.inventory_images || p.inventory_images.length === 0) {
                p.inventory_images = imgRows.filter((img: any) => img.inventory_id === p.id);
              }
            }
          }
        }
      } catch (imgCatchErr) {
        console.warn("Could not fetch supplementary inventory_images:", imgCatchErr);
      }
    }

    // Map by both ID and SKU (raw, lowercase, uppercase) for ultra-reliable matching
    const productMap = new Map<string, any>();
    for (const p of dbProducts) {
      if (p.id) {
        productMap.set(String(p.id), p);
        productMap.set(String(p.id).toLowerCase(), p);
        productMap.set(String(p.id).toUpperCase(), p);
      }
      if (p.sku) {
        productMap.set(String(p.sku), p);
        productMap.set(String(p.sku).toLowerCase(), p);
        productMap.set(String(p.sku).toUpperCase(), p);
      }
    }

    const validatedItems: {
      product: any;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      hsnCode: string;
      gstRate: number;
    }[] = [];

    let calculatedSubtotal = 0;

    for (const [pId, requestedQty] of itemMap.entries()) {
      const prod =
        productMap.get(pId) ||
        productMap.get(String(pId).toLowerCase()) ||
        productMap.get(String(pId).toUpperCase());

      if (!prod) {
        return response({ success: false, error: `Product not found: ${pId}` }, 404);
      }

      if (prod.status !== "active") {
        return response(
          { success: false, error: `"${prod.saree_name}" is currently unavailable.` },
          400
        );
      }

      const availableStock = Number(prod.stock ?? 0);
      if (availableStock < requestedQty) {
        return response(
          {
            success: false,
            error: `Only ${availableStock} item(s) available for "${prod.saree_name}".`,
          },
          400
        );
      }

      // Customer-facing price is GST-inclusive
      const unitPrice = round2(Number(prod.selling_price));
      const lineTotal = round2(unitPrice * requestedQty);
      calculatedSubtotal = round2(calculatedSubtotal + lineTotal);

      validatedItems.push({
        product: prod,
        quantity: requestedQty,
        unitPrice,
        lineTotal,
        hsnCode: prod.hsn_code || "5208",
        gstRate: prod.gst_rate != null ? Number(prod.gst_rate) : 5.0,
      });
    }

    // --------------------------------------------------
    // 3. Server-side Coupon Validation & Discount
    // --------------------------------------------------
    let totalDiscount = 0;
    let validatedCouponCode: string | null = null;

    if (coupon_code && typeof coupon_code === "string") {
      const cleanCoupon = coupon_code.trim().toUpperCase();
      const couponRule = VALID_COUPONS[cleanCoupon];

      if (couponRule && calculatedSubtotal >= couponRule.minOrder) {
        validatedCouponCode = cleanCoupon;
        if (couponRule.discountPercent) {
          totalDiscount = round2((calculatedSubtotal * couponRule.discountPercent) / 100);
        } else if (couponRule.fixedDiscount) {
          totalDiscount = round2(couponRule.fixedDiscount);
        }
        totalDiscount = Math.min(totalDiscount, calculatedSubtotal);
      }
    }

    // --------------------------------------------------
    // 4. Server-side Delivery Charge Calculation from delivery_settings
    // --------------------------------------------------
    const { data: delSettings } = await admin
      .from("delivery_settings")
      .select("express_charge, same_day_charge, standard_charge, is_active")
      .eq("id", "default")
      .maybeSingle();

    const expressCharge = Number(delSettings?.express_charge ?? 29);
    const sameDayCharge = Number(delSettings?.same_day_charge ?? 49);
    const standardCharge = Number(delSettings?.standard_charge ?? 69);

    const chosenOption = body.delivery_option || shipping_address?.delivery_option || "standard";
    const isPickup =
      shipping_address?.deliveryMethod === "Store Pickup" ||
      body.delivery_method === "Store Pickup";

    let calculatedShippingCharge = 0;
    let finalDeliveryMethod = "Standard Delivery";

    if (isPickup) {
      calculatedShippingCharge = 0;
      finalDeliveryMethod = "Store Pickup";
    } else if (chosenOption === "express") {
      calculatedShippingCharge = expressCharge;
      finalDeliveryMethod = "20-Min Express Delivery";
    } else if (chosenOption === "same_day") {
      calculatedShippingCharge = sameDayCharge;
      finalDeliveryMethod = "Same Day Delivery";
    } else {
      calculatedShippingCharge = standardCharge;
      finalDeliveryMethod = "Standard Delivery";
    }

    // Allow custom delivery method label override if sent from client
    if (body.delivery_method && body.delivery_method !== "Home Delivery") {
      finalDeliveryMethod = body.delivery_method;
    }

    const shippingFee = calculatedShippingCharge;
    const finalGiftWrapCharge = Number(gift_wrap_charge || 0);
    const totalPayable = round2(
      Math.max(0, calculatedSubtotal - totalDiscount + shippingFee + finalGiftWrapCharge)
    );

    // --------------------------------------------------
    // 5. Place of Supply & GST Classification
    // Rule: Seller is Bihar. Intra-state if customer state is Bihar; else Inter-state.
    // --------------------------------------------------
    const customerState = (shipping_address?.state || "Bihar").trim();
    const isIntraState = customerState.toLowerCase() === "bihar";
    const placeOfSupply = customerState;

    // --------------------------------------------------
    // 6. Item-level Pro-Rata Coupon Discount & Embedded GST Extraction
    // Embedded GST formula: Taxable = Net Consideration / (1 + rate / 100)
    // --------------------------------------------------
    let allocatedDiscountSum = 0;
    const itemsWithGst: any[] = [];

    for (let i = 0; i < validatedItems.length; i++) {
      const it = validatedItems[i];
      let itemDiscount = 0;

      if (totalDiscount > 0 && calculatedSubtotal > 0) {
        if (i === validatedItems.length - 1) {
          // Last item absorbs any rounding difference
          itemDiscount = round2(totalDiscount - allocatedDiscountSum);
        } else {
          itemDiscount = round2((it.lineTotal / calculatedSubtotal) * totalDiscount);
          allocatedDiscountSum = round2(allocatedDiscountSum + itemDiscount);
        }
      }

      // Net discounted consideration for this item line
      const discountedConsideration = round2(it.lineTotal - itemDiscount);

      // Embedded GST extraction
      const gstRate = it.gstRate;
      const taxableValue = round2(discountedConsideration / (1 + gstRate / 100));
      const gstAmount = round2(discountedConsideration - taxableValue);

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (isIntraState) {
        cgstAmount = round2(gstAmount / 2);
        sgstAmount = round2(gstAmount - cgstAmount); // Exact reconciliation: CGST + SGST = GST
        igstAmount = 0;
      } else {
        cgstAmount = 0;
        sgstAmount = 0;
        igstAmount = gstAmount;
      }

      itemsWithGst.push({
        ...it,
        itemDiscount,
        discountedConsideration,
        taxableValue,
        gstAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
      });
    }

    // --------------------------------------------------
    // 7. Order-Level Aggregation
    // --------------------------------------------------
    const orderTaxableAmount = round2(itemsWithGst.reduce((sum, it) => sum + it.taxableValue, 0));
    const orderGstAmount = round2(itemsWithGst.reduce((sum, it) => sum + it.gstAmount, 0));
    const orderCgstAmount = round2(itemsWithGst.reduce((sum, it) => sum + it.cgstAmount, 0));
    const orderSgstAmount = round2(itemsWithGst.reduce((sum, it) => sum + it.sgstAmount, 0));
    const orderIgstAmount = round2(itemsWithGst.reduce((sum, it) => sum + it.igstAmount, 0));
    const primaryGstRate = itemsWithGst[0]?.gstRate ?? 5.0;

    // --------------------------------------------------
    // 8. Order Number & Invoice Number Generation
    // --------------------------------------------------
    const now = new Date();
    const dateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(now)
      .replaceAll("-", "");

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `SBS-ORD-${dateString}-${randomSuffix}`;

    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const invoiceNumber = `SBS-INV-${yy}${mm}-${randomSuffix}`;
    const invoiceDate = now.toISOString();

    const cleanPaymentMethod = payment_method === "online" ? "online" : "cod";

    // --------------------------------------------------
    // 9. Insert into public.orders
    // Includes new columns: delivery_method and shipping_charge
    // --------------------------------------------------
    const orderInsertPayload: any = {
      order_number: orderNumber,
      user_id: userId,
      customer_name: cleanCustomerName,
      customer_phone: cleanCustomerPhone,
      customer_email: cleanCustomerEmail,
      shipping_address: shipping_address,
      notes: notes,
      subtotal: calculatedSubtotal,
      discount: totalDiscount,
      shipping_fee: shippingFee,
      shipping_charge: shippingFee, // Newly added column
      delivery_method: finalDeliveryMethod, // Newly added column
      total_amount: totalPayable,
      payment_method: cleanPaymentMethod,
      payment_status: "pending",
      order_status: "placed",
      taxable_amount: orderTaxableAmount,
      gst_amount: orderGstAmount,
      cgst_amount: orderCgstAmount,
      sgst_amount: orderSgstAmount,
      igst_amount: orderIgstAmount,
      gst_rate: primaryGstRate,
      place_of_supply: placeOfSupply,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      is_gift: Boolean(is_gift),
      gift_recipient_name: is_gift ? gift_recipient_name : null,
      gift_message: is_gift ? gift_message : null,
      gift_wrap_charge: finalGiftWrapCharge,
    };

    let { data: createdOrder, error: orderInsertErr } = await admin
      .from("orders")
      .insert([orderInsertPayload])
      .select()
      .single();

    if (
      orderInsertErr &&
      (orderInsertErr.message?.includes("shipping_charge") ||
        orderInsertErr.message?.includes("delivery_method"))
    ) {
      console.warn(
        "Retrying orders insert without newly added delivery columns in case schema cache is reloading..."
      );
      const { shipping_charge, delivery_method, ...fallbackPayload } = orderInsertPayload;
      const retryRes = await admin.from("orders").insert([fallbackPayload]).select().single();
      createdOrder = retryRes.data;
      orderInsertErr = retryRes.error;
    }

    if (orderInsertErr || !createdOrder) {
      console.error("Order insertion error:", orderInsertErr);
      return response(
        {
          success: false,
          error: orderInsertErr?.message || "Failed to create order record",
        },
        500
      );
    }

    // --------------------------------------------------
    // 10. Insert snapshot records into public.order_items
    // --------------------------------------------------
    const orderItemsPayload = itemsWithGst.map((it) => {
      const prod = it.product;
      const images = Array.isArray(prod.inventory_images)
        ? prod.inventory_images.map((img: any) => ({
            image_url: img.image_url || img,
            is_primary: img.is_primary ?? false,
            sort_order: img.sort_order ?? 0,
          }))
        : [];

      const snapshot = {
        inventory_id: prod.id,
        id: prod.id,
        name: prod.saree_name,
        saree_name: prod.saree_name,
        selling_price: it.unitPrice,
        price: Number(prod.mrp || it.unitPrice),
        mrp: Number(prod.mrp || it.unitPrice),
        sku: prod.sku,
        category: prod.category,
        fabric: prod.fabric,
        color: prod.color,
        hsn_code: it.hsnCode,
        gst_rate: it.gstRate,
        discount_amount: prod.discount_amount,
        discount_percentage: prod.discount_percentage,
        description: prod.description,
        images: images,
      };

      return {
        order_id: createdOrder.id,
        inventory_id: prod.id,
        product_name: prod.saree_name,
        product_name_snapshot: prod.saree_name,
        sku: prod.sku || `SBS-${prod.id}`,
        barcode: prod.barcode || null,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount_amount: it.itemDiscount,
        taxable_value: it.taxableValue,
        gst_rate: it.gstRate,
        cgst_amount: it.cgstAmount,
        sgst_amount: it.sgstAmount,
        igst_amount: it.igstAmount,
        gst_amount: it.gstAmount,
        total_price: it.discountedConsideration,
        product_snapshot: snapshot,
        item_status: "active",
      };
    });

    let { data: createdItems, error: itemsInsertErr } = await admin
      .from("order_items")
      .insert(orderItemsPayload)
      .select();

    if (itemsInsertErr && itemsInsertErr.message?.includes("barcode")) {
      console.warn("Retrying order_items insert without barcode column...");
      const fallbackPayload = orderItemsPayload.map(({ barcode, ...rest }) => rest);
      const retryRes = await admin
        .from("order_items")
        .insert(fallbackPayload)
        .select();
      createdItems = retryRes.data;
      itemsInsertErr = retryRes.error;
    }

    if (itemsInsertErr) {
      console.error("Order items insertion error:", itemsInsertErr);
      // Clean up orphaned order
      await admin.from("orders").delete().eq("id", createdOrder.id);
      return response(
        {
          success: false,
          error: itemsInsertErr.message || "Failed to snapshot order items",
        },
        500
      );
    }

    // --------------------------------------------------
    // 11. Initial status history timeline
    // --------------------------------------------------
    const { error: historyErr } = await admin
      .from("order_status_history")
      .insert([
        {
          order_id: createdOrder.id,
          status: "placed",
          note: "Order placed successfully by customer on storefront",
        },
      ]);

    if (historyErr) {
      console.warn("Status history insertion warning:", historyErr);
    }

    // --------------------------------------------------
    // 12. Decrement inventory stock safely
    // --------------------------------------------------
    for (const it of validatedItems) {
      try {
        const { data: invRow } = await admin
          .from("inventory")
          .select("stock")
          .eq("id", it.product.id)
          .single();

        if (invRow) {
          const currentStock = Number(invRow.stock || 0);
          const newStock = Math.max(0, currentStock - it.quantity);
          await admin
            .from("inventory")
            .update({ stock: newStock })
            .eq("id", it.product.id);
        }
      } catch (stockErr) {
        console.warn(`Could not update stock for product ${it.product.id}:`, stockErr);
      }
    }

    // --------------------------------------------------
    // 13. Clear user's cart if user is logged in
    // --------------------------------------------------
    if (userId) {
      try {
        // Try cart_items table
        await admin.from("cart_items").delete().eq("user_id", userId);
      } catch {
        // Non-fatal
      }
      try {
        // Try cart table if present
        await admin.from("cart").delete().eq("user_id", userId);
      } catch {
        // Non-fatal
      }
    }

    // --------------------------------------------------
    // 14. Return the authoritative order response
    // --------------------------------------------------
    const responseOrder = {
      ...createdOrder,
      order_items: createdItems || [],
      items: createdItems || [],
    };

    return response(
      {
        success: true,
        order: responseOrder,
      },
      200
    );
  } catch (err: any) {
    console.error("create-order error:", err);
    return response(
      {
        success: false,
        error: err.message || "Internal server error",
      },
      500
    );
  }
});

