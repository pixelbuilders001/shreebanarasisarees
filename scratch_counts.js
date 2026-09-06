const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCounts() {
  const oCount = await supabase.from('orders').select('*', { count: 'exact', head: true });
  console.log('orders count:', oCount);

  const iCount = await supabase.from('order_items').select('*', { count: 'exact', head: true });
  console.log('order_items count:', iCount);

  const sfCount = await supabase.from('storefront_products').select('*', { count: 'exact', head: true });
  console.log('storefront_products count:', sfCount);
}

checkCounts();
