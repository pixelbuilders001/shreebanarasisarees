import { createClient } from '@supabase/supabase-js';
import { Product, PRODUCTS } from './products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY';

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
    care: "Dry Clean Only"
  };
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

export interface DbCartItem {
  id: string;
  user_phone: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export async function fetchDbCart(phone: string): Promise<{ product_id: string; quantity: number }[]> {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_phone', phone);
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

export async function upsertDbCartItem(phone: string, productId: string, quantity: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_phone: phone, product_id: productId, quantity },
        { onConflict: 'user_phone,product_id' }
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

export async function deleteDbCartItem(phone: string, productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_phone', phone)
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

export async function clearDbCart(phone: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_phone', phone);
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
  orderStatus: 'Order Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
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
}): Promise<Order | null> {
  try {
    const orderNumber = `SBS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingFee = orderData.shipping;
    const paymentMethodMap = 'cod'; // DB constraint check enforces cod

    // 1. Insert order metadata into orders table
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: orderData.customer.name,
        customer_phone: orderData.customer.phone,
        customer_email: orderData.customer.email || null,
        shipping_address: orderData.customer,
        subtotal: orderData.subtotal,
        shipping_fee: shippingFee,
        discount: orderData.discount,
        total_amount: orderData.total,
        payment_method: paymentMethodMap,
        payment_status: 'pending',
        order_status: 'placed',
        notes: `Original payment method: ${orderData.paymentMethod}`
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
      const unitPrice = item.product.salePrice ?? item.product.price;
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
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shipping: shippingFee,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Order Placed',
      createdAt: createdAtStr
    };

    return finalOrder;
  } catch (err) {
    console.error('Exception in createDbOrder:', err);
    return null;
  }
}

export async function fetchDbOrders(phone: string): Promise<Order[]> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
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
      else if (orderRow.order_status === 'cancelled') orderStatus = 'Delivered';

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
        createdAt: orderRow.created_at
      });
    }

    return resolvedOrders;
  } catch (err) {
    console.error('Exception in fetchDbOrders:', err);
    return [];
  }
}
