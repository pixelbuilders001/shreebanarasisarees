import { createClient } from '@supabase/supabase-js';
import { Product, PRODUCTS } from './products';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholder';

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
  selling_price: number;
  stock: number;
  // rack_no: string | null;
  // barcode: string | null;
  status: string;
  // created_at: string;
  sku: string | null;
  design_code?: string | null;
  hsn_code?: string | null;
  gst_rate?: number | null;
  price_includes_gst?: boolean | null;
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
 * Public fields to select from the inventory table. Excludes confidential vendor pricing (purchase_price).
 */
export const PUBLIC_INVENTORY_SELECT = 'id, saree_name, category, fabric, color, selling_price, stock, status, sku, design_code, description, mrp, discount_amount, discount_percentage, hsn_code, gst_rate, price_includes_gst, inventory_images(image_url, is_primary, sort_order)';

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

export interface RatingSummary {
  rating: number;
  reviewsCount: number;
}

/**
 * Fetch rating averages and review counts for all products directly from the database table `product_reviews`.
 */
export async function fetchProductRatingsMap(): Promise<Record<string, RatingSummary>> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('product_id, rating')
      .or('status.eq.approved,status.is.null');

    if (error || !data) {
      return {};
    }

    const map: Record<string, { total: number; count: number }> = {};
    data.forEach((row: any) => {
      if (!row.product_id || !row.rating) return;
      const pid = String(row.product_id);
      if (!map[pid]) map[pid] = { total: 0, count: 0 };
      map[pid].total += Number(row.rating);
      map[pid].count += 1;
    });

    const result: Record<string, RatingSummary> = {};
    Object.keys(map).forEach((pid) => {
      const item = map[pid];
      if (item.count > 0) {
        result[pid] = {
          rating: Number((item.total / item.count).toFixed(1)),
          reviewsCount: item.count,
        };
      }
    });

    return result;
  } catch (err) {
    console.error('Error fetching product ratings map:', err);
    return {};
  }
}

/**
 * Maps Supabase inventory item to the app's Product format.
 */
export function mapDbProductToProduct(
  item: DbInventory,
  ratingMap?: Record<string, RatingSummary>
): Product {
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
    imageUrls = [NO_IMAGE_PLACEHOLDER];
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

  const idHash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Rating dynamically fetched from product_reviews table in Supabase
  const dbRating = ratingMap ? ratingMap[item.id] : undefined;
  const rating = dbRating ? dbRating.rating : 0;
  const reviewsCount = dbRating ? dbRating.reviewsCount : 0;

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
    designCode: item.design_code || undefined,
    hsn_code: item.hsn_code || '5208',
    gst_rate: item.gst_rate != null ? Number(item.gst_rate) : 5.0,
    price_includes_gst: item.price_includes_gst ?? true
  };
}

/**
 * Fetch all active sarees sharing the same design_code.
 */
export async function fetchDesignVariants(designCode?: string | null): Promise<Product[]> {
  if (!designCode || !designCode.trim()) return [];
  try {
    const [{ data, error }, ratingMap] = await Promise.all([
      supabase
        .from('storefront_products')
        .select(PUBLIC_INVENTORY_SELECT)
        .eq('status', 'active')
        .eq('design_code', designCode.trim().toUpperCase()),
      fetchProductRatingsMap()
    ]);

    if (error) {
      console.error('Error fetching design variants:', error);
      return [];
    }

    const dbItems = (data || []) as DbInventory[];
    return dbItems.map(item => mapDbProductToProduct(item, ratingMap));
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
    const [{ data, error }, ratingMap] = await Promise.all([
      supabase
        .from('storefront_products')
        .select(PUBLIC_INVENTORY_SELECT)
        .eq('status', 'active'),
      fetchProductRatingsMap()
    ]);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    const dbItems = (data || []) as DbInventory[];
    return dbItems.map(item => mapDbProductToProduct(item, ratingMap));
  } catch (err) {
    console.error('Exception in fetchProducts:', err);
    return [];
  }
}

/**
 * Fetches only the products required for the home page (bestsellers and new arrivals)
 * to avoid serializing the entire product catalog in the SSR RSC flight payload.
 */
export async function fetchHomePageProducts(): Promise<{
  bestsellers: Product[];
  newArrivals: Product[];
}> {
  try {
    const products = await fetchProducts();
    const withImages = products.filter(p => p.images && p.images.length > 0 && !p.images[0].startsWith('data:'));
    const pool = withImages.length > 0 ? withImages : products;
    const bestsellers = pool.filter(p => p.bestseller).slice(0, 8);
    const newArrivals = pool.filter(p => p.newArrival).slice(0, 8);

    return {
      bestsellers: bestsellers.length > 0 ? bestsellers : pool.slice(0, 8),
      newArrivals: newArrivals.length > 0 ? newArrivals : pool.slice(0, 8)
    };
  } catch (err) {
    console.error('Exception in fetchHomePageProducts:', err);
    return {
      bestsellers: PRODUCTS.filter(p => p.bestseller).slice(0, 8),
      newArrivals: PRODUCTS.filter(p => p.newArrival).slice(0, 8)
    };
  }
}

/**
 * Execute Full-Text Search on Supabase inventory using search_vector.
 */
