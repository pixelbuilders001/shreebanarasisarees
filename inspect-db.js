const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vzqlsawxvvyvsstyzzff.supabase.co';
const supabaseAnonKey = 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Invoking verify-review with fetch directly to inspect response body...');
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/verify-review`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_id: 'test' })
    });
    console.log('Direct fetch verify-review status:', res.status);
    const bodyText = await res.text();
    console.log('Direct fetch verify-review body:', bodyText);
  } catch (err) {
    console.error('Direct fetch verify-review failed:', err);
  }

  console.log('\nInvoking submit-review with fetch directly to inspect response body...');
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/submit-review`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_id: 'test' })
    });
    console.log('Direct fetch submit-review status:', res.status);
    const bodyText = await res.text();
    console.log('Direct fetch submit-review body:', bodyText);
  } catch (err) {
    console.error('Direct fetch submit-review failed:', err);
  }
}

main();
