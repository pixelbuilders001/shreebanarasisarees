const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  // Test an empty select to see error or column names
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);

  console.log('order_items data:', data);
  console.log('order_items error:', error);

  // Check orders table too
  const { data: oData, error: oError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
  console.log('orders data:', oData);
  console.log('orders error:', oError);

  // Try selecting non-existent column to see how postgres errors
  const { error: testErr } = await supabase
    .from('order_items')
    .select('product_snapshot')
    .limit(1);
  console.log('select product_snapshot error:', testErr);
}

checkSchema();