export async function searchProductsAdvancedDb(params: {
  query?: string;
  category?: string;
  fabric?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}): Promise<Product[]> {
  try {
    let q = supabase
      .from('storefront_products')
      .select(PUBLIC_INVENTORY_SELECT)
      .eq('status', params.status || 'active');

    // Supabase Full-Text Search on search_vector
    if (params.query && params.query.trim()) {
      const cleanQuery = params.query.trim().replace(/[^a-zA-Z0-9\s]/g, ' ');
      if (cleanQuery) {
        q = q.textSearch('search_vector', cleanQuery, {
          config: 'english',
          type: 'websearch',
        });
      }
    }

    if (params.category && params.category !== 'All') {
      q = q.ilike('category', `%${params.category}%`);
    }

    if (params.fabric) {
      q = q.ilike('fabric', `%${params.fabric}%`);
    }

    if (params.color) {
      q = q.ilike('color', `%${params.color}%`);
    }

    if (params.minPrice !== undefined) {
      q = q.gte('selling_price', params.minPrice);
    }

    if (params.maxPrice !== undefined) {
      q = q.lte('selling_price', params.maxPrice);
    }

    const [{ data, error }, ratingMap] = await Promise.all([
      q,
      fetchProductRatingsMap()
    ]);

    if (error) {
      console.error('Error executing Supabase full-text search:', error);
      // Fallback to fetchProducts if search_vector column is not populated yet
      return fetchProducts();
    }

    const dbItems = (data || []) as DbInventory[];
    return dbItems.map(item => mapDbProductToProduct(item, ratingMap));
  } catch (err) {
    console.error('Exception in searchProductsAdvancedDb:', err);
    return fetchProducts();
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
      const idCandidate = parts[parts.length - 1].toUpperCase();
      const [{ data, error }, ratingMap] = await Promise.all([
        supabase
          .from('storefront_products')
          .select(PUBLIC_INVENTORY_SELECT)
          .eq('id', idCandidate)
          .single(),
        fetchProductRatingsMap()
      ]);

      if (!error && data) {
        const product = mapDbProductToProduct(data as DbInventory, ratingMap);
        // Double check slug matches
        if (product.slug.toLowerCase() === slug.toLowerCase()) {
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

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: any;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  payment_method: 'cod' | string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'placed' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_gift: boolean;
  gift_recipient_name: string | null;
  gift_message: string | null;
  gift_wrap_charge: number;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  inventory_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: any | null;
  created_at: string;
}

export interface DbOrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface Order {
  id?: string;
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
  items: {
    id?: string;
    inventory_id?: string;
    item_status?: string;
    unit_price?: number;
    total_price?: number;
    product: Product;
    quantity: number;
    hsn_code?: string;
    discount_amount?: number;
    taxable_value?: number;
    gst_rate?: number;
    cgst_amount?: number;
    sgst_amount?: number;
    igst_amount?: number;
    gst_amount?: number;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  taxable_amount?: number;
  gst_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  gst_rate?: number;
  place_of_supply?: string;
  invoice_number?: string;
  invoice_date?: string;
  paymentMethod: 'UPI' | 'Cash on Delivery' | 'Online Payment';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: 'Order Placed' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  createdAt: string;
  statusHistory?: OrderStatusHistoryEntry[];
  // Gift order fields
  is_gift?: boolean;
  gift_recipient_name?: string | null;
  gift_message?: string | null;
  gift_wrap_charge?: number;
}

export interface CreateDbOrderParams {
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: any;
  notes?: string;
  coupon_code?: string;
  customer?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    deliveryMethod: 'Home Delivery' | 'Store Pickup';
  };
  items?: { product: Product; quantity: number }[];
  subtotal?: number;
  discount?: number;
  shipping?: number;
  shipping_charge?: number;
  delivery_option?: string;
  delivery_method?: string;
  total?: number;
  paymentMethod?: 'UPI' | 'Cash on Delivery' | 'Online Payment';
  is_gift?: boolean;
  gift_recipient_name?: string | null;
  gift_message?: string | null;
  gift_wrap_charge?: number;
}

export async function createDbOrder(orderData: CreateDbOrderParams, userId?: string | null): Promise<Order | null> {
  try {
    const customer_name = orderData.customer_name || orderData.customer?.name || '';
    const customer_phone = orderData.customer_phone || orderData.customer?.phone || '';
    const customer_email = orderData.customer?.email || '';
    const shipping_address = orderData.shipping_address || orderData.customer || {};
    const notes = orderData.notes ?? (
      orderData.is_gift && orderData.gift_message
        ? `Gift for ${orderData.gift_recipient_name || 'recipient'}: ${orderData.gift_message}. Payment: ${orderData.paymentMethod || 'COD'}`
        : (orderData.paymentMethod ? `Original payment method: ${orderData.paymentMethod}` : '')
    );
    const payment_method = orderData.paymentMethod === 'Cash on Delivery' ? 'cod' : 'online';

    const orderPayload = {
      items: (orderData.items || []).map(i => ({
        productId: i.product.id,
        quantity: i.quantity
      })),
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      notes,
      coupon_code: orderData.coupon_code || undefined,
      delivery_option: orderData.delivery_option,
      delivery_method: orderData.delivery_method,
      shipping_charge: orderData.shipping_charge ?? orderData.shipping,
      payment_method,
      is_gift: orderData.is_gift,
      gift_recipient_name: orderData.gift_recipient_name,
      gift_message: orderData.gift_message,
      gift_wrap_charge: orderData.gift_wrap_charge,
      user_id: userId || null
    };

    let data: any = null;
    let error: any = null;

    // Invoke Supabase create-order Edge Function
    try {
      const edgeRes = await supabase.functions.invoke('create-order', {
        body: orderPayload
      });
      data = edgeRes.data;
      error = edgeRes.error;
    } catch (invokeErr) {
      console.error('create-order edge function invocation failed:', invokeErr);
      error = invokeErr;
    }

    if (error || !data || data.error) {
      console.error('createDbOrder failed:', error || data?.error || 'Empty response');
      return null;
    }

    const resOrder = data.order || data.data || data;
    const orderIdUuid = resOrder.id || resOrder.order_id || '';
    const orderNumber = resOrder.order_number || resOrder.orderId || `SBS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const createdAtStr = resOrder.created_at || resOrder.createdAt || new Date().toISOString();

    const rawShippingAddr = (typeof resOrder.shipping_address === 'object' && resOrder.shipping_address)
      ? resOrder.shipping_address
      : (typeof shipping_address === 'object' && shipping_address ? shipping_address : {});

    const customerObj = {
      name: resOrder.customer_name || rawShippingAddr.name || customer_name,
      phone: resOrder.customer_phone || rawShippingAddr.phone || customer_phone,
      email: resOrder.customer_email || rawShippingAddr.email || customer_email,
      address: rawShippingAddr.address || (typeof shipping_address === 'string' ? shipping_address : ''),
      city: rawShippingAddr.city || 'Samastipur',
      state: rawShippingAddr.state || 'Bihar',
      pinCode: rawShippingAddr.pinCode || rawShippingAddr.pincode || '848103',
      deliveryMethod: (rawShippingAddr.deliveryMethod || 'Home Delivery') as 'Home Delivery' | 'Store Pickup'
    };

    const subtotal = Number(resOrder.subtotal ?? orderData.subtotal ?? 0);
    const discount = Number(resOrder.discount ?? orderData.discount ?? 0);
    const shippingFee = Number(resOrder.shipping_fee ?? resOrder.shipping ?? orderData.shipping ?? 0);
    const total = Number(resOrder.total_amount ?? resOrder.total ?? (subtotal - discount + shippingFee));

    const rawPaymentStatus = (resOrder.payment_status || '').toLowerCase();
    const paymentStatus: Order['paymentStatus'] =
      rawPaymentStatus === 'paid' ? 'Paid' : rawPaymentStatus === 'refunded' ? 'Refunded' : rawPaymentStatus === 'failed' ? 'Failed' : 'Pending';

    const rawOrderStatus = (resOrder.order_status || 'placed').toLowerCase();
    const orderStatusMap: Record<string, Order['orderStatus']> = {
      placed: 'Order Placed',
      confirmed: 'Confirmed',
      processing: 'Processing',
      packed: 'Packed',
      shipped: 'Shipped',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned'
    };
    const orderStatus = orderStatusMap[rawOrderStatus] || 'Order Placed';

    const rawItems = resOrder.items || resOrder.order_items || orderData.items || [];
    const items = rawItems.map((item: any) => {
      let snapshot = item.product_snapshot;
      if (typeof snapshot === 'string') {
        try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; }
      }

      const hsn_code = item.hsn_code || snapshot?.hsn_code || '5208';
      const discount_amount = item.discount_amount != null ? Number(item.discount_amount) : 0;
      const taxable_value = item.taxable_value != null ? Number(item.taxable_value) : undefined;
      const gst_rate = item.gst_rate != null ? Number(item.gst_rate) : (snapshot?.gst_rate != null ? Number(snapshot.gst_rate) : 5);
      const cgst_amount = item.cgst_amount != null ? Number(item.cgst_amount) : undefined;
      const sgst_amount = item.sgst_amount != null ? Number(item.sgst_amount) : undefined;
      const igst_amount = item.igst_amount != null ? Number(item.igst_amount) : undefined;
      const gst_amount = item.gst_amount != null ? Number(item.gst_amount) : undefined;

      if (item.product) {
        return {
          ...item,
          hsn_code,
          discount_amount,
          taxable_value,
          gst_rate,
          cgst_amount,
          sgst_amount,
          igst_amount,
          gst_amount,
        };
      }

      if (snapshot) {
        const snapshotImgs = extractImageUrls(snapshot.images);
        const singleImg = typeof snapshot.image === 'string' ? [snapshot.image.trim()] : [];
        const imgUrls = snapshotImgs.length > 0 ? snapshotImgs : singleImg.filter(u => !u.includes('NO_IMAGE_AVAILABLE'));
        if (imgUrls.length > 0) {
          snapshot.images = imgUrls;
        }
        return {
          id: item.id,
          inventory_id: item.inventory_id,
          item_status: item.item_status || 'active',
          unit_price: Number(item.unit_price || snapshot.selling_price || 0),
          total_price: Number(item.total_price || 0),
          product: snapshot,
          quantity: Number(item.quantity || 1),
          hsn_code,
          discount_amount,
          taxable_value,
          gst_rate,
          cgst_amount,
          sgst_amount,
          igst_amount,
          gst_amount,
        };
      }

      return {
        product: {
          id: item.inventory_id || item.id || '',
          name: item.product_name || item.name || '',
          price: Number(item.unit_price || item.price || 0),
          originalPrice: Number(item.unit_price || item.price || 0),
          discount: 0,
          rating: 5,
          reviewsCount: 0,
          images: extractImageUrls(item.images).length > 0
            ? extractImageUrls(item.images)
            : (item.image_url ? [item.image_url] : []),
          category: 'Banarasi Sarees',
          fabric: '',
          color: '',
          occasion: '',
          sku: item.sku || '',
          barcode: item.barcode || null,
          inStock: true,
          stock: 1,
          description: item.product_name || '',
          hsn_code,
          gst_rate,
          price_includes_gst: true
        },
        quantity: Number(item.quantity || 1),
        id: item.id,
        inventory_id: item.inventory_id,
        item_status: item.item_status || 'active',
        unit_price: Number(item.unit_price || 0),
        total_price: Number(item.total_price || 0),
        hsn_code,
        discount_amount,
        taxable_value,
        gst_rate,
        cgst_amount,
        sgst_amount,
        igst_amount,
        gst_amount,
      };
    });

    const rawHistory = resOrder.statusHistory || resOrder.order_status_history || [];
    const statusHistory: OrderStatusHistoryEntry[] = Array.isArray(rawHistory) && rawHistory.length > 0
      ? rawHistory.map((h: any) => ({
          id: h.id || `hist-${Date.now()}`,
          orderId: h.order_id || h.orderId || orderIdUuid,
          status: h.status || rawOrderStatus,
          note: h.note || null,
          createdAt: h.created_at || h.createdAt || createdAtStr
        }))
      : [
          {
            id: 'initial',
            orderId: orderIdUuid,
            status: rawOrderStatus,
            note: 'Order placed successfully by customer on storefront',
            createdAt: createdAtStr
          }
        ];

    const finalOrder: Order = {
      id: orderIdUuid,
      orderId: orderNumber,
      customer: customerObj,
      items,
      subtotal,
      discount,
      shipping: shippingFee,
      total,
      taxable_amount: resOrder.taxable_amount != null ? Number(resOrder.taxable_amount) : undefined,
      gst_amount: resOrder.gst_amount != null ? Number(resOrder.gst_amount) : undefined,
      cgst_amount: resOrder.cgst_amount != null ? Number(resOrder.cgst_amount) : undefined,
      sgst_amount: resOrder.sgst_amount != null ? Number(resOrder.sgst_amount) : undefined,
      igst_amount: resOrder.igst_amount != null ? Number(resOrder.igst_amount) : undefined,
      gst_rate: resOrder.gst_rate != null ? Number(resOrder.gst_rate) : undefined,
      place_of_supply: resOrder.place_of_supply || customerObj.state,
      invoice_number: resOrder.invoice_number,
      invoice_date: resOrder.invoice_date,
      paymentMethod: orderData.paymentMethod || (resOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'),
      paymentStatus,
      orderStatus,
      createdAt: createdAtStr,
      statusHistory,
      is_gift: resOrder.is_gift ?? orderData.is_gift ?? false,
      gift_recipient_name: resOrder.gift_recipient_name || orderData.gift_recipient_name || null,
      gift_message: resOrder.gift_message || orderData.gift_message || null,
      gift_wrap_charge: resOrder.gift_wrap_charge ?? orderData.gift_wrap_charge ?? 0
    };

    // Trigger email & push notification for order placement (COD or Online)
    if (finalOrder.customer.email) {
      triggerOrderNotificationEmail('ORDER_PLACED', finalOrder);
    }
    if (userId) {
      triggerOrderPushNotification('placed', {
        order_number: orderNumber,
        user_id: userId,
        customer_name: finalOrder.customer.name,
        total_amount: total,
        image_url: items?.[0]?.product?.images?.[0] || null,
      });
    }

    return finalOrder;
  } catch (err) {
    console.error('Exception in createDbOrder:', err);
    return null;
  }
}

/**
 * Extract plain image URL strings from a product snapshot. The snapshot's
 * `images` may contain either plain URL strings or objects shaped like
 * `{ image_url, is_primary, sort_order, storage_key }` (as written by the
 * `create-order` Edge Function).
 */
function extractImageUrls(images?: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const urls: string[] = [];
  for (const img of images) {
    if (!img) continue;
    const url = typeof img === 'string' ? img : (img as any)?.image_url;
    if (typeof url === 'string' && url.trim() && !url.includes('NO_IMAGE_AVAILABLE')) {
      urls.push(url.trim());
    }
  }
  return urls;
}

/**
 * Map raw database row joined with order_items and order_status_history to the frontend Order interface
 */
export function mapDbOrderToOrder(orderRow: any): Order {
  const rawItems = orderRow.order_items || [];
  const rawHistory = orderRow.order_status_history || [];

  const items = rawItems.map((item: any) => {
    let productSnapshot = item.product_snapshot as any;
    if (typeof productSnapshot === 'string') {
      try {
        productSnapshot = JSON.parse(productSnapshot);
      } catch {
        productSnapshot = null;
      }
    }

    const snapshotImages = extractImageUrls(productSnapshot?.images);
    const singleImage = typeof productSnapshot?.image === 'string' ? [productSnapshot.image.trim()] : [];
    const candidateImages = snapshotImages.length > 0 ? snapshotImages : singleImage.filter(u => !u.includes('NO_IMAGE_AVAILABLE'));

    const resolvedImages = candidateImages.length > 0
      ? candidateImages
      : [NO_IMAGE_PLACEHOLDER];

    const productName =
      productSnapshot?.name ||
      productSnapshot?.saree_name ||
      item.product_name ||
      'Pure Silk Banarasi Saree';

    const product: Product = {
      id: item.inventory_id || productSnapshot?.id || '',
      sku: item.sku || productSnapshot?.sku || (item.inventory_id ? `SBS-${item.inventory_id}` : 'SBS-SAREE'),
      barcode: item.barcode || null,
      name: productName,
      slug: getProductSlug(productName, item.inventory_id || 'item'),
      description: productSnapshot?.description || '',
      category: productSnapshot?.category || 'Banarasi',
      fabric: productSnapshot?.fabric || 'Silk',
      color: productSnapshot?.color || '',
      occasion: productSnapshot?.occasion || 'Festive',
      price: Number(item.unit_price || productSnapshot?.price || 0),
      salePrice: productSnapshot?.salePrice ? Number(productSnapshot.salePrice) : undefined,
      images: resolvedImages,
      stock: productSnapshot?.stock || 0,
      rating: productSnapshot?.rating || 0,
      reviewsCount: productSnapshot?.reviewsCount || 0,
      length: productSnapshot?.length || '5.5 meters',
      blousePiece: productSnapshot?.blousePiece || '0.8 meters',
      work: productSnapshot?.work || '',
      care: productSnapshot?.care || '',
      hsn_code: item.hsn_code || productSnapshot?.hsn_code || '5208',
      gst_rate: item.gst_rate != null ? Number(item.gst_rate) : (productSnapshot?.gst_rate != null ? Number(productSnapshot.gst_rate) : 5),
      price_includes_gst: true
    };

    const itemStatus = item.item_status || 'active';
    const hsn_code = item.hsn_code || productSnapshot?.hsn_code || '5208';
    const discount_amount = item.discount_amount != null ? Number(item.discount_amount) : 0;
    const taxable_value = item.taxable_value != null ? Number(item.taxable_value) : undefined;
    const gst_rate = item.gst_rate != null ? Number(item.gst_rate) : (productSnapshot?.gst_rate != null ? Number(productSnapshot.gst_rate) : 5);
    const cgst_amount = item.cgst_amount != null ? Number(item.cgst_amount) : undefined;
    const sgst_amount = item.sgst_amount != null ? Number(item.sgst_amount) : undefined;
    const igst_amount = item.igst_amount != null ? Number(item.igst_amount) : undefined;
    const gst_amount = item.gst_amount != null ? Number(item.gst_amount) : undefined;

    return {
      id: item.id,
      inventory_id: item.inventory_id,
      item_status: itemStatus,
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.total_price || 0),
      product: {
        ...product,
        item_status: itemStatus
      },
      quantity: Number(item.quantity || 1),
      hsn_code,
      discount_amount,
      taxable_value,
      gst_rate,
      cgst_amount,
      sgst_amount,
      igst_amount,
      gst_amount,
    };
  });

  const rawOrderStatus = (orderRow.order_status || 'placed').toLowerCase();
  const orderStatusMap: Record<string, Order['orderStatus']> = {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned'
  };
  let orderStatus = orderStatusMap[rawOrderStatus] || 'Order Placed';

  // If order items exist and all of them are cancelled, mark orderStatus as Cancelled
  if (items.length > 0) {
    const allCancelled = items.every((i: any) => (i.item_status || '').toLowerCase() === 'cancelled');
    if (allCancelled) {
      orderStatus = 'Cancelled';
    }
  }

  let paymentStatus: Order['paymentStatus'] = 'Pending';
  const ps = (orderRow.payment_status || '').toLowerCase();
  if (ps === 'paid') paymentStatus = 'Paid';
  else if (ps === 'failed') paymentStatus = 'Failed';
  else if (ps === 'refunded') paymentStatus = 'Refunded';

  let paymentMethod: Order['paymentMethod'] = 'Cash on Delivery';
  if (orderRow.notes && orderRow.notes.includes('Original payment method: ')) {
    const originalMethod = orderRow.notes.replace('Original payment method: ', '').trim();
    paymentMethod = originalMethod as Order['paymentMethod'];
  } else if (orderRow.payment_method === 'cod') {
    paymentMethod = 'Cash on Delivery';
  }

  const sortedHistory = [...rawHistory].sort((a: any, b: any) => 
    new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  const statusHistory: OrderStatusHistoryEntry[] = sortedHistory.length > 0
    ? sortedHistory.map((h: any) => ({
        id: h.id,
        orderId: h.order_id,
        status: h.status,
        note: h.note || null,
        createdAt: h.created_at
      }))
    : [
        {
          id: 'initial',
          orderId: orderRow.id,
          status: orderRow.order_status || 'placed',
          note: 'Order placed successfully by customer on storefront',
          createdAt: orderRow.created_at
        }
      ];

  const shippingAddr = typeof orderRow.shipping_address === 'object' && orderRow.shipping_address ? orderRow.shipping_address : {};

  return {
    id: orderRow.id,
    orderId: orderRow.order_number,
    customer: {
      name: orderRow.customer_name || shippingAddr.name || '',
      phone: orderRow.customer_phone || shippingAddr.phone || '',
      email: orderRow.customer_email || shippingAddr.email || '',
      address: shippingAddr.address || (typeof orderRow.shipping_address === 'string' ? orderRow.shipping_address : ''),
      city: shippingAddr.city || 'Samastipur',
      state: shippingAddr.state || 'Bihar',
      pinCode: shippingAddr.pinCode || shippingAddr.pincode || '848103',
      deliveryMethod: shippingAddr.deliveryMethod || 'Home Delivery'
    },
    items,
    subtotal: Number(orderRow.subtotal || 0),
    discount: Number(orderRow.discount || 0),
    shipping: Number(orderRow.shipping_fee || 0),
    total: Number(orderRow.total_amount || 0),
    taxable_amount: orderRow.taxable_amount != null ? Number(orderRow.taxable_amount) : undefined,
    gst_amount: orderRow.gst_amount != null ? Number(orderRow.gst_amount) : undefined,
    cgst_amount: orderRow.cgst_amount != null ? Number(orderRow.cgst_amount) : undefined,
    sgst_amount: orderRow.sgst_amount != null ? Number(orderRow.sgst_amount) : undefined,
    igst_amount: orderRow.igst_amount != null ? Number(orderRow.igst_amount) : undefined,
    gst_rate: orderRow.gst_rate != null ? Number(orderRow.gst_rate) : undefined,
    place_of_supply: orderRow.place_of_supply || shippingAddr.state,
    invoice_number: orderRow.invoice_number,
    invoice_date: orderRow.invoice_date,
    paymentMethod,
    paymentStatus,
    orderStatus,
    createdAt: orderRow.created_at,
    statusHistory,
    is_gift: orderRow.is_gift ?? false,
    gift_recipient_name: orderRow.gift_recipient_name || null,
    gift_message: orderRow.gift_message || null,
    gift_wrap_charge: Number(orderRow.gift_wrap_charge || 0)
  };
}

export async function fetchDbOrders(userId?: string | null, phone?: string | null): Promise<Order[]> {
  try {
    const cleanUserId = userId?.trim() || null;
    const isUuid = cleanUserId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUserId) : false;
    const isPhoneUser = cleanUserId ? /^\+?[0-9]{10,13}$/.test(cleanUserId) : false;
    const rawPhone = phone || (isPhoneUser ? cleanUserId : null);
    const digitsOnly = rawPhone ? rawPhone.replace(/\D/g, '') : '';
    // Require a minimum of 10 digits to prevent short substring broad matching
    const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : null;

    // Fail-safe: If neither a valid user ID (Google OAuth / user UUID) nor a verified 10-digit phone number is provided,
    // immediately return an empty array without executing an open query.
    if (!isUuid && !cleanPhone) {
      return [];
    }

    let query = supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*)')
      .order('created_at', { ascending: false });

    if (isUuid && cleanPhone) {
      // User is logged in via OAuth AND has verified phone:
      // Match orders explicitly owned by this user_id, OR guest orders (user_id IS NULL) with matching phone.
      // Note: In PostgREST .or() filter string, '*' is the wildcard operator (not '%').
      // Orders owned by another user are NEVER matched.
      query = query.or(`user_id.eq.${cleanUserId},and(user_id.is.null,customer_phone.ilike.*${cleanPhone}*)`);
    } else if (isUuid) {
      // User is logged in via Google OAuth but has not provided a phone number yet: match strictly by user_id
      query = query.eq('user_id', cleanUserId);
    } else if (cleanPhone) {
      // Phone-only customer lookup: match strictly unassigned guest orders (user_id IS NULL)
      query = query.is('user_id', null).ilike('customer_phone', `%${cleanPhone}%`);
    }

    const { data: ordersData, error } = await query;
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return (ordersData || []).map(mapDbOrderToOrder);
  } catch (err) {
    console.error('Exception in fetchDbOrders:', err);
    return [];
  }
}

export async function fetchDbOrderWithItems(orderIdOrNumber: string): Promise<Order | null> {
  if (!orderIdOrNumber || !orderIdOrNumber.trim()) return null;
  const target = orderIdOrNumber.trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
    let query = supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*)');

    if (isUuid) {
      query = query.eq('id', target);
    } else {
      query = query.eq('order_number', target);
    }

    const { data: orderRow, error } = await query.maybeSingle();
    if (error || !orderRow) return null;

    return mapDbOrderToOrder(orderRow);
  } catch (err) {
    console.error('Exception in fetchDbOrderWithItems:', err);
    return null;
  }
}

export type DeliveryOptionType = 'express' | 'same_day' | 'standard';

export interface CalculatedDeliveryOption {
  id: DeliveryOptionType;
  title: string;
  charge: number;
  eta: string;
  badge?: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
  image?: string;
}

export const DELIVERY_OPTION_IMAGES: Record<DeliveryOptionType, string> = {
  express: '/expressdel.webp',
  same_day: '/sameday.webp',
  standard: '/standarddel.webp',
};

export interface DeliverySettings {
  id: string;
  serviceable_district: string;
  serviceable_state: string;
  express_max_km: number;
  same_day_max_km: number;
  standard_max_km: number;
  express_charge: number;
  same_day_charge: number;
  standard_charge: number;
  express_min_minutes: number;
  express_max_minutes: number;
  same_day_cutoff_time: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  shop_latitude?: number | null;
  shop_longitude?: number | null;
  express_packing_buffer_minutes?: number;
  express_delivery_buffer_minutes?: number;
  is_express_20min_enabled?: boolean;
  default_pincode?: string | null;
}

export interface DeliveryCheckResult {
  success: boolean;
  serviceable?: boolean;
  isOutsideServiceArea?: boolean;
  error?: string;
  is20MinDelivery?: boolean;
  isExpress?: boolean;
  eligible?: boolean;
  customerEtaMinutes?: number;
  distance_km?: number;
  distanceKm?: number;
  estimated_drive_minutes?: number;
  delivery_type?: 'express' | 'same_day' | 'standard' | null;
  delivery_charge?: number;
  message?: string;
  source?: string;
  pincode?: string;
  isStoreClosed?: boolean;
  isAfterMidnight?: boolean;
  isAfter8PM?: boolean;
  storeClosedMessage?: string;
  eta?: {
    minutes?: number;
    formattedDelivery?: string;
    packingBufferMinutes?: number;
    deliveryBufferMinutes?: number;
  };
  options?: CalculatedDeliveryOption[];
  deliverySettings?: DeliverySettings;
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNumber);
    let query = supabase
      .from('orders')
      .select('*, order_items(*)');
    if (isUuid) {
      query = query.eq('id', orderNumber);
    } else {
      query = query.eq('order_number', orderNumber);
    }

    const { data: orderRow, error: fetchError } = await query.maybeSingle();

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

export async function cancelDbOrder(orderIdentifier: string): Promise<boolean> {
  try {
    let order_id = orderIdentifier;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdentifier);
    if (!isUuid) {
      const { data: row } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderIdentifier)
        .maybeSingle();
      if (row?.id) {
        order_id = row.id;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Try cancel-order Edge Function (cancels entire order with service role)
    const { data, error } = await supabase.functions.invoke("cancel-order", {
      body: { order_id },
      headers
    });

    if (!error && data?.success) {
      return true;
    }

    if (error && (error as any)?.context?.status === 403) {
      console.warn("Unauthorized to cancel order:", error);
      return false;
    }

    // Direct DB fallback (for staff/admin operations if edge function is unavailable)
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    if (updateErr) {
      console.error('Direct DB order cancellation failed:', updateErr);
      return false;
    }

    await supabase
      .from('order_items')
      .update({
        item_status: 'cancelled'
      })
      .eq('order_id', order_id);

    return true;
  } catch (err) {
    console.error('Exception in cancelDbOrder:', err);
    return false;
  }
}

export async function cancelDbOrderItem(orderNumber: string, productId: string): Promise<{ success: boolean; cancelledEntireOrder: boolean; newSubtotal?: number; newTotal?: number }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNumber);
    let query = supabase
      .from('orders')
      .select('id, subtotal, total_amount, order_status');
    if (isUuid) {
      query = query.eq('id', orderNumber);
    } else {
      query = query.eq('order_number', orderNumber);
    }

    const { data: orderRow, error: orderFetchError } = await query.maybeSingle();

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

    // Resolve order_item_id UUID
    let orderItemUuid = productId;
    const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!isItemUuid) {
      const { data: itemRows } = await supabase
        .from('order_items')
        .select('id, inventory_id, sku')
        .eq('order_id', orderRow.id);
      const match = itemRows?.find(r => r.id === productId || r.inventory_id === productId || r.sku === productId);
      if (match?.id) {
        orderItemUuid = match.id;
      }
    }

    // 1. First attempt through cancel-order-user Edge Function (Service role bypasses RLS)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data: fnData, error: fnError } = await supabase.functions.invoke("cancel-order-user", {
        body: {
          order_id: orderRow.id,
          order_item_id: orderItemUuid
        },
        headers
      });

      if (!fnError && fnData?.success) {
        return {
          success: true,
          cancelledEntireOrder: !!fnData.cancelledEntireOrder,
          newSubtotal: fnData.newSubtotal,
          newTotal: fnData.newTotal
        };
      }

      if (fnError && (fnError as any)?.context?.status === 403) {
        console.warn("Unauthorized to cancel order item:", fnError);
        return { success: false, cancelledEntireOrder: false };
      }
    } catch (edgeErr) {
      console.warn("Edge function cancel-order-user item cancellation attempt failed, falling back to direct DB:", edgeErr);
    }

    // 2. Direct DB fallback
    const { data: items, error: itemsFetchError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderRow.id);

    if (itemsFetchError || !items) {
      console.error('Error fetching order items for cancellation:', itemsFetchError);
      return { success: false, cancelledEntireOrder: false };
    }

    const targetItem = items.find(item => {
      if (item.inventory_id === productId || item.id === productId || item.sku === productId) return true;
      if (typeof item.product_snapshot === 'object' && item.product_snapshot?.id === productId) return true;
      if (typeof item.product_snapshot === 'string' && item.product_snapshot.includes(productId)) return true;
      return false;
    });

    if (!targetItem) {
      console.error(`Item with product ID ${productId} not found in order ${orderNumber}`);
      return { success: false, cancelledEntireOrder: false };
    }

    // Check if item is already cancelled
    if (targetItem.item_status === 'cancelled') {
      return { success: true, cancelledEntireOrder: false };
    }

    // Update item_status to cancelled in order_items table (NEVER delete)
    const { error: updateItemError } = await supabase
      .from('order_items')
      .update({ item_status: 'cancelled' })
      .eq('id', targetItem.id);

    if (updateItemError) {
      console.error('Error updating order item status:', updateItemError);
      return { success: false, cancelledEntireOrder: false };
    }

    // Check how many active items remain in the order
    const remainingActiveItems = items.filter(i => i.id !== targetItem.id && i.item_status !== 'cancelled');
    const isEntireOrderCancelled = remainingActiveItems.length === 0;

    const itemTotalPrice = Number(targetItem.total_price || (Number(targetItem.unit_price || 0) * Number(targetItem.quantity || 1)));
    const productName = targetItem.product_name;

    const newSubtotal = Math.max(0, Number(orderRow.subtotal || 0) - itemTotalPrice);
    const newTotal = Math.max(0, Number(orderRow.total_amount || 0) - itemTotalPrice);

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newTotal,
        order_status: isEntireOrderCancelled ? 'cancelled' : orderRow.order_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderRow.id);

    if (updateError) {
      console.error('Error updating order totals:', updateError);
    }

    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderRow.id,
        status: isEntireOrderCancelled ? 'cancelled' : 'item_cancelled',
        note: isEntireOrderCancelled
          ? `Cancelled "${productName}" (all items cancelled; order cancelled)`
          : `Cancelled "${productName}" (Qty ${targetItem.quantity || 1}) from order`
      });

    if (historyError) {
      console.error('Error inserting item cancellation history:', historyError);
    }

    return {
      success: true,
      cancelledEntireOrder: isEntireOrderCancelled,
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

    const [{ data: inventoryData, error: invError }, ratingMap] = await Promise.all([
      supabase
        .from('storefront_products')
        .select(PUBLIC_INVENTORY_SELECT)
        .in('id', inventoryIds)
        .eq('status', 'active'),
      fetchProductRatingsMap()
    ]);

    if (invError || !inventoryData) {
      console.error('Error fetching inventory for campaign:', invError);
      return [];
    }

    const dbItems = inventoryData as DbInventory[];
    return dbItems.map(item => mapDbProductToProduct(item, ratingMap));
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
    const [{ data, error }, ratingMap] = await Promise.all([
      supabase
        .from('storefront_products')
        .select(PUBLIC_INVENTORY_SELECT)
        .eq('status', 'active')
        .ilike('category', `%${currentProduct.category}%`)
        .neq('id', currentProduct.id)
        .limit(60),
      fetchProductRatingsMap()
    ]);

    if (error || !data) {
      console.error('Error fetching similar products:', error);
      return [];
    }

    const pool = (data as DbInventory[]).map(item => mapDbProductToProduct(item, ratingMap));

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
    const [{ data, error }, ratingMap] = await Promise.all([
      supabase
        .from('storefront_products')
        .select(PUBLIC_INVENTORY_SELECT)
        .in('id', validIds)
        .eq('status', 'active'),
      fetchProductRatingsMap()
    ]);

    if (error) {
      console.error('Error in fetchProductsByIds:', error);
      return [];
    }

    const dbItems = (data || []) as DbInventory[];
    const productMap = new Map(dbItems.map((item) => [item.id, mapDbProductToProduct(item, ratingMap)]));

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
    const orderItems = orderRow.order_items || [];
    const inventoryIds = Array.from(
      new Set(orderItems.map((i: any) => i.inventory_id).filter(Boolean))
    );

    let storefrontProductMap: Record<string, any> = {};
    let inventoryImageMap: Record<string, string[]> = {};

    if (inventoryIds.length > 0) {
      try {
        const [sfRes, imgRes] = await Promise.all([
          supabase
            .from('storefront_products')
            .select('id, saree_name, category, fabric, color, selling_price, mrp, sku, description')
            .in('id', inventoryIds),
          supabase
            .from('inventory_images')
            .select('inventory_id, image_url, is_primary, sort_order')
            .in('inventory_id', inventoryIds)
        ]);

        if (sfRes.data) {
          sfRes.data.forEach((p: any) => { storefrontProductMap[p.id] = p; });
        }
        if (imgRes.data) {
          const sortedImgs = [...imgRes.data].sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
          });
          sortedImgs.forEach((img: any) => {
            if (!inventoryImageMap[img.inventory_id]) inventoryImageMap[img.inventory_id] = [];
            inventoryImageMap[img.inventory_id].push(img.image_url);
          });
        }
      } catch (e) {
        console.warn('Could not load storefront products for review order:', e);
      }
    }

    const items: OrderReviewItem[] = orderItems.map((item: any) => {
      let snap = item.product_snapshot || {};
      if (typeof snap === 'string') {
        try { snap = JSON.parse(snap); } catch (e) { snap = {}; }
      }
      const sfProd = item.inventory_id ? storefrontProductMap[item.inventory_id] : null;
      const invImgs = item.inventory_id && inventoryImageMap[item.inventory_id]?.length
        ? inventoryImageMap[item.inventory_id]
        : [];
      const prodId = item.inventory_id || snap.id || sfProd?.id || '';

      const existingReviewObj = reviewsList.find((r: any) => r.product_id === prodId || (snap.id && r.product_id === snap.id));

      const snapImageUrls = extractImageUrls(snap.images);
      const singleImage = typeof snap.image === 'string' ? [snap.image.trim()] : [];
      const resolvedImage = (snapImageUrls.length > 0
        ? snapImageUrls[0]
        : singleImage.find(u => !u.includes('NO_IMAGE_AVAILABLE'))
      ) || invImgs[0] || NO_IMAGE_PLACEHOLDER;

      return {
        productId: prodId,
        sku: item.sku || snap.sku || sfProd?.sku || (item.inventory_id ? `SBS-${item.inventory_id}` : 'SBS-SAREE'),
        name: snap.name || snap.saree_name || sfProd?.saree_name || item.product_name || 'Banarasi Saree',
        fabric: snap.fabric || sfProd?.fabric || 'Silk',
        color: snap.color || sfProd?.color || '',
        price: Number(item.unit_price || snap.price || sfProd?.selling_price || 0),
        image: resolvedImage,
        quantity: Number(item.quantity || 1),
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

/**
 * Fetch detailed order items for an order by UUID or order number
 */
export async function fetchOrderItems(orderId: string) {
  if (!orderId || !orderId.trim()) return [];
  const target = orderId.trim();

  try {
    let resolvedOrderId: string | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
    if (isUuid) {
      resolvedOrderId = target;
    } else {
      const { data: orderRow } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', target)
        .maybeSingle();
      if (orderRow?.id) {
        resolvedOrderId = orderRow.id;
      }
    }

    if (!resolvedOrderId) {
      return [];
    }

    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id,
        order_id,
        inventory_id,
        product_name,
        sku,
        barcode,
        quantity,
        unit_price,
        total_price,
        product_snapshot
      `)
      .eq("order_id", resolvedOrderId);

    if (error) {
      console.error('Error fetching order items:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching order items:', err);
    return [];
  }
}

/**
 * In-memory cache for delivery settings default pincode
 */
let cachedDeliverySettingsPincode: string | null = null;

function extractPincodeFromSettingsRow(row: any): string | null {
  if (!row || typeof row !== 'object') return null;

  // 1. Prioritized candidate column checks
  const prioritizedCandidate =
    row.default_pincode ??
    row.pincode ??
    row.shop_pincode ??
    row.default_pin ??
    row.pin_code ??
    row.postal_code ??
    row.serviceable_pincode;

  if (prioritizedCandidate && /^\d{6}$/.test(String(prioritizedCandidate).trim())) {
    const pin = String(prioritizedCandidate).trim();
    cachedDeliverySettingsPincode = pin;
    return pin;
  }

  // 2. Dynamic inspection across all properties for a 6-digit Indian PIN
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === 'string' && /^\d{6}$/.test(val.trim())) {
      const pin = val.trim();
      cachedDeliverySettingsPincode = pin;
      return pin;
    }
    if (typeof val === 'number' && /^\d{6}$/.test(String(val))) {
      const pin = String(val);
      cachedDeliverySettingsPincode = pin;
      return pin;
    }
  }

  return null;
}

/**
 * Fetches the default delivery pincode from the delivery_settings table.
 * Inspects existing columns/structure (e.g. default_pincode, pincode, shop_pincode, default_pin, etc.)
 * so no hardcoding is used anywhere in the frontend.
 */
export async function fetchDefaultDeliveryPincode(): Promise<string | null> {
  if (cachedDeliverySettingsPincode) {
    return cachedDeliverySettingsPincode;
  }

  try {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      // Fallback query without id='default' constraint
      const { data: anyData, error: anyError } = await supabase
        .from('delivery_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (anyError || !anyData) {
        console.error('Error fetching delivery_settings default pincode:', error || anyError);
        return null;
      }
      return extractPincodeFromSettingsRow(anyData);
    }

    return extractPincodeFromSettingsRow(data);
  } catch (err) {
    console.error('Exception fetching default delivery pincode:', err);
    return null;
  }
}

