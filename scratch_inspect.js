const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectData() {
  const { data: sfProds } = await supabase
    .from('storefront_products')
    .select('id, saree_name, sku')
    .limit(3);
  console.log('Storefront products sample:', sfProds);

  const { data: invImgs } = await supabase
    .from('inventory_images')
    .select('*')
    .limit(3);
  console.log('Inventory images sample:', invImgs);
}

inspectData();
