import { createClient } from '@supabase/supabase-js';
import { Product, PRODUCTS } from './products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: string;
  sort_order: number;
}

export interface DbInventory {
  id: string;
  saree_name: string;
  category: string;
  fabric: string;
  color: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  rack_no: string | null;
  barcode: string | null;
  status: string;
  created_at: string;
  sku: string | null;
  design_code?: string | null;
  hsn_code?: string | null;
  description: string | null;
  mrp: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  inventory_images?: {
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
}

/**
 * Stable slug generator for database products.
 */
export function getProductSlug(name: string, id: string): string {
  const cleanedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanedName}-${id.toLowerCase()}`;
}

/**
 * Maps Supabase inventory item to the app's Product format.
 */
export function mapDbProductToProduct(item: DbInventory): Product {
  // Sort images: primary first, then by sort_order from Supabase inventory_images table
  let imageUrls: string[] = [];
  if (item.inventory_images && item.inventory_images.length > 0) {
    const sorted = [...item.inventory_images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.sort_order - b.sort_order;
    });
    imageUrls = sorted.map(img => img.image_url);
  }

  // Fallback image if none exist
  if (imageUrls.length === 0) {
    imageUrls = ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"];
  }

  const mrpVal = item.mrp ? Number(item.mrp) : Number(item.selling_price);
  const sellingPrice = Number(item.selling_price);
  
  // Saree parameters defaults / overrides
  const descLower = (item.description || '').toLowerCase();
  const nameLower = item.saree_name.toLowerCase();

  // Occasion detection
  let occasion = 'Festive';
  if (nameLower.includes('wedding') || nameLower.includes('bridal') || descLower.includes('wedding') || descLower.includes('bridal')) {
    occasion = 'Wedding';
  } else if (nameLower.includes('party') || descLower.includes('party')) {
    occasion = 'Party';
  } else if (nameLower.includes('office') || descLower.includes('office') || nameLower.includes('formal') || descLower.includes('formal')) {
    occasion = 'Office';
  } else if (nameLower.includes('daily') || descLower.includes('daily') || nameLower.includes('casual') || descLower.includes('casual')) {
    occasion = 'Daily Wear';
  } else if (nameLower.includes('gift') || descLower.includes('gift')) {
    occasion = 'Gift';
  }

  // Derive stable values based on string seed
  const idHash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = Number((4.3 + (idHash % 8) / 10).toFixed(1)); // 4.3 to 5.0
  const reviewsCount = 6 + (idHash % 25); // 6 to 30

  // Category mapping normalization
  let categoryNormalized = (item.category || 'Banarasi').trim();
  if (categoryNormalized) {
    categoryNormalized = categoryNormalized.charAt(0).toUpperCase() + categoryNormalized.slice(1).toLowerCase();
  }

  let finalCategory = categoryNormalized as Product['category'];
  if (finalCategory === 'Kanjivaram') {
    finalCategory = 'Banarasi';
  }

  return {
    id: item.id,
    sku: item.sku || `SBS-${item.id.toUpperCase()}`,
    name: item.saree_name,
    slug: getProductSlug(item.saree_name, item.id),
    description: item.description || `Exquisite traditional ${item.fabric} saree in ${item.color}. Featuring premium finishing and design.`,
    category: finalCategory,
    fabric: item.fabric || 'Silk',
    color: item.color || 'Red',
    occasion,
    price: mrpVal,
    salePrice: sellingPrice < mrpVal ? sellingPrice : undefined,
    stock: item.stock || 0,
    images: imageUrls,
    featured: item.status === 'active' && item.stock > 0 && (idHash % 4 === 0),
    newArrival: item.status === 'active' && (idHash % 3 === 0),
    bestseller: item.status === 'active' && (idHash % 5 === 0),
    customizable: true,
    rating,
    reviewsCount,
    length: "5.5 meters",
    blousePiece: "0.8 meters",
    work: "Traditional woven borders and zari motifs",
    care: "Dry Clean Only",
    designCode: item.design_code || undefined
  };
}

/**
 * Fetch all active sarees sharing the same design_code.
 */
export async function fetchDesignVariants(designCode?: string | null): Promise<Product[]> {
  if (!designCode || !designCode.trim()) return [];
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, inventory_images(*)')
      .eq('status', 'active')
      .eq('design_code', designCode.trim().toUpperCase());

    if (error) {
      console.error('Error fetching design variants:', error);
      return [];
    }

    const dbItems = (data || []) as DbInventory[];
    return dbItems.map(mapDbProductToProduct);
  } catch (err) {
    console.error('Exception in fetchDesignVariants:', err);
    return [];
  }
}

/**
 * Fetch all active categories from Supabase.
 */
export async function fetchCategories(): Promise<DbCategory[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exception in fetchCategories:', err);
    return [];
  }
}

/**
 * Fetch all active products from Supabase.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, inventory_images(*)')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    const dbItems = (data || []) as DbInventory[];
    return dbItems.map(mapDbProductToProduct);
  } catch (err) {
    console.error('Exception in fetchProducts:', err);
    return [];
  }
}

/**
 * Fetch a single product by its slug.
 */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    // 1. Try to extract ID from end of slug (format: name-id)
    const parts = slug.split('-');
    if (parts.length > 1) {
      const idCandidate = parts[parts.length - 1];
      const { data, error } = await supabase
        .from('inventory')
        .select('*, inventory_images(*)')
        .eq('id', idCandidate)
        .single();

      if (!error && data) {
        const product = mapDbProductToProduct(data as DbInventory);
        // Double check slug matches
        if (product.slug === slug) {
          return product;
        }
      }
    }

    // 2. Fallback: Fetch all products and find the matching one
    const allProducts = await fetchProducts();
    const found = allProducts.find(p => p.slug === slug);
    return found || null;
  } catch (err) {
    console.error('Exception in fetchProductBySlug:', err);
    return null;
  }
}
export async function fetchDbWishlist(userId: string): Promise<string[]> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return [];

    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching DB wishlist:', error);
      return [];
    }
    return (data || []).map((item: any) => item.product_id);
  } catch (err) {
    console.error('Exception in fetchDbWishlist:', err);
    return [];
  }
}

export async function addToDbWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return false;

    const { error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId
      });

    if (error) {
      console.error('Error adding to DB wishlist:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in addToDbWishlist:', err);
    return false;
  }
}

export async function removeFromDbWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return false;

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from DB wishlist:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in removeFromDbWishlist:', err);
    return false;
  }
}

export interface DbCartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export async function fetchDbCart(userId: string): Promise<{ product_id: string; quantity: number }[]> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching DB cart:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exception in fetchDbCart:', err);
    return [];
  }
}

export async function upsertDbCartItem(userId: string, productId: string, quantity: number): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return false;

    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: userId, product_id: productId, quantity },
        { onConflict: 'user_id,product_id' }
      );
    if (error) {
      console.error('Error upserting DB cart item:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in upsertDbCartItem:', err);
    return false;
  }
}

export async function deleteDbCartItem(userId: string, productId: string): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return false;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) {
      console.error('Error deleting DB cart item:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in deleteDbCartItem:', err);
    return false;
  }
}

export async function clearDbCart(userId: string): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return false;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    if (error) {
      console.error('Error clearing DB cart:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in clearDbCart:', err);
    return false;
  }
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface Order {
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    deliveryMethod: 'Home Delivery' | 'Store Pickup';
  };
  items: { product: Product; quantity: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'UPI' | 'Cash on Delivery' | 'Online Payment';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus: 'Order Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  statusHistory?: OrderStatusHistoryEntry[];
  // Gift order fields
  is_gift?: boolean;
  gift_recipient_name?: string | null;
  gift_message?: string | null;
  gift_wrap_charge?: number;
}

export async function createDbOrder(orderData: {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    deliveryMethod: 'Home Delivery' | 'Store Pickup';
  };
  items: { product: Product; quantity: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'UPI' | 'Cash on Delivery' | 'Online Payment';
  is_gift?: boolean;
  gift_recipient_name?: string | null;
  gift_message?: string | null;
  gift_wrap_charge?: number;
}, userId?: string | null): Promise<Order | null> {
  try {
    const orderNumber = `SBS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingFee = orderData.shipping;
    const discount = 0; // No coupon system — never trust a client-supplied discount
    const paymentMethodMap = 'cod'; // DB constraint check enforces cod

