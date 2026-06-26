const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT' // We know this from test_supabase.js
);

async function check() {
  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({
      name: "Test Romila",
      email: "romilatest@moat.ai",
      password_hash: "hash",
      role_id: "2a7be1b1-1ce4-4240-920f-d395bbe25757", // Patent Analyst
      department: "Legal",
      status: "Active",
      is_active: true,
      created_by: '00000000-0000-0000-0000-000000000002' // Admin user
    })
    .select("id")
    .single();

  console.log("Insert Result:", newUser, insertError);
}
check();
