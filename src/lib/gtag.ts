export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-Q2T1PB067Q";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Track Page Navigation View
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["config", GA_MEASUREMENT_ID, { page_path: url }]);
  }
};

// Generic Event Tracker
export const event = (action: string, params?: Record<string, any>) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", action, params);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["event", action, params]);
  }
};

// -------------------------------------------------------------
// GA4 E-Commerce Standard Events
// -------------------------------------------------------------

export interface GAItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
}

// 1. View Item (Product Detail View)
export const trackViewItem = (product: {
  id: string;
  name: string;
  category?: string;
  fabric?: string;
  price: number;
  salePrice?: number;
}) => {
  const finalPrice = product.salePrice ?? product.price;
  event("view_item", {
    currency: "INR",
    value: finalPrice,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: product.category || "Banarasi Sarees",
        item_variant: product.fabric || undefined,
        price: finalPrice,
        quantity: 1,
      },
    ],
  });
};

// 2. Add to Cart
export const trackAddToCart = (
  product: {
    id: string;
    name: string;
    category?: string;
    fabric?: string;
    price: number;
    salePrice?: number;
  },
  quantity: number = 1
) => {
  const finalPrice = product.salePrice ?? product.price;
  event("add_to_cart", {
    currency: "INR",
    value: finalPrice * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: product.category || "Banarasi Sarees",
        item_variant: product.fabric || undefined,
        price: finalPrice,
        quantity,
      },
    ],
  });
};

// 3. Remove from Cart
export const trackRemoveFromCart = (
  product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    salePrice?: number;
  },
  quantity: number = 1
) => {
  const finalPrice = product.salePrice ?? product.price;
  event("remove_from_cart", {
    currency: "INR",
    value: finalPrice * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: product.category || "Banarasi Sarees",
        price: finalPrice,
        quantity,
      },
    ],
  });
};

// 4. Add to Wishlist
export const trackAddToWishlist = (product: {
  id: string;
  name: string;
  category?: string;
  price: number;
  salePrice?: number;
}) => {
  const finalPrice = product.salePrice ?? product.price;
  event("add_to_wishlist", {
    currency: "INR",
    value: finalPrice,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: product.category || "Banarasi Sarees",
        price: finalPrice,
        quantity: 1,
      },
    ],
  });
};

// 5. View Cart
export const trackViewCart = (
  items: {
    product: {
      id: string;
      name: string;
      category?: string;
      fabric?: string;
      price: number;
      salePrice?: number;
    };
    quantity: number;
    selectedAddons?: { price: number }[];
  }[],
  totalValue: number
) => {
  event("view_cart", {
    currency: "INR",
    value: totalValue,
    items: items.map((item) => {
      const addonsPerItem = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const finalPrice = (item.product.salePrice ?? item.product.price) + addonsPerItem;
      return {
        item_id: item.product.id,
        item_name: item.product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: item.product.category || "Banarasi Sarees",
        item_variant: item.product.fabric || undefined,
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};

// 6. View Item List (Catalog / Category Browsing)
export const trackViewItemList = (
  items: {
    id: string;
    name: string;
    category?: string;
    fabric?: string;
    price: number;
    salePrice?: number;
  }[],
  listName: string = "All Sarees"
) => {
  event("view_item_list", {
    item_list_name: listName,
    items: items.slice(0, 20).map((product, index) => {
      const finalPrice = product.salePrice ?? product.price;
      return {
        item_id: product.id,
        item_name: product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: product.category || "Banarasi Sarees",
        item_variant: product.fabric || undefined,
        price: finalPrice,
        index: index + 1,
      };
    }),
  });
};

// 7. Begin Checkout
export const trackBeginCheckout = (
  items: { product: { id: string; name: string; category?: string; fabric?: string; price: number; salePrice?: number }; quantity: number }[],
  totalValue: number
) => {
  event("begin_checkout", {
    currency: "INR",
    value: totalValue,
    items: items.map((item) => {
      const finalPrice = item.product.salePrice ?? item.product.price;
      return {
        item_id: item.product.id,
        item_name: item.product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: item.product.category || "Banarasi Sarees",
        item_variant: item.product.fabric || undefined,
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};

// 8. Add Shipping Info
export const trackAddShippingInfo = (
  items: { product: { id: string; name: string; category?: string; fabric?: string; price: number; salePrice?: number }; quantity: number; selectedAddons?: { price: number }[] }[],
  totalValue: number,
  shippingTier: string = "Standard Delivery",
  coupon?: string
) => {
  event("add_shipping_info", {
    currency: "INR",
    value: totalValue,
    shipping_tier: shippingTier,
    coupon: coupon || undefined,
    items: items.map((item) => {
      const addonsPerItem = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const finalPrice = (item.product.salePrice ?? item.product.price) + addonsPerItem;
      return {
        item_id: item.product.id,
        item_name: item.product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: item.product.category || "Banarasi Sarees",
        item_variant: item.product.fabric || undefined,
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};

// 9. Add Payment Info
export const trackAddPaymentInfo = (
  items: { product: { id: string; name: string; category?: string; fabric?: string; price: number; salePrice?: number }; quantity: number; selectedAddons?: { price: number }[] }[],
  totalValue: number,
  paymentType: string = "Cash on Delivery",
  coupon?: string
) => {
  event("add_payment_info", {
    currency: "INR",
    value: totalValue,
    payment_type: paymentType,
    coupon: coupon || undefined,
    items: items.map((item) => {
      const addonsPerItem = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const finalPrice = (item.product.salePrice ?? item.product.price) + addonsPerItem;
      return {
        item_id: item.product.id,
        item_name: item.product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: item.product.category || "Banarasi Sarees",
        item_variant: item.product.fabric || undefined,
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};

// 10. Purchase Completed
export const trackPurchase = (order: {
  orderId: string;
  total: number;
  shipping?: number;
  paymentMethod?: string;
  items: { product: { id: string; name: string; category?: string; fabric?: string; price: number; salePrice?: number }; quantity: number }[];
}) => {
  event("purchase", {
    transaction_id: order.orderId,
    value: order.total,
    shipping: order.shipping || 0,
    currency: "INR",
    payment_type: order.paymentMethod || "Online/COD",
    items: order.items.map((item) => {
      const finalPrice = item.product.salePrice ?? item.product.price;
      return {
        item_id: item.product.id,
        item_name: item.product.name,
        item_brand: "Shree Banarasi Sarees",
        item_category: item.product.category || "Banarasi Sarees",
        item_variant: item.product.fabric || undefined,
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};
