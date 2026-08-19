import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface EmailOrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  deliveryMethod: string;
  items: EmailOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  isGift?: boolean;
  giftRecipientName?: string | null;
  giftMessage?: string | null;
}

function generateOrderEmailHtml(
  order: EmailOrderDetails,
  title: string,
  subtitle: string
): string {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0e6d2;">
          <div style="font-weight: bold; color: #3c2415; font-size: 14px;">${item.name}</div>
          <div style="font-size: 12px; color: #7a6855; margin-top: 2px;">Qty: ${item.quantity} × ₹${Number(item.price).toLocaleString('en-IN')}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0e6d2; text-align: right; font-weight: bold; color: #800000; font-size: 14px;">
          ₹${(item.quantity * Number(item.price)).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #fcf9f3; font-family: 'Georgia', 'Times New Roman', serif; color: #3c2415;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcf9f3; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #c9a45c; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: left;">
              
              <!-- Header Strip -->
              <tr>
                <td style="background-color: #800000; padding: 24px; text-align: center; border-bottom: 3px solid #c9a45c;">
                  <h1 style="color: #fff9f0; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                    Shree Banarasi Sarees
                  </h1>
                  <p style="color: #c9a45c; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">
                    Exquisite Banarasi Handloom Heritage
                  </p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 30px 30px 20px 30px; text-align: center;">
                  <h2 style="color: #800000; margin: 0 0 8px 0; font-size: 22px; font-weight: bold;">
                    ${title}
                  </h2>
                  <p style="color: #665544; margin: 0; font-size: 14px; line-height: 1.5;">
                    ${subtitle}
                  </p>
                </td>
              </tr>

              <!-- Order Ref Info Box -->
              <tr>
                <td style="padding: 0 30px;">
                  <div style="background-color: #fff9f0; border: 1px solid #f0e6d2; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                      <tr>
                        <td style="color: #665544;">Order ID:</td>
                        <td style="text-align: right; font-weight: bold; color: #800000; font-family: monospace; font-size: 15px;">${order.orderId}</td>
                      </tr>
                      <tr>
                        <td style="color: #665544; padding-top: 6px;">Payment Method:</td>
                        <td style="text-align: right; font-weight: bold; color: #3c2415; padding-top: 6px;">${order.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="color: #665544; padding-top: 6px;">Payment Status:</td>
                        <td style="text-align: right; font-weight: bold; color: ${(order.paymentStatus || '').toLowerCase() === 'paid' ? '#16a34a' : '#d97706'}; padding-top: 6px;">
                          ${order.paymentStatus}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 0 30px 20px 30px;">
                  <h3 style="color: #800000; margin: 0 0 12px 0; font-size: 16px; border-bottom: 2px solid #800000; padding-bottom: 6px;">
                    Items Ordered
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${itemsHtml}
                  </table>
                </td>
              </tr>

              <!-- Price Breakdown -->
              <tr>
                <td style="padding: 0 30px 20px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; border-top: 1px solid #f0e6d2; padding-top: 12px;">
                    <tr>
                      <td style="color: #665544; padding: 4px 0;">Subtotal:</td>
                      <td style="text-align: right; font-weight: bold; color: #3c2415;">₹${Number(order.subtotal || order.total).toLocaleString('en-IN')}</td>
                    </tr>
                    ${(order.discount || 0) > 0 ? `
                    <tr>
                      <td style="color: #16a34a; padding: 4px 0;">Discount:</td>
                      <td style="text-align: right; font-weight: bold; color: #16a34a;">-₹${Number(order.discount).toLocaleString('en-IN')}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="color: #665544; padding: 4px 0;">Shipping:</td>
                      <td style="text-align: right; font-weight: bold; color: #3c2415;">
                        ${(order.shipping || 0) > 0 ? `₹${order.shipping}` : 'FREE Shipping'}
                      </td>
                    </tr>
                    <tr style="border-top: 1px solid #c9a45c;">
                      <td style="color: #800000; padding: 10px 0 4px 0; font-size: 16px; font-weight: bold;">Total Amount:</td>
                      <td style="text-align: right; font-weight: bold; color: #800000; padding: 10px 0 4px 0; font-size: 18px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Delivery Address -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h3 style="color: #800000; margin: 0 0 10px 0; font-size: 16px; border-bottom: 2px solid #800000; padding-bottom: 6px;">
                    Delivery Information
                  </h3>
                  <p style="margin: 0; font-size: 13px; color: #3c2415; line-height: 1.6;">
                    <strong>${order.customerName}</strong><br/>
                    Phone: +91 ${order.customerPhone}<br/>
                    ${order.deliveryMethod === 'Store Pickup' ? '<strong>Store Pickup:</strong> Shree Banarasi Sarees Showroom, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103' : `${order.address}, ${order.city}, ${order.state} – ${order.pinCode}`}
                  </p>
                  ${order.isGift ? `
                  <div style="margin-top: 12px; padding: 10px; background-color: #fff9f0; border: 1px dashed #c9a45c; border-radius: 8px; font-size: 12px;">
                    <strong style="color: #800000;">🎁 Gift Order for:</strong> ${order.giftRecipientName || 'Recipient'}<br/>
                    ${order.giftMessage ? `<em>"${order.giftMessage}"</em>` : ''}
                  </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #fff9f0; padding: 20px 30px; text-align: center; border-top: 1px solid #f0e6d2; font-size: 12px; color: #7a6855;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #800000;">Shree Banarasi Sarees</p>
                  <p style="margin: 0 0 6px 0;">Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103</p>
                  <p style="margin: 0;">WhatsApp Support: +91 91620 390946</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Shree Banarasi Sarees <onboarding@resend.dev>";

    // Resend prohibits using public email providers like @gmail.com as sender address
    if (RESEND_FROM_EMAIL.includes("@gmail.com") || RESEND_FROM_EMAIL.includes("@yahoo.com") || RESEND_FROM_EMAIL.includes("@hotmail.com") || RESEND_FROM_EMAIL.includes("@outlook.com")) {
      console.warn("RESEND_FROM_EMAIL cannot use public domain (e.g. gmail.com). Falling back to onboarding@resend.dev for testing.");
      RESEND_FROM_EMAIL = "Shree Banarasi Sarees <onboarding@resend.dev>";
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is missing");
    }

    const { action, order }: { action: 'ORDER_PLACED' | 'ORDER_CONFIRMED' | 'ORDER_DELIVERED'; order: EmailOrderDetails } = await req.json();

    if (!order || !order.customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing order details or customerEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let title = "";
    let subtitle = "";

    if (action === "ORDER_PLACED") {
      subject = `Order Received #${order.orderId} - Shree Banarasi Sarees`;
      title = "Thank You for Your Order!";
      subtitle = `We have received your order #${order.orderId}. We are processing it with care.`;
    } else if (action === "ORDER_CONFIRMED") {
      subject = `Order Confirmed #${order.orderId} - Shree Banarasi Sarees`;
      title = "Your Order Has Been Confirmed!";
      subtitle = `Great news! Your order #${order.orderId} has been confirmed and is being prepared for dispatch.`;
    } else if (action === "ORDER_DELIVERED") {
      subject = `Order Delivered #${order.orderId} - Shree Banarasi Sarees`;
      title = "Your Order Has Been Delivered!";
      subtitle = `Your order #${order.orderId} has been successfully delivered. We hope you cherish your Banarasi saree!`;
    } else {
      subject = `Order Update #${order.orderId} - Shree Banarasi Sarees`;
      title = `Order Update #${order.orderId}`;
      subtitle = `Here is an update regarding your order with Shree Banarasi Sarees.`;
    }

    const html = generateOrderEmailHtml(order, title, subtitle);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [order.customerEmail],
        subject,
        html,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email via Resend" }),
        { status: resendResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Send email edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