/**
 * Updates profiles.default_pincode for the specified user.
 */
export async function updateProfileDefaultPincode(userId: string, pincode: string | null): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ default_pincode: pincode ? pincode.trim() : null })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile default pincode:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Exception updating profile default pincode:', err);
    return { success: false, error: err };
  }
}

let cachedDeliverySettings: DeliverySettings | null = null;

/**
 * Fetches the active delivery settings row from public.delivery_settings.
 * Cached in memory for speed across page views and component renders.
 */
export async function fetchDeliverySettings(): Promise<DeliverySettings> {
  if (cachedDeliverySettings) {
    return cachedDeliverySettings;
  }

  const defaultSettings: DeliverySettings = {
    id: 'default',
    serviceable_district: 'Samastipur',
    serviceable_state: 'Bihar',
    express_max_km: 5,
    same_day_max_km: 10,
    standard_max_km: 20,
    express_charge: 29,
    same_day_charge: 49,
    standard_charge: 69,
    express_min_minutes: 60,
    express_max_minutes: 120,
    same_day_cutoff_time: '17:00:00',
    is_active: true,
    shop_latitude: 25.855802,
    shop_longitude: 85.779337,
    express_packing_buffer_minutes: 3,
    express_delivery_buffer_minutes: 3,
    is_express_20min_enabled: true,
    default_pincode: '848101'
  };

  try {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      // Fallback if no default id row
      const { data: anyData } = await supabase
        .from('delivery_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!anyData) {
        cachedDeliverySettings = defaultSettings;
        return defaultSettings;
      }

      cachedDeliverySettings = {
        id: anyData.id || 'default',
        serviceable_district: anyData.serviceable_district || 'Samastipur',
        serviceable_state: anyData.serviceable_state || 'Bihar',
        express_max_km: Number(anyData.express_max_km ?? 5),
        same_day_max_km: Number(anyData.same_day_max_km ?? 10),
        standard_max_km: Number(anyData.standard_max_km ?? 20),
        express_charge: Number(anyData.express_charge ?? 29),
        same_day_charge: Number(anyData.same_day_charge ?? 49),
        standard_charge: Number(anyData.standard_charge ?? 69),
        express_min_minutes: Number(anyData.express_min_minutes ?? 60),
        express_max_minutes: Number(anyData.express_max_minutes ?? 120),
        same_day_cutoff_time: anyData.same_day_cutoff_time || '17:00:00',
        is_active: anyData.is_active !== false,
        shop_latitude: anyData.shop_latitude ? Number(anyData.shop_latitude) : 25.855802,
        shop_longitude: anyData.shop_longitude ? Number(anyData.shop_longitude) : 85.779337,
        express_packing_buffer_minutes: Number(anyData.express_packing_buffer_minutes ?? 3),
        express_delivery_buffer_minutes: Number(anyData.express_delivery_buffer_minutes ?? 3),
        is_express_20min_enabled: anyData.is_express_20min_enabled !== false,
        default_pincode: anyData.default_pincode || '848101'
      };
      return cachedDeliverySettings;
    }

    cachedDeliverySettings = {
      id: data.id || 'default',
      serviceable_district: data.serviceable_district || 'Samastipur',
      serviceable_state: data.serviceable_state || 'Bihar',
      express_max_km: Number(data.express_max_km ?? 5),
      same_day_max_km: Number(data.same_day_max_km ?? 10),
      standard_max_km: Number(data.standard_max_km ?? 20),
      express_charge: Number(data.express_charge ?? 29),
      same_day_charge: Number(data.same_day_charge ?? 49),
      standard_charge: Number(data.standard_charge ?? 69),
      express_min_minutes: Number(data.express_min_minutes ?? 60),
      express_max_minutes: Number(data.express_max_minutes ?? 120),
      same_day_cutoff_time: data.same_day_cutoff_time || '17:00:00',
      is_active: data.is_active !== false,
      shop_latitude: data.shop_latitude ? Number(data.shop_latitude) : 25.855802,
      shop_longitude: data.shop_longitude ? Number(data.shop_longitude) : 85.779337,
      express_packing_buffer_minutes: Number(data.express_packing_buffer_minutes ?? 3),
      express_delivery_buffer_minutes: Number(data.express_delivery_buffer_minutes ?? 3),
      is_express_20min_enabled: data.is_express_20min_enabled !== false,
      default_pincode: data.default_pincode || '848101'
    };

    return cachedDeliverySettings;
  } catch (err) {
    console.error('Exception fetching delivery_settings:', err);
    return defaultSettings;
  }
}

