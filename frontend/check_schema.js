const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT' // We know this from test_supabase.js
);

async function check() {
  const { data, error } = await supabase.rpc('get_schema');
  console.log("Error:", error);
  
  // Alternative way to fetch column defaults
  const { data: cols, error: err2 } = await supabase.from('users').select('*').limit(1);
  console.log("Sample Data:", cols);
}
check();
