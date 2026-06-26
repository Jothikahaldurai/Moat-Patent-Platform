const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT'
);

async function run() {
  const { data, error } = await supabase.from('trademarks').select('*').limit(1);
  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log("Columns:");
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log("No data found.");
    }
  }
}

run();