    // Fetch authoritative prices + stock from the inventory table
    const { data: dbInventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, selling_price, stock')
      .in('id', orderData.items.map(item => item.product.id));

    if (inventoryError) {
      console.error('Error fetching inventory for order:', inventoryError);
      return null;
    }

    const priceMap = new Map((dbInventory ?? []).map(row => [row.id, row]));

    let subtotal = 0;
    for (const item of orderData.items) {
      const dbRow = priceMap.get(item.product.id);
      if (!dbRow) {
        console.error('Order rejected: product not found in inventory', item.product.id);
        return null;
      }
      if (Number(dbRow.stock) < item.quantity) {
        console.error('Order rejected: insufficient stock for', item.product.id);
        return null;
      }
      subtotal += Number(dbRow.selling_price) * item.quantity;
    }
    const total = Math.round((subtotal - discount + shippingFee) * 100) / 100;

    // 1. Insert order metadata into orders table
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: orderData.customer.name,
        customer_phone: orderData.customer.phone,
        customer_email: orderData.customer.email || null,
        shipping_address: orderData.customer,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        discount: discount,
        total_amount: total,
        payment_method: paymentMethodMap,
        payment_status: 'pending',
        order_status: 'placed',
        notes: `Original payment method: ${orderData.paymentMethod}`,
        user_id: userId || null,
        // Gift fields
        is_gift: orderData.is_gift ?? false,
        gift_recipient_name: orderData.gift_recipient_name || null,
        gift_message: orderData.gift_message || null,
        gift_wrap_charge: orderData.gift_wrap_charge ?? 0
      })
      .select('id, created_at')
      .single();

    if (orderError || !orderRow) {
      console.error('Error inserting order:', orderError);
      return null;
    }

    const orderIdUuid = orderRow.id;
    const createdAtStr = orderRow.created_at;

    // 2. Prepare items insert
    const itemsRows = orderData.items.map(item => {
      const dbRow = priceMap.get(item.product.id);
      const unitPrice = dbRow ? Number(dbRow.selling_price) : 0;
      const totalPrice = unitPrice * item.quantity;
      return {
        order_id: orderIdUuid,
        inventory_id: item.product.id,
        product_name: item.product.name,
        sku: item.product.sku || null,
        barcode: null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        product_snapshot: item.product
      };
    });

    // 3. Insert items into order_items table
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsRows);

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
      // Clean up orders row
      await supabase.from('orders').delete().eq('id', orderIdUuid);
      return null;
    }

    // 4. Insert initial status history log into order_status_history table
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderIdUuid,
        status: 'placed',
        note: 'Order placed successfully by customer on storefront'
      });

    if (historyError) {
      console.error('Error inserting order status history:', historyError);
    }

    const finalOrder: Order = {
      orderId: orderNumber,
      customer: orderData.customer,
      items: orderData.items,
      subtotal: subtotal,
      discount: discount,
      shipping: shippingFee,
      total: total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Order Placed',
      createdAt: createdAtStr,
      statusHistory: [
        {
          id: 'initial',
          orderId: orderIdUuid,
          status: 'placed',
          note: 'Order placed successfully by customer on storefront',
          createdAt: createdAtStr
        }
      ]
    };

    // Trigger email & push notification for order placement (COD or Online)
    if (orderData.customer.email) {
      triggerOrderNotificationEmail('ORDER_PLACED', finalOrder);
    }
    if (userId) {
      triggerOrderPushNotification('placed', {
        order_number: orderNumber,
        user_id: userId,
        customer_name: orderData.customer.name,
        total_amount: total,
        image_url: orderData.items?.[0]?.product?.images?.[0] || null,
      });
    }

    return finalOrder;
  } catch (err) {
    console.error('Exception in createDbOrder:', err);
    return null;
  }
}

