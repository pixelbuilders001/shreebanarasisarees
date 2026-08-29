export const GA_MEASUREMENT_ID = "G-K01N6ZDTKH";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Track Page Navigation View
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Generic Event Tracker
export const event = (action: string, params?: Record<string, any>) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
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
        item_category: product.category || "Banarasi Sarees",
        price: finalPrice,
        quantity: 1,
      },
    ],
  });
};

// 5. Begin Checkout
export const trackBeginCheckout = (
  items: { product: { id: string; name: string; category?: string; price: number; salePrice?: number }; quantity: number }[],
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
        item_category: item.product.category || "Banarasi Sarees",
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};

// 6. Purchase Completed
export const trackPurchase = (order: {
  orderId: string;
  total: number;
  shipping?: number;
  paymentMethod?: string;
  items: { product: { id: string; name: string; category?: string; price: number; salePrice?: number }; quantity: number }[];
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
        item_category: item.product.category || "Banarasi Sarees",
        price: finalPrice,
        quantity: item.quantity,
      };
    }),
  });
};
