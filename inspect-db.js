const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vzqlsawxvvyvsstyzzff.supabase.co';
const supabaseAnonKey = 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing cart_items insert with text identifier...');
  
  // Try inserting a test cart item
  const testPhone = 'google_oauth_test_id';
  const testProductId = 'S44485';
  
  const { data: insertData, error: insertError } = await supabase
    .from('cart_items')
    .insert({
      user_phone: testPhone,
      product_id: testProductId,
      quantity: 1
    })
    .select();
    
  console.log('Insert result:', { data: insertData, error: insertError });
  
  if (!insertError) {
    // Clean up
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_phone', testPhone);
    console.log('Cleanup result:', { error: deleteError });
  }
}

main();