export async function fetchDbOrders(userId: string): Promise<Order[]> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!userId || !isUuid) {
      return [];
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError || !ordersData) {
      console.error('Error fetching orders:', ordersError);
      return [];
    }

    const resolvedOrders: Order[] = [];

    for (const orderRow of ordersData) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderRow.id);

      if (itemsError || !itemsData) {
        console.error(`Error fetching items for order ${orderRow.id}:`, itemsError);
        continue;
      }

      const items = itemsData.map(item => {
        const productSnapshot = item.product_snapshot as any;
        const product: Product = productSnapshot || {
          id: item.inventory_id,
          sku: item.sku || '',
          name: item.product_name,
          slug: getProductSlug(item.product_name, item.inventory_id),
          description: '',
          category: 'Banarasi',
          fabric: '',
          color: '',
          occasion: 'Festive',
          price: Number(item.unit_price),
          images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"],
          stock: 0,
          rating: 5,
          reviewsCount: 1,
          length: '5.5 meters',
          blousePiece: '0.8 meters',
          work: '',
          care: ''
        };

        return {
          product,
          quantity: item.quantity
        };
      });

      let orderStatus: Order['orderStatus'] = 'Order Placed';
      if (orderRow.order_status === 'confirmed') orderStatus = 'Confirmed';
      else if (orderRow.order_status === 'processing') orderStatus = 'Confirmed';
      else if (orderRow.order_status === 'packed') orderStatus = 'Packed';
      else if (orderRow.order_status === 'shipped') orderStatus = 'Shipped';
      else if (orderRow.order_status === 'out_for_delivery') orderStatus = 'Out for Delivery';
      else if (orderRow.order_status === 'delivered') orderStatus = 'Delivered';
      else if (orderRow.order_status === 'cancelled') orderStatus = 'Cancelled';

      let paymentStatus: Order['paymentStatus'] = 'Pending';
      if (orderRow.payment_status === 'paid') paymentStatus = 'Paid';
      else if (orderRow.payment_status === 'failed') paymentStatus = 'Failed';

      let paymentMethod: Order['paymentMethod'] = 'Cash on Delivery';
      if (orderRow.notes && orderRow.notes.includes('Original payment method: ')) {
        const originalMethod = orderRow.notes.replace('Original payment method: ', '').trim();
        paymentMethod = originalMethod as Order['paymentMethod'];
      } else if (orderRow.payment_method === 'cod') {
        paymentMethod = 'Cash on Delivery';
      }

      // Fetch status history from supabase
      const { data: historyData, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderRow.id)
        .order('created_at', { ascending: true });

      const statusHistory: OrderStatusHistoryEntry[] = [];
      if (historyData && !historyError) {
        historyData.forEach((h: any) => {
          statusHistory.push({
            id: h.id,
            orderId: h.order_id,
            status: h.status,
            note: h.note,
            createdAt: h.created_at
          });
        });
      }

      if (statusHistory.length === 0) {
        statusHistory.push({
          id: 'initial',
          orderId: orderRow.id,
          status: orderRow.order_status || 'placed',
          note: 'Order placed successfully by customer on storefront',
          createdAt: orderRow.created_at
        });
      }

      resolvedOrders.push({
        orderId: orderRow.order_number,
        customer: orderRow.shipping_address as any,
        items,
        subtotal: Number(orderRow.subtotal),
        discount: Number(orderRow.discount),
        shipping: Number(orderRow.shipping_fee),
        total: Number(orderRow.total_amount),
        paymentMethod,
        paymentStatus,
        orderStatus,
        createdAt: orderRow.created_at,
        statusHistory
      });
    }

    return resolvedOrders;
  } catch (err) {
    console.error('Exception in fetchDbOrders:', err);
    return [];
  }
}

