const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies'); // may not exist
  console.log('rpc get_policies:', { data, error });
}

checkPolicies();
