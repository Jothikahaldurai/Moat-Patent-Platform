const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT' // We know this from test_supabase.js
);

async function check() {
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_plain VARCHAR(255);' 
  });
  console.log("Error:", error);
}
check();