export interface DeliveryCheckResult {
  success: boolean;
  serviceable: boolean;
  distance_km?: number;
  estimated_drive_minutes?: number;
  delivery_type?: 'express' | 'same_day' | 'standard' | null;
  delivery_charge?: number;
  message?: string;
}

export async function checkDeliveryServiceability(
  params: { latitude: number; longitude: number } | { pincode: string }
): Promise<DeliveryCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke('check-delivery', {
      body: params
    });

    if (error) {
      console.error('Edge function invocation error:', error);
      return { success: false, serviceable: false, message: error.message || 'API error' };
    }

    if (!data) {
      return { success: false, serviceable: false, message: 'No data returned from API' };
    }

    return {
      success: true,
      serviceable: !!data.serviceable,
      distance_km: data.distance_km,
      estimated_drive_minutes: data.estimated_drive_minutes,
      delivery_type: data.delivery_type,
      delivery_charge: data.delivery_charge,
      message: data.message
    };
  } catch (err: any) {
    console.error('Exception in checkDeliveryServiceability:', err);
    return { success: false, serviceable: false, message: err.message || 'Network error' };
  }
}

export async function createCashfreeOrder(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  userId?: string | null;
}): Promise<{ payment_session_id: string; cf_order_id: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-order', {
      body: params
    });

    if (error) {
      console.error('Error invoking create-payment-order edge function:', error);
      return null;
    }

    if (!data || !data.payment_session_id) {
      console.error('Invalid response from create-payment-order:', data);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in createCashfreeOrder:', err);
    return null;
  }
}

export async function verifyCashfreePayment(
  orderId: string
): Promise<{ order_status: string; cf_order_id?: string; order_amount?: number } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { orderId }
    });

    if (error) {
      console.error('Error invoking verify-payment edge function:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in verifyCashfreePayment:', err);
    return null;
  }
}

export async function triggerOrderNotificationEmail(
  action: 'ORDER_PLACED' | 'ORDER_CONFIRMED' | 'ORDER_DELIVERED',
  order: any
) {
  try {
    const email = order?.customer?.email || order?.customer_email;
    if (!order || !email) return;

    const payload = {
      action,
      order: {
        orderId: order.orderId || order.order_number,
        customerName: order.customer?.name || order.customer_name || 'Valued Customer',
        customerEmail: email,
        customerPhone: order.customer?.phone || order.customer_phone || '',
        address: order.customer?.address || order.shipping_address?.address || 'Store Pickup',
        city: order.customer?.city || order.shipping_address?.city || 'Samastipur',
        state: order.customer?.state || order.shipping_address?.state || 'Bihar',
        pinCode: order.customer?.pinCode || order.shipping_address?.pinCode || '848103',
        deliveryMethod: order.customer?.deliveryMethod || order.shipping_address?.deliveryMethod || 'Home Delivery',
        items: (order.items || []).map((i: any) => ({
          name: i.product?.name || i.product_name || 'Banarasi Saree',
          quantity: i.quantity || 1,
          price: i.product?.salePrice ?? i.product?.price ?? i.unit_price ?? 0,
        })),
        subtotal: order.subtotal || order.total_amount || 0,
        shipping: order.shipping || order.shipping_fee || 0,
        discount: order.discount || 0,
        total: order.total || order.total_amount || 0,
        paymentMethod: order.paymentMethod || order.payment_method || 'Online Payment',
        paymentStatus: order.paymentStatus || order.payment_status || 'Pending',
        isGift: order.is_gift,
        giftRecipientName: order.gift_recipient_name,
        giftMessage: order.gift_message,
      },
    };

    const { error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });

    if (error) {
      console.error('Error invoking send-email edge function:', error);
    }
  } catch (err) {
    console.error('Failed to trigger order notification email:', err);
  }
}

