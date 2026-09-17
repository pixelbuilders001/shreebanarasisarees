import { ReceiptData, ReceiptItem } from './receiptUtils';

const SHOP = {
  name: 'SHREE BANARASI SAREES',
  address: 'Rudauli Chowk, Samastipur, Bihar – 848101',
  email: 'shreebanarasi180@gmail.com',
  phone: '+91-6203909946',
  gstin: '10AGAFS4190H1Z8',
};

const TERMS = [
  'Goods once sold can be exchanged within 7 days with the original invoice and Silk Mark tag intact.',
  'No cash refunds; exchange or store credit only.',
  'Dry clean only for all pure silk products.',
  'Any disputes are subject to Bihar Jurisdiction only.',
];

const fmtCurrency = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateShort = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  } catch {
    return iso;
  }
};

const fmtDateLong = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

/**
 * Builds a standardized ReceiptData object from an order object (e.g. from checkout or account).
 */
export function buildReceiptDataFromOrder(order: any, products?: any[]): ReceiptData {
  const rawItems = order.items || [];
  const items: ReceiptItem[] = rawItems.map((item: any) => {
    let resolvedName = item.sareeName || item.name;
    let resolvedMrp = Number(item.mrp || 0);
    let resolvedPrice = item.sellingPrice != null ? Number(item.sellingPrice) : (item.unit_price != null ? Number(item.unit_price) : Number(item.price || 0));
    let resolvedHsn = item.hsnCode || item.hsn_code || '5208';

    // If product object is present
    const prod = item.product;
    if (prod && typeof prod === 'object') {
      if (!resolvedName) resolvedName = prod.name;
      if (!resolvedMrp) resolvedMrp = Number(prod.mrp || prod.price || 0);
      if (!resolvedPrice) resolvedPrice = Number(prod.salePrice ?? prod.price ?? 0);
      if (!resolvedHsn) resolvedHsn = prod.hsn_code || '5208';
    }

    // If matching product found in products list
    if (products && products.length > 0 && (!resolvedName || !resolvedMrp)) {
      const match = products.find((p: any) => p.id === (item.product_id || item.id || prod?.id));
      if (match) {
        if (!resolvedName) resolvedName = match.name;
        if (!resolvedMrp) resolvedMrp = Number(match.mrp || match.price || 0);
        if (!resolvedPrice) resolvedPrice = Number(match.salePrice ?? match.price ?? 0);
        if (!resolvedHsn) resolvedHsn = match.hsn_code || '5208';
      }
    }

    let snap = item.product_snapshot;
    if (typeof snap === 'string') {
      try { snap = JSON.parse(snap); } catch {}
    }
    if (snap && typeof snap === 'object') {
      if (!resolvedName) resolvedName = snap.name;
      if (!resolvedMrp) resolvedMrp = Number(snap.mrp || snap.price || 0);
      if (!resolvedHsn) resolvedHsn = snap.hsn_code || '5208';
      // Reconstruct real MRP when snapshot has discount_amount but mrp ≤ selling price
      const snapDisc = Number(snap.discount_amount || 0);
      if (resolvedMrp <= resolvedPrice && snapDisc > 0) {
        resolvedMrp = resolvedPrice + snapDisc;
      }
    }

    // Extract tailoring add-ons if present
    const itemAddonsRaw = item.selectedAddons || item.addons || prod?.selectedAddons || prod?.addons || snap?.addons || snap?.selectedAddons || [];
    const itemAddons = Array.isArray(itemAddonsRaw) ? itemAddonsRaw.map((a: any) => ({
      id: a.id,
      title: a.title || a.name || 'Tailoring Add-on',
      price: Number(a.price || 0),
      size: a.size || undefined,
    })) : [];
    const addonsTotalPerUnit = itemAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    // If resolvedPrice was derived from product base price (which excludes addons), add addonsTotalPerUnit
    const priceExcludesAddons = (item.sellingPrice == null && item.unit_price == null && prod != null);
    const finalPrice = priceExcludesAddons ? (resolvedPrice + addonsTotalPerUnit) : resolvedPrice;
    const finalMrpVal = priceExcludesAddons ? (resolvedMrp + addonsTotalPerUnit) : resolvedMrp;

    const isItemCancelled = (item?.item_status || prod?.item_status || '').toLowerCase() === 'cancelled';
    const finalName = resolvedName || 'Handloom Banarasi Saree';
    const unitSellingPrice = finalPrice > 0 ? finalPrice : 0;
    const unitMrp = finalMrpVal > 0 ? finalMrpVal : unitSellingPrice;

    // Read per-item coupon discount_amount (set by create-order edge function)
    const itemCouponDisc = Number(item.discount_amount || 0);

    return {
      sareeName: isItemCancelled ? `[Cancelled] ${finalName}` : finalName,
      quantity: Number(item.quantity || 1),
      mrp: unitMrp,
      sellingPrice: unitSellingPrice,
      hsnCode: resolvedHsn,
      addons: itemAddons.length > 0 ? itemAddons : undefined,
      discountAmount: itemCouponDisc > 0 ? itemCouponDisc : undefined,
    };
  });

  const fullAddress = typeof order.customer === 'string'
    ? order.customer
    : [
        order.customer?.address,
        order.customer?.city,
        order.customer?.state,
        order.customer?.pinCode,
      ].filter(Boolean).join(', ') || order.shipping_address?.address || order.address || '';

  const customerName = order.customer?.name || order.customer_name || null;
  const customerMobile = order.customer?.phone || order.customer_phone || null;
  const customerEmail = order.customer?.email || order.customer_email || null;

  const placeOfSupply = order.place_of_supply || order.customer?.state || 'Bihar';
  const isIntraState = placeOfSupply.trim().toLowerCase() === 'bihar';

  const calcSubtotal = items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0);
  const subtotal = order.subtotal != null ? Number(order.subtotal) : calcSubtotal;

  // Pro-rata allocate order-level discount to items when no item-level discounts exist
  const orderDiscount = Number(order.discount || 0);
  const hasItemDiscounts = items.some(it => (it.discountAmount || 0) > 0);
  const finalItems: ReceiptItem[] = items.map(it => {
    if (!hasItemDiscounts && orderDiscount > 0 && calcSubtotal > 0) {
      const itemSubtotal = it.sellingPrice * it.quantity;
      const allocated = Math.round((itemSubtotal / calcSubtotal) * orderDiscount * 100) / 100;
      return { ...it, discountAmount: allocated > 0 ? allocated : undefined };
    }
    return it;
  });

  const finalDiscountAmount = hasItemDiscounts
    ? finalItems.reduce((s, it) => s + (it.discountAmount || 0), 0)
    : orderDiscount;

  const orderTaxable = order.taxable_amount != null ? Number(order.taxable_amount) : undefined;
  const orderGst = order.gst_amount != null ? Number(order.gst_amount) : undefined;
  const isGstPresent = (orderTaxable != null && orderGst != null && orderGst > 0) || Boolean(order.is_gst_applied);

  return {
    invoiceNumber: order.invoice_number || order.orderId || order.id || 'INV',
    date: order.invoice_date || order.createdAt || order.created_at || new Date().toISOString(),
    paymentMode: order.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : (order.paymentMethod || 'Online Payment'),
    customerName,
    customerMobile,
    customerAddress: fullAddress || null,
    customerEmail,
    items: finalItems,
    subtotal,
    totalAmount: Number(order.total_amount ?? order.total ?? 0),
    discountAmount: finalDiscountAmount,
    shippingFee: Number(order.shipping || order.shipping_charge || 0),
    giftWrapCharge: Number(order.gift_wrap_charge || 0),
    referralCode: order.referral_code || order.referralCode || null,
    referralDiscount: Number(order.referral_discount || order.referralDiscount || 0) > 0
      ? Number(order.referral_discount || order.referralDiscount)
      : null,
    coinsRedeemed: Number(order.coins_redeemed || order.coinsRedeemed || 0) > 0
      ? Number(order.coins_redeemed || order.coinsRedeemed)
      : null,
    isGstApplied: isGstPresent,
    gstRate: Number(order.gst_rate || 5),
    taxableAmount: orderTaxable,
    cgstRate: isIntraState ? (Number(order.gst_rate || 5) / 2) : 0,
    cgstAmount: order.cgst_amount != null ? Number(order.cgst_amount) : undefined,
    sgstRate: isIntraState ? (Number(order.gst_rate || 5) / 2) : 0,
    sgstAmount: order.sgst_amount != null ? Number(order.sgst_amount) : undefined,
    igstRate: !isIntraState ? Number(order.gst_rate || 5) : 0,
    igstAmount: order.igst_amount != null ? Number(order.igst_amount) : undefined,
    totalGst: orderGst,
    placeOfSupply,
    appliedVoucherCode: order.coupon_code || order.applied_voucher_code || null,
    appliedVoucherAmount: Math.max(0, finalDiscountAmount - Number(order.referral_discount || order.referralDiscount || 0) - Number(order.coins_redeemed || order.coinsRedeemed || 0)) > 0
      ? Math.max(0, finalDiscountAmount - Number(order.referral_discount || order.referralDiscount || 0) - Number(order.coins_redeemed || order.coinsRedeemed || 0))
      : null,
  };
}