/**
 * Calculates delivery options, eligibility, charges, and ETAs from delivery_settings
 * based on customer distance (in km), pincode, and current Indian Standard Time.
 * 
 * Condition Rules:
 * 1. If pincode is within local service area (distance <= same_day_max_km or local Samastipur pincode):
 *    All 3 options (Express, Same Day, Standard) are AVAILABLE so the customer can choose.
 * 2. If pincode is for Standard Delivery only (distance > same_day_max_km or non-local pincode across India):
 *    Express and Same Day are DISABLED (available: false), and ONLY Standard Delivery is available.
 */
export function calculateDeliveryOptions(
  distanceKm: number | null | undefined,
  settings: DeliverySettings,
  customerEtaMinutes?: number,
  pincode?: string
): CalculatedDeliveryOption[] {
  const dist = distanceKm != null ? distanceKm : 0;
  const hasDistance = distanceKm != null && distanceKm > 0;
  const cleanPin = (pincode || '').replace(/\D/g, '').slice(0, 6);

  // Check if pincode or distance is within local same-day / express delivery zone:
  // - If road / GPS distance is known (> 0): within same_day_max_km (e.g. 10 km)
  // - If distance is not yet known: local Samastipur district pincodes (starts with 8481, or default_pincode, or 848101)
  // - If no pincode or distance is given: defaults to local showroom area
  let isLocalDeliveryEligible = false;
  if (hasDistance) {
    isLocalDeliveryEligible = dist <= settings.same_day_max_km;
  } else if (cleanPin) {
    isLocalDeliveryEligible = cleanPin.startsWith('8481') || cleanPin === (settings.default_pincode || '848101');
  } else {
    isLocalDeliveryEligible = true;
  }

  // Operating window in IST
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = istFormatter.formatToParts(new Date());
  const istHour = parseInt(parts.find(p => p.type === 'hour')?.value || '12', 10);
  const istMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const isShopOpen = istHour >= 9 && istHour < 20;

  // Cutoff check for same day: e.g. 17:00 (5 PM)
  let cutoffHour = 17;
  let cutoffMinute = 0;
  if (settings.same_day_cutoff_time) {
    const timeParts = settings.same_day_cutoff_time.split(':');
    if (timeParts.length >= 2) {
      cutoffHour = parseInt(timeParts[0], 10) || 17;
      cutoffMinute = parseInt(timeParts[1], 10) || 0;
    }
  }
  const isBeforeSameDayCutoff = (istHour < cutoffHour) || (istHour === cutoffHour && istMinute <= cutoffMinute);

  // 1. Express Option: Available if local delivery eligible and settings active
  const expressEligible = isLocalDeliveryEligible && settings.is_active;
  let expressTitle = 'Express Delivery';
  let expressEta = `${settings.express_min_minutes}–${settings.express_max_minutes} mins`;
  let expressBadge = '⚡ Express';

  if (settings.is_express_20min_enabled) {
    if (isShopOpen) {
      const etaMins = customerEtaMinutes || 20;
      expressTitle = '20-Min Express Delivery';
      expressEta = `~${etaMins} mins`;
      expressBadge = '⚡ 20-Min Express';
    } else if (istHour < 9) {
      expressTitle = 'Morning Express Delivery';
      expressEta = 'Today by 10:00 AM';
      expressBadge = '⚡ Today Morning';
    } else {
      expressTitle = 'Morning Express Delivery';
      expressEta = 'Tomorrow by 10:00 AM';
      expressBadge = '⚡ Tomorrow Morning';
    }
  }

  // 2. Same Day Option: Available if local delivery eligible and settings active
  const sameDayEligible = isLocalDeliveryEligible && settings.is_active;
  const cutoffDisplay = `${cutoffHour > 12 ? cutoffHour - 12 : cutoffHour}:${cutoffMinute < 10 ? '0' + cutoffMinute : cutoffMinute} ${cutoffHour >= 12 ? 'PM' : 'AM'}`;
  const sameDayEta = isBeforeSameDayCutoff ? 'Today by 9:00 PM' : 'Tomorrow by 9:00 PM';
  const sameDayBadge = isBeforeSameDayCutoff ? 'Today Evening' : 'Tomorrow';

  // 3. Standard Option: Always available across India when active
  const standardEligible = settings.is_active;
  const standardEta = '3–5 Business Days';

  return [
    {
      id: 'express',
      title: expressTitle,
      charge: settings.express_charge,
      eta: expressEta,
      badge: expressBadge,
      description: `Hand delivery directly from our showroom (within ${settings.express_max_km} km)`,
      available: expressEligible,
      unavailableReason: !isLocalDeliveryEligible ? 'Standard delivery only for this pincode' : undefined,
      image: '/expressdel.webp'
    },
    {
      id: 'same_day',
      title: 'Same Day Delivery',
      charge: settings.same_day_charge,
      eta: sameDayEta,
      badge: sameDayBadge,
      description: isBeforeSameDayCutoff
        ? `Order before ${cutoffDisplay} for delivery today`
        : `Orders placed after ${cutoffDisplay} arrive tomorrow`,
      available: sameDayEligible,
      unavailableReason: !isLocalDeliveryEligible ? 'Standard delivery only for this pincode' : undefined,
      image: '/sameday.webp'
    },
    {
      id: 'standard',
      title: 'Standard Delivery',
      charge: settings.standard_charge,
      eta: standardEta,
      badge: 'Standard',
      description: 'Tracked express courier delivery across India',
      available: standardEligible,
      image: '/standarddel.webp'
    }
  ];
}