export async function triggerOrderPushNotification(
  orderStatus: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled',
  order: {
    order_number: string;
    user_id?: string | null;
    customer_name?: string;
    total_amount?: number;
    image_url?: string | null;
  }
) {
  try {
    if (!order || !order.user_id) return;

    // Instant notification on delivery confirms delivery and links to order details
    const targetUrl = `/account?orderId=${encodeURIComponent(order.order_number)}`;

    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        audience: 'user',
        target_user_id: order.user_id,
        order_status: orderStatus,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        image_url: order.image_url || null,
        notification_type: 'order',
        url: targetUrl,
      },
    });

    if (error) {
      console.error('Error invoking send-push edge function:', error);
    }
  } catch (err) {
    console.error('Failed to trigger order push notification:', err);
  }
}

/**
 * Trigger a dedicated Review Request push notification (e.g. 24 hours post delivery).
 */
export async function triggerReviewReminderNotification(order: {
  order_number: string;
  user_id: string;
  customer_name?: string;
  image_url?: string | null;
}) {
  try {
    if (!order || !order.user_id) return;

    const targetUrl = `/review?orderId=${encodeURIComponent(order.order_number)}`;

    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        audience: 'user',
        target_user_id: order.user_id,
        title: 'How is your new Banarasi Saree? ✨',
        body: `We hope you love your saree! Tap to rate your purchase for Order #${order.order_number} and share your feedback.`,
        order_number: order.order_number,
        customer_name: order.customer_name,
        image_url: order.image_url || null,
        notification_type: 'review_reminder',
        url: targetUrl,
      },
    });

    if (error) {
      console.error('Error sending review reminder push:', error);
    }
  } catch (err) {
    console.error('Failed to trigger review reminder push notification:', err);
  }
}

/**
 * Process delivered orders older than delayHours (default: 24 hours) and send review reminders.
 */
export async function processPendingReviewReminders(delayHours = 24): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

    // Query order_status_history for orders marked 'delivered' before cutoffDate
    const { data: deliveredHistory, error: hErr } = await supabase
      .from('order_status_history')
      .select('order_id, created_at')
      .eq('status', 'delivered')
      .lte('created_at', cutoffDate);

    if (hErr || !deliveredHistory || deliveredHistory.length === 0) return 0;

    const orderIds = deliveredHistory.map((h: any) => h.order_id);

    // Fetch details for these orders
    const { data: orders, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('id', orderIds)
      .eq('order_status', 'delivered');

    if (oErr || !orders || orders.length === 0) return 0;

    let count = 0;
    for (const order of orders) {
      if (!order.user_id) continue;

      // Check if review reminder was already sent for this order
      const { data: sentReminders } = await supabase
        .from('push_notifications')
        .select('id')
        .eq('target_user_id', order.user_id)
        .eq('notification_type', 'review_reminder')
        .ilike('body', `%${order.order_number}%`);

      if (sentReminders && sentReminders.length > 0) {
        continue;
      }

      // Check if customer already reviewed all items in this order
      const { data: existingReviews } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('order_id', order.id);

      if (existingReviews && existingReviews.length >= (order.order_items?.length || 1)) {
        continue;
      }

      // Send review reminder push!
      const firstItemImage = order.order_items?.[0]?.product_snapshot?.images?.[0] || null;
      await triggerReviewReminderNotification({
        order_number: order.order_number,
        user_id: order.user_id,
        customer_name: order.customer_name,
        image_url: firstItemImage
      });
      count++;
    }

    return count;
  } catch (err) {
    console.error('Error processing pending review reminders:', err);
    return 0;
  }
}

