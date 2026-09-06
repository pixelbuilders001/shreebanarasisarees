const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testJoin() {
  const res1 = await supabase.from('orders').select('*, order_items(*)').limit(1);
  console.log('Join res:', res1.error ? res1.error : 'Success (items count: ' + (res1.data?.[0]?.order_items?.length ?? 'none') + ')');

  const res2 = await supabase.from('order_items').select('*').limit(1);
  console.log('Direct order_items res:', res2.error ? res2.error : 'Success (rows: ' + (res2.data?.length ?? 0) + ')');
}

testJoin();
