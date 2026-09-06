const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzqlsawxvvyvsstyzzff.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase queries with anon key:');

  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .limit(5);

  console.log('Orders error:', ordersErr);
  console.log('Orders count:', orders?.length);
  if (orders && orders.length > 0) {
    console.log('Sample order:', {
      id: orders[0].id,
      order_number: orders[0].order_number,
      user_id: orders[0].user_id,
      customer_name: orders[0].customer_name,
    });

    const orderId = orders[0].id;
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    console.log('Order items for order', orderId, ':');
    console.log('Items error:', itemsErr);
    console.log('Items:', JSON.stringify(items, null, 2));
  } else {
    // try to query order_items directly
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .limit(3);
    console.log('Direct order_items error:', itemsErr);
    console.log('Direct order_items:', items);
  }

  // Also check storefront_products & inventory_images
  const { data: sfProds, error: sfErr } = await supabase
    .from('storefront_products')
    .select('id, saree_name')
    .limit(3);
  console.log('storefront_products error:', sfErr);
  console.log('storefront_products count:', sfProds?.length);

  const { data: invImgs, error: imgErr } = await supabase
    .from('inventory_images')
    .select('inventory_id, image_url')
    .limit(3);
  console.log('inventory_images error:', imgErr);
  console.log('inventory_images count:', invImgs?.length);
}

test();