export async function updateDbOrderStatus(
  orderNumber: string,
  newStatus: string,
  note?: string
): Promise<boolean> {
  try {
    const { data: orderRow, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !orderRow) {
      console.error('Error fetching order for status update:', fetchError);
      return false;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        order_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderRow.id);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return false;
    }

    await supabase.from('order_status_history').insert({
      order_id: orderRow.id,
      status: newStatus,
      note: note || `Order status updated to ${newStatus} by admin`,
    });

    const statusLower = (newStatus || '').toLowerCase();
    const customerEmail = orderRow.customer_email || orderRow.shipping_address?.email;

    const orderPayload = {
      order_number: orderRow.order_number,
      customer_name: orderRow.customer_name || orderRow.shipping_address?.name,
      customer_email: customerEmail,
      customer_phone: orderRow.customer_phone || orderRow.shipping_address?.phone,
      shipping_address: orderRow.shipping_address,
      items: (orderRow.order_items || []).map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      total_amount: orderRow.total_amount,
      shipping_fee: orderRow.shipping_fee,
      discount: orderRow.discount,
      payment_method: orderRow.payment_method,
      payment_status: orderRow.payment_status,
    };

    // Trigger email based on status
    if ((statusLower === 'confirmed' || statusLower.includes('confirm')) && customerEmail) {
      triggerOrderNotificationEmail('ORDER_CONFIRMED', orderPayload);
    } else if ((statusLower === 'delivered' || statusLower.includes('deliver')) && customerEmail) {
      triggerOrderNotificationEmail('ORDER_DELIVERED', orderPayload);
    }

    // Trigger FCM push notification to target customer
    if (orderRow.user_id) {
      let stageKey: any = 'placed';
      if (statusLower.includes('confirm')) stageKey = 'confirmed';
      else if (statusLower.includes('pack')) stageKey = 'packed';
      else if (statusLower.includes('ship') || statusLower.includes('dispatch')) stageKey = 'shipped';
      else if (statusLower.includes('out_for_delivery') || statusLower.includes('out for delivery')) stageKey = 'out_for_delivery';
      else if (statusLower.includes('deliver')) stageKey = 'delivered';
      else if (statusLower.includes('cancel')) stageKey = 'cancelled';

      const firstItemSnapshot = orderRow.order_items?.[0]?.product_snapshot as any;
      const firstItemImage = firstItemSnapshot?.images?.[0] || null;

      triggerOrderPushNotification(stageKey, {
        order_number: orderRow.order_number,
        user_id: orderRow.user_id,
        customer_name: orderRow.customer_name || orderRow.shipping_address?.name,
        total_amount: Number(orderRow.total_amount),
        image_url: firstItemImage,
      });
    }

    return true;
  } catch (err) {
    console.error('Exception in updateDbOrderStatus:', err);
    return false;
  }
}

export async function cancelDbOrder(orderNumber: string): Promise<boolean> {
  try {
    const { data: orderRow, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_status')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !orderRow) {
      console.error('Error fetching order for cancellation:', fetchError);
      return false;
    }

    const currentStatus = orderRow.order_status?.toLowerCase();
    if (
      currentStatus === 'out_for_delivery' ||
      currentStatus === 'delivered' ||
      currentStatus === 'cancelled'
    ) {
      console.warn(`Cannot cancel order in status: ${currentStatus}`);
      return false;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ order_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderRow.id);

    if (updateError) {
      console.error('Error updating order status to cancelled:', updateError);
      return false;
    }

    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderRow.id,
        status: 'cancelled',
        note: 'Order cancelled by customer'
      });

    if (historyError) {
      console.error('Error inserting cancellation status history:', historyError);
    }

    return true;
  } catch (err) {
    console.error('Exception in cancelDbOrder:', err);
    return false;
  }
}

export async function cancelDbOrderItem(orderNumber: string, productId: string): Promise<{ success: boolean; cancelledEntireOrder: boolean; newSubtotal?: number; newTotal?: number }> {
  try {
    const { data: orderRow, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, subtotal, total_amount, order_status')
      .eq('order_number', orderNumber)
      .single();

    if (orderFetchError || !orderRow) {
      console.error('Error fetching order for item cancellation:', orderFetchError);
      return { success: false, cancelledEntireOrder: false };
    }

    const currentStatus = orderRow.order_status?.toLowerCase();
    if (
      currentStatus === 'out_for_delivery' ||
      currentStatus === 'delivered' ||
      currentStatus === 'cancelled'
    ) {
      console.warn(`Cannot cancel item in status: ${currentStatus}`);
      return { success: false, cancelledEntireOrder: false };
    }

    const { data: items, error: itemsFetchError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderRow.id);

    if (itemsFetchError || !items) {
      console.error('Error fetching order items for cancellation:', itemsFetchError);
      return { success: false, cancelledEntireOrder: false };
    }

    if (items.length <= 1) {
      const success = await cancelDbOrder(orderNumber);
      return { success, cancelledEntireOrder: true };
    }

    const targetItem = items.find(item => item.inventory_id === productId);
    if (!targetItem) {
      console.error(`Item with product ID ${productId} not found in order ${orderNumber}`);
      return { success: false, cancelledEntireOrder: false };
    }

    const itemTotalPrice = Number(targetItem.total_price);
    const productName = targetItem.product_name;

    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderRow.id)
      .eq('inventory_id', productId);

    if (deleteError) {
      console.error('Error deleting order item:', deleteError);
      return { success: false, cancelledEntireOrder: false };
    }

    const newSubtotal = Math.max(0, Number(orderRow.subtotal) - itemTotalPrice);
    const newTotal = Math.max(0, Number(orderRow.total_amount) - itemTotalPrice);

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderRow.id);

    if (updateError) {
      console.error('Error updating order totals:', updateError);
      return { success: false, cancelledEntireOrder: false };
    }

    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderRow.id,
        status: 'item_cancelled',
        note: `Cancelled "${productName}" (Qty ${targetItem.quantity}) from order`
      });

    if (historyError) {
      console.error('Error inserting item cancellation history:', historyError);
    }

    return {
      success: true,
      cancelledEntireOrder: false,
      newSubtotal,
      newTotal
    };
  } catch (err) {
    console.error('Exception in cancelDbOrderItem:', err);
    return { success: false, cancelledEntireOrder: false };
  }
}

