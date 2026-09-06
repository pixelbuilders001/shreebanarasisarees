const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSelect() {
  const res = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', ['00000000-0000-0000-0000-000000000000']);

  console.log('Select order_items with dummy UUID result:');
  console.log('error:', res.error);
  console.log('data:', res.data);
  console.log('status:', res.status);
}

testSelect();
