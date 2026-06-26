const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT'
);

async function run() {
  console.log("Checking trademarks...");
  const { data, error } = await supabase.from('trademarks').select('id').limit(1);
  if (error) {
    console.error("Error fetching trademarks:", error);
  } else {
    console.log("Trademarks table exists. Trying to insert...");
    const payload = {
      type: "word",
      name: "test script",
      status: "Pending"
    };
    const { data: insData, error: insErr } = await supabase.from('trademarks').insert(payload).select().single();
    if (insErr) {
      console.error("Insert error:", insErr);
    } else {
      console.log("Insert success:", insData.id);
    }
  }
}

run();