export interface DbCampaign {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string | null;
  desktop_banner_url: string | null;
  mobile_banner_url: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'inactive';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchActiveCampaigns(): Promise<DbCampaign[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active campaigns:', error);
      return [];
    }
    return (data || []) as DbCampaign[];
  } catch (err) {
    console.error('Exception in fetchActiveCampaigns:', err);
    return [];
  }
}

export async function fetchCampaignBySlug(slug: string): Promise<DbCampaign | null> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error('Error fetching campaign by slug:', error);
      return null;
    }
    return data as DbCampaign;
  } catch (err) {
    console.error('Exception in fetchCampaignBySlug:', err);
    return null;
  }
}

export interface DbHeroBanner {
  id: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchActiveHeroBanners(): Promise<DbHeroBanner[]> {
  try {
    const now = new Date().toISOString();
    // Fetch all active banners; we'll filter date ranges client-side
    // because null start_at/end_at means "no restriction"
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching hero banners:', error);
      return [];
    }

    const banners = (data || []) as DbHeroBanner[];

    // Filter by scheduling window — null means no restriction
    return banners.filter(b => {
      const afterStart = !b.start_at || now >= b.start_at;
      const beforeEnd = !b.end_at || now <= b.end_at;
      return afterStart && beforeEnd;
    });
  } catch (err) {
    console.error('Exception in fetchActiveHeroBanners:', err);
    return [];
  }
}

export async function fetchCampaignProducts(campaignId: string): Promise<Product[]> {
  try {
    const { data: campaignProds, error: cpError } = await supabase
      .from('campaign_products')
      .select('inventory_id')
      .eq('campaign_id', campaignId);

    if (cpError || !campaignProds) {
      console.error('Error fetching campaign products relation:', cpError);
      return [];
    }

    const inventoryIds = campaignProds.map(cp => cp.inventory_id);
    if (inventoryIds.length === 0) {
      return [];
    }

    const { data: inventoryData, error: invError } = await supabase
      .from('inventory')
      .select('*, inventory_images(*)')
      .in('id', inventoryIds)
      .eq('status', 'active');

    if (invError || !inventoryData) {
      console.error('Error fetching inventory for campaign:', invError);
      return [];
    }

    const dbItems = inventoryData as DbInventory[];
    return dbItems.map(mapDbProductToProduct);
  } catch (err) {
    console.error('Exception in fetchCampaignProducts:', err);
    return [];
  }
}

/**
 * Fetch similar/recommended products for the "You May Also Like" section.
 * Prioritisation order:
 *   1. Same category + same fabric + same/similar colour
 *   2. Same category + same fabric
 *   3. Same category only (fallback)
 * The current product is always excluded.
 * Returns up to `limit` products.
 */
export async function fetchSimilarProducts(
  currentProduct: {
    id: string;
    category: string;
    fabric: string;
    color: string;
    price: number;
  },
  limit = 4
): Promise<Product[]> {
  try {
    // Fetch a broader pool: same category, active, with images
    const { data, error } = await supabase
      .from('inventory')
      .select('*, inventory_images(*)')
      .eq('status', 'active')
      .ilike('category', `%${currentProduct.category}%`)
      .neq('id', currentProduct.id)
      .limit(60); // fetch enough to score & rank

    if (error || !data) {
      console.error('Error fetching similar products:', error);
      return [];
    }

    const pool = (data as DbInventory[]).map(mapDbProductToProduct);

    // Score each product for similarity
    const scored = pool.map((p) => {
      let score = 0;

      // Category match (guaranteed by query, but double-check normalised value)
      const catMatch =
        p.category.toLowerCase() === currentProduct.category.toLowerCase();
      if (catMatch) score += 10;

      // Fabric match
      if (
        p.fabric &&
        currentProduct.fabric &&
        p.fabric.toLowerCase() === currentProduct.fabric.toLowerCase()
      ) {
        score += 6;
      }

      // Color similarity (partial word match is good enough for sarees)
      if (p.color && currentProduct.color) {
        const currentColors = currentProduct.color.toLowerCase().split(/[\s,/]+/);
        const pColors = p.color.toLowerCase().split(/[\s,/]+/);
        const colorOverlap = currentColors.some((c) =>
          pColors.some((pc) => pc.includes(c) || c.includes(pc))
        );
        if (colorOverlap) score += 4;
      }

      // Price similarity: within ±40% of current price
      const priceDiff =
        Math.abs(p.price - currentProduct.price) / (currentProduct.price || 1);
      if (priceDiff <= 0.2) score += 3;
      else if (priceDiff <= 0.4) score += 1;

      return { product: p, score };
    });

    // Sort by score descending, then randomly for variety among equal scores
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Math.random() - 0.5;
    });

    const results = scored.slice(0, limit).map((s) => s.product);

    // If we couldn't fill enough from category, no further fallback needed
    // (the pool was already category-scoped). Return whatever we have.
    return results;
  } catch (err) {
    console.error('Exception in fetchSimilarProducts:', err);
    return [];
  }
}

