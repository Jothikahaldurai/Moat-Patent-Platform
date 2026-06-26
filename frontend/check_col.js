const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT' // We know this from test_supabase.js
);

async function check() {
  const { data, error } = await supabase.from('users').select('password_plain').limit(1);
  console.log("Result:", data, error);
}
check();
