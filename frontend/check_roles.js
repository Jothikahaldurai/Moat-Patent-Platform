const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT' // We know this from test_supabase.js
);

async function check() {
  const { data: roles, error } = await supabase.from("roles").select("*");
  console.log("Result:", roles, error);
}
check();