/**
 * Generates the complete HTML string matching the exact receipt design of Shree Banarasi Sarees.
 */
export function generateInvoiceHtml(receipt: ReceiptData): string {
  const dateShort = fmtDateShort(receipt.date);
  const dateLong = fmtDateLong(receipt.date);

  const totalMrp = receipt.items.reduce(
    (s, i) => s + (i.mrp && i.mrp > 0 ? i.mrp : i.sellingPrice) * i.quantity,
    0
  );

  // Per-item total discount — backward-compatible: new orders store mrpDisc+couponDisc in discountAmount
  const perItemTotalDisc = receipt.items.map(i => {
    const mrp = i.mrp && i.mrp > 0 ? i.mrp : i.sellingPrice;
    const prodDisc = Math.max(0, (mrp - i.sellingPrice) * i.quantity);
    const dbDisc = i.discountAmount || 0;
    // New orders: dbDisc >= prodDisc (includes mrp disc) → use dbDisc
    // Old orders: dbDisc < prodDisc or 0 (coupon only) → add prodDisc + dbDisc
    return (dbDisc >= prodDisc && prodDisc > 0) ? dbDisc : prodDisc + dbDisc;
  });
  const totalItemDiscount = perItemTotalDisc.reduce((s, d) => s + d, 0);

  const totalItemDiscountPercent = totalMrp > 0 ? (totalItemDiscount / totalMrp) * 100 : 0;
  const totalItemDiscountPercentText =
    totalItemDiscountPercent > 0 ? ` (${parseFloat(totalItemDiscountPercent.toFixed(1))}%)` : '';

  const totalAddons = receipt.items.reduce((sum, item) => {
    const itemAddons = Array.isArray(item.addons) ? item.addons : [];
    const addonsPerUnit = itemAddons.reduce((aSum, a) => aSum + (Number(a.price) || 0), 0);
    return sum + addonsPerUnit * (item.quantity || 1);
  }, 0);

  const itemsSellingTotal = receipt.items.reduce((s, i) => s + i.quantity * i.sellingPrice, 0);
  const subtotal = totalItemDiscount > 0
    ? Math.max(0, totalMrp - totalItemDiscount)
    : (itemsSellingTotal > 0 ? itemsSellingTotal : (receipt.subtotal || totalMrp));

  // billDiscount: any order-level discount not already captured in per-item totalDisc
  const mrpDiscountTotal = Math.max(0, totalMrp - itemsSellingTotal);
  const extraItemDiscount = Math.max(0, totalItemDiscount - mrpDiscountTotal);
  const rawBillDiscount = receipt.discountAmount || 0;
  const billDiscount = Math.max(0, rawBillDiscount - extraItemDiscount);
  const billDiscountLabel = receipt.appliedVoucherCode
    ? `COUPON (${receipt.appliedVoucherCode})`
    : 'DISCOUNT';
  const billDiscountPercent =
    receipt.discountPercentage && receipt.discountPercentage > 0
      ? receipt.discountPercentage
      : subtotal > 0 && billDiscount > 0
      ? (billDiscount / subtotal) * 100
      : 0;
  const billDiscountPercentText = billDiscountPercent > 0 ? ` (${parseFloat(billDiscountPercent.toFixed(1))}%)` : '';

  // totalSavings = all item discounts + any remaining bill-level discount
  const totalSavings = totalItemDiscount + billDiscount;
  const totalSavingsPercent = totalMrp > 0 ? (totalSavings / totalMrp) * 100 : 0;

  const itemRowsHtml = receipt.items
    .map((item) => {
      const itemMrp = item.mrp && item.mrp > 0 ? item.mrp : item.sellingPrice;
      const itemMrpTotal = item.quantity * itemMrp;
      const prodDisc = Math.max(0, (itemMrp - item.sellingPrice) * item.quantity);
      const dbDisc = item.discountAmount || 0;
      // New orders: dbDisc = mrpDisc + couponDisc (>= prodDisc)
      // Old orders: dbDisc = couponDisc only (< prodDisc or 0)
      const totalLineDisc = (dbDisc >= prodDisc && prodDisc > 0) ? dbDisc : prodDisc + dbDisc;
      const itemPayableTotal = itemMrpTotal - totalLineDisc;
      const itemDiscPct = itemMrpTotal > 0 ? (totalLineDisc / itemMrpTotal) * 100 : 0;

      const addonsHtml = item.addons && item.addons.length > 0
        ? `
          <div style="margin-top: 4px; font-size: 11px; color: #6B1725; line-height: 1.45;">
            ${item.addons.map(a => `
              <div>+ ${a.title}${a.size ? ` (${a.size}&quot;)` : ''}: ${fmtCurrency(a.price)}</div>
            `).join('')}
          </div>
        `
        : '';

      return `
        <tr style="border-bottom: 1px dashed #ccc;">
          <td style="padding: 10px 8px 10px 0; word-break: break-word;">
            <div style="font-weight: 500;">${item.sareeName}</div>
            ${addonsHtml}
            ${item.hsnCode ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">HSN: ${item.hsnCode}</div>` : ''}
          </td>
          <td style="padding: 10px 6px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 6px; text-align: right; white-space: nowrap;">${fmtCurrency(itemMrp)}</td>
          <td style="padding: 10px 6px; text-align: right; color: ${totalLineDisc > 0 ? '#b91c1c' : '#777'}; white-space: nowrap;">
            ${totalLineDisc > 0 ? `− ${fmtCurrency(totalLineDisc)}${itemDiscPct > 0 ? ` (${parseFloat(itemDiscPct.toFixed(1))}%)` : ''}` : '—'}
          </td>
          <td style="padding: 10px 0 10px 6px; text-align: right; font-weight: 600; white-space: nowrap;">${fmtCurrency(itemPayableTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #ffffff; width: 794px; min-height: 1000px; padding: 48px 56px; box-sizing: border-box;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
        <div>
          <div style="font-weight: bold; font-size: 20px; letter-spacing: 0.5px; margin-bottom: 6px; color: #111;">
            ${SHOP.name}
          </div>
          <div style="color: #444; line-height: 1.75; font-size: 12.5px;">
            <div>${SHOP.address}</div>
            <div>${SHOP.email}</div>
            <div>${SHOP.phone}</div>
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0; padding-left: 24px;">
          ${
            receipt.isGstApplied
              ? `<div style="font-weight: bold; font-size: 13px; color: #800000; margin-bottom: 4px;">GSTIN: ${SHOP.gstin}</div>`
              : ''
          }
          <div style="color: #555; font-size: 12.5px;">${dateLong}</div>
          ${
            receipt.isGstApplied
              ? `<div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">TAX INVOICE</div>`
              : ''
          }
        </div>
      </div>

      <!-- Meta Row -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; gap: 32px;">
        <div style="line-height: 2; font-size: 12.5px;">
          <div>
            <span style="font-weight: bold;">Invoice #:</span>
            <span style="font-style: italic; word-break: break-all; margin-left: 6px;">${receipt.invoiceNumber}</span>
          </div>
          <div>
            <span style="font-weight: bold;">Date:</span>
            <span style="font-style: italic; margin-left: 6px;">${dateShort}</span>
          </div>
          <div>
            <span style="font-weight: bold;">Due Date:</span>
            <span style="font-style: italic; margin-left: 6px;">${dateShort}</span>
          </div>
          ${
            receipt.placeOfSupply
              ? `<div>
                  <span style="font-weight: bold;">Place of Supply:</span>
                  <span style="font-style: italic; margin-left: 6px;">${receipt.placeOfSupply}</span>
                </div>`
              : ''
          }
        </div>

        ${
          receipt.customerName || receipt.customerMobile || receipt.customerAddress
            ? `<div style="line-height: 1.85; font-size: 12.5px; text-align: right; max-width: 320px;">
                <div style="font-weight: bold; margin-bottom: 4px;">Bill To</div>
                ${receipt.customerName ? `<div style="font-weight: 600; color: #111; word-break: break-word;">${receipt.customerName}</div>` : ''}
                ${receipt.customerMobile ? `<div style="color: #444;">${receipt.customerMobile}</div>` : ''}
                ${
                  receipt.customerAddress
                    ? `<div style="color: #555; font-size: 11.5px; line-height: 1.4; margin-top: 3px; word-break: break-word;">${receipt.customerAddress}</div>`
                    : ''
                }
              </div>`
            : ''
        }
      </div>

      <div style="border-top: 1.5px dashed #bbb; margin-bottom: 24px;"></div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
        <thead>
          <tr style="border-top: 2px solid #111; border-bottom: 2px solid #111;">
            <th style="text-align: left; padding: 10px 8px 10px 0; font-weight: bold; letter-spacing: 0.5px; width: 36%;">DESCRIPTION</th>
            <th style="text-align: center; padding: 10px 6px; font-weight: bold; letter-spacing: 0.5px; width: 8%;">QTY</th>
            <th style="text-align: right; padding: 10px 6px; font-weight: bold; letter-spacing: 0.5px; width: 18%;">MRP</th>
            <th style="text-align: right; padding: 10px 6px; font-weight: bold; letter-spacing: 0.5px; width: 20%;">DISCOUNT</th>
            <th style="text-align: right; padding: 10px 0 10px 6px; font-weight: bold; letter-spacing: 0.5px; width: 18%;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="border-top: 2px solid #111; padding-top: 12px; margin-top: 4px;">
        <div style="max-width: 420px; margin-left: auto; width: 100%;">
          ${
            totalItemDiscount > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px dashed #eee; font-size: 12.5px;">
                  <span style="color: #555;">TOTAL MRP</span>
                  <span style="text-align: right; font-weight: 500; white-space: nowrap;">${fmtCurrency(totalMrp)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px dashed #eee; font-size: 12.5px; color: #b91c1c;">
                  <span>PRODUCT DISCOUNT${totalItemDiscountPercentText}</span>
                  <span style="text-align: right; font-weight: 500; white-space: nowrap;">− ${fmtCurrency(totalItemDiscount)}</span>
                </div>
              `
              : ''
          }

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px;">
            <span style="font-weight: bold; letter-spacing: 0.5px;">
              ${totalItemDiscount > 0 ? 'SUBTOTAL (AFTER PRODUCT DISCOUNT)' : 'SUBTOTAL'}
            </span>
            <span style="text-align: right; font-weight: bold; white-space: nowrap;">${fmtCurrency(subtotal)}</span>
          </div>

          ${
            totalAddons > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px dashed #eee; font-size: 12.5px;">
                  <span style="color: #555;">TAILORING / ADD-ONS</span>
                  <span style="text-align: right; font-weight: 500; white-space: nowrap;">+ ${fmtCurrency(totalAddons)}</span>
                </div>
              `
              : ''
          }

          ${
            billDiscount > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px; color: #b91c1c;">
                  <span style="font-weight: bold; letter-spacing: 0.5px;">${billDiscountLabel}${billDiscountPercentText}</span>
                  <span style="text-align: right; font-weight: bold; white-space: nowrap;">− ${fmtCurrency(billDiscount)}</span>
                </div>
              `
              : ''
          }

          ${
            receipt.isGstApplied
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px;">
                  <span style="font-weight: bold; letter-spacing: 0.5px;">TAXABLE AMOUNT</span>
                  <span style="text-align: right; font-weight: bold; white-space: nowrap;">${fmtCurrency(receipt.taxableAmount || subtotal - billDiscount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px dashed #eee; font-size: 12px; color: #444;">
                  <span>CGST @ ${receipt.cgstRate || 2.5}%</span>
                  <span style="text-align: right; white-space: nowrap;">${fmtCurrency(receipt.cgstAmount || 0)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px dashed #eee; font-size: 12px; color: #444;">
                  <span>SGST @ ${receipt.sgstRate || 2.5}%</span>
                  <span style="text-align: right; white-space: nowrap;">${fmtCurrency(receipt.sgstAmount || 0)}</span>
                </div>
                ${
                  (receipt.igstAmount || 0) > 0
                    ? `
                      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 4px 0; border-bottom: 1px dashed #eee; font-size: 12px; color: #444;">
                        <span>IGST @ ${receipt.igstRate}%</span>
                        <span style="text-align: right; white-space: nowrap;">${fmtCurrency(receipt.igstAmount || 0)}</span>
                      </div>
                    `
                    : ''
                }
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px; color: #047857;">
                  <span style="font-weight: bold; letter-spacing: 0.5px;">TOTAL GST</span>
                  <span style="text-align: right; font-weight: bold; white-space: nowrap;">${fmtCurrency(receipt.totalGst || 0)}</span>
                </div>
              `
              : ''
          }

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px;">
            <span style="color: #555;">DELIVERY CHARGES</span>
            <span style="text-align: right; font-weight: 500; white-space: nowrap; color: ${receipt.shippingFee && receipt.shippingFee > 0 ? '#111' : '#15803d'};">
              ${receipt.shippingFee && receipt.shippingFee > 0 ? `+ ${fmtCurrency(receipt.shippingFee)}` : 'FREE'}
            </span>
          </div>

          ${
            receipt.giftWrapCharge && receipt.giftWrapCharge > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px;">
                  <span style="color: #555;">GIFT PACKAGING</span>
                  <span style="text-align: right; font-weight: 500; white-space: nowrap;">+ ${fmtCurrency(receipt.giftWrapCharge)}</span>
                </div>
              `
              : ''
          }

          ${
            receipt.referralDiscount && receipt.referralDiscount > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px; color: #0f766e;">
                  <span style="font-weight: bold; letter-spacing: 0.5px;">REFERRAL DISCOUNT ${receipt.referralCode ? `(${receipt.referralCode})` : ''}</span>
                  <span style="text-align: right; font-weight: bold; white-space: nowrap;">− ${fmtCurrency(receipt.referralDiscount)}</span>
                </div>
              `
              : ''
          }

          ${
            receipt.coinsRedeemed && receipt.coinsRedeemed > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px; color: #b45309;">
                  <span style="font-weight: bold; letter-spacing: 0.5px;">BANARASI COINS REDEEMED</span>
                  <span style="text-align: right; font-weight: bold; white-space: nowrap;">− ${fmtCurrency(receipt.coinsRedeemed)}</span>
                </div>
              `
              : ''
          }

          ${
            receipt.appliedVoucherCode && (receipt.appliedVoucherAmount || 0) > 0
              ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #ccc; font-size: 12.5px; color: #b91c1c;">
                  <span style="font-weight: bold; letter-spacing: 0.5px;">COUPON APPLIED (${receipt.appliedVoucherCode})</span>
                  <span style="text-align: right; white-space: nowrap;">− ${fmtCurrency(receipt.appliedVoucherAmount || 0)}</span>
                </div>
              `
              : ''
          }

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 8px 0; border-bottom: 2px solid #111; font-size: 13.5px;">
            <span style="font-weight: bold; letter-spacing: 0.5px;">TOTAL AMOUNT</span>
            <span style="font-weight: bold; text-align: right; white-space: nowrap; font-size: 14px;">${fmtCurrency(receipt.totalAmount)}</span>
          </div>

          ${
            totalSavings > 0
              ? `
                <div style="margin-top: 8px; padding: 7px 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; color: #15803d; font-size: 11.5px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                  <span>🎉 Total Savings</span>
                  <span>${fmtCurrency(totalSavings)}${totalSavingsPercent > 0 ? ` (${parseFloat(totalSavingsPercent.toFixed(1))}%)` : ''}</span>
                </div>
              `
              : ''
          }
        </div>
      </div>

      <!-- Terms -->
      <div style="margin-top: 36px; padding-top: 20px; border-top: 1.5px dashed #bbb;">
        <div style="font-weight: bold; font-size: 12px; letter-spacing: 0.5px; margin-bottom: 10px;">
          TERMS &amp; CONDITIONS
        </div>
        <ol style="padding-left: 18px; margin: 0; line-height: 1.85; color: #333; font-size: 11.5px;">
          ${TERMS.map((t) => `<li style="margin-bottom: 2px;">${t}</li>`).join('')}
        </ol>
      </div>

      <!-- Footer -->
      <div style="margin-top: 32px; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
        <div style="font-size: 11.5px; color: #444; max-width: 320px; line-height: 1.7;">
          <em>Thank you for supporting authentic Indian weavers &amp; handlooms!</em>
        </div>
        <div style="text-align: right; font-size: 11.5px; color: #333; flex-shrink: 0;">
          <div style="font-weight: bold; margin-bottom: 4px;">AUTHORISATION</div>
          <div style="color: #555; margin-bottom: 2px;">For Shree Banarasi Sarees</div>
          <div style="color: #555; font-style: italic; margin-bottom: 10px;">
            (Digitally Signed – No Physical Signature Required)
          </div>
          <div style="border-top: 1px solid #999; padding-top: 6px; font-weight: bold;">
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Downloads the invoice directly as a high-quality PDF in the user's browser.
 * Does not navigate away or open any preview tab.
 */
export async function downloadInvoicePdf(receipt: ReceiptData): Promise<void> {
  if (typeof window === 'undefined') return;

  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const { jsPDF } = await import('jspdf');

  // Create an offscreen wrapper that doesn't disrupt user viewport
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-9999';

  container.innerHTML = generateInvoiceHtml(receipt);
  document.body.appendChild(container);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // Give browser a microtask to finish rendering layout
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(container, {
      scale: 2, // 2x resolution for crisp lines and text
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210; // A4 mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = 297; // A4 mm

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    } else {
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
    }

    const safeInvoiceNumber = (receipt.invoiceNumber || 'SBS_Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`Receipt_${safeInvoiceNumber}.pdf`);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