/**
 * Fetch a set of active products by their UUIDs.
 * Returns results in the same order as the provided IDs array.
 * Products that no longer exist or are inactive are silently skipped.
 */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return [];

  // Sanitise: remove empty/whitespace-only strings
  const validIds = ids.map((id) => id.trim()).filter(Boolean);
  if (validIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, inventory_images(*)')
      .in('id', validIds)
      .eq('status', 'active');

    if (error) {
      console.error('Error in fetchProductsByIds:', error);
      return [];
    }

    const dbItems = (data || []) as DbInventory[];
    const productMap = new Map(dbItems.map((item) => [item.id, mapDbProductToProduct(item)]));

    // Return in caller-specified order, skipping missing/inactive entries
    return validIds.reduce<Product[]>((acc, id) => {
      const p = productMap.get(id);
      if (p) acc.push(p);
      return acc;
    }, []);
  } catch (err) {
    console.error('Exception in fetchProductsByIds:', err);
    return [];
  }
}

export interface OrderReviewItem {
  productId: string;
  sku: string;
  name: string;
  fabric: string;
  color: string;
  price: number;
  image: string;
  quantity: number;
  existingReview?: {
    id: string;
    rating: number;
    title: string;
    review_text: string;
    created_at: string;
    status: string;
  } | null;
}

export interface OrderForReviewDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  orderStatus: string;
  createdAt: string;
  totalAmount: number;
  items: OrderReviewItem[];
}

export async function fetchOrderDetailsForReview(orderIdOrNumber: string): Promise<OrderForReviewDetails | null> {
  if (!orderIdOrNumber || !orderIdOrNumber.trim()) return null;
  const target = orderIdOrNumber.trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
    
    let query = supabase.from('orders').select('*, order_items(*)');
    if (isUuid) {
      query = query.eq('id', target);
    } else {
      query = query.ilike('order_number', target);
    }

    const { data: orderRow, error: orderError } = await query.single();

    if (orderError || !orderRow) {
      console.error('Error fetching order for review:', orderError);
      return null;
    }

    // Fetch any existing product reviews for this order
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('order_id', orderRow.id);

    if (reviewsError) {
      console.warn('Could not fetch existing reviews for order:', reviewsError);
    }

    const reviewsList = existingReviews || [];

    const items: OrderReviewItem[] = (orderRow.order_items || []).map((item: any) => {
      const snap = item.product_snapshot || {};
      const prodId = item.inventory_id || snap.id || '';
      
      const existingReviewObj = reviewsList.find((r: any) => r.product_id === prodId || (snap.id && r.product_id === snap.id));

      return {
        productId: prodId,
        sku: item.sku || snap.sku || '',
        name: item.product_name || snap.name || 'Banarasi Saree',
        fabric: snap.fabric || 'Silk',
        color: snap.color || '',
        price: Number(item.unit_price || snap.price || 0),
        image: snap.images?.[0] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
        quantity: item.quantity || 1,
        existingReview: existingReviewObj ? {
          id: existingReviewObj.id,
          rating: Number(existingReviewObj.rating),
          title: existingReviewObj.title || '',
          review_text: existingReviewObj.review_text || '',
          created_at: existingReviewObj.created_at,
          status: existingReviewObj.status || 'approved'
        } : null
      };
    });

    return {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      customerName: orderRow.customer_name || orderRow.shipping_address?.name || 'Valued Customer',
      customerEmail: orderRow.customer_email || orderRow.shipping_address?.email || '',
      orderStatus: orderRow.order_status || 'Delivered',
      createdAt: orderRow.created_at,
      totalAmount: Number(orderRow.total_amount || 0),
      items
    };
  } catch (err) {
    console.error('Exception in fetchOrderDetailsForReview:', err);
    return null;
  }
}

/**
 * Record a PWA installation event into Supabase pwa_installs table.
 */
export async function recordPwaInstall(platform?: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id || null;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    const { error } = await supabase
      .from('pwa_installs')
      .insert({
        user_id: userId,
        platform: platform || 'unknown',
        user_agent: userAgent
      });

    if (error) {
      console.error('[Supabase] Error recording PWA install:', error);
      return false;
    }
    console.log('[Supabase] PWA install recorded successfully');
    return true;
  } catch (err) {
    console.error('[Supabase] Exception recording PWA install:', err);
    return false;
  }
}



