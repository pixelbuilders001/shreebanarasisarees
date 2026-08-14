const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vzqlsawxvvyvsstyzzff.supabase.co';
const supabaseAnonKey = 'sb_publishable_6chwvgIpbfCpeEZrkS9VYg_IO__zSpY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profile:', error);
  } else {
    console.log('Profile columns:', Object.keys(data[0] || {}));
  }
}

main();
