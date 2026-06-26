const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT'
);

async function main() {
  const { data, error } = await supabase.from('inventions').select('*').limit(1);
  if (error) {
    console.error('Error fetching inventions:', error);
  } else {
    console.log('Inventions table exists and works. Data:', data);
  }

  // Also let's check policies on the table by trying to insert anonymously
  const anonSupabase = createClient(
    'https://gaanedxlwtjftqxhncfw.supabase.co',
    'sb_publishable_W_zGmfwVh-mbQ5DJHvYNBg_4IY01BEB'
  );
  // We need to authenticate. Since we don't have a user, we can't fully simulate.
}

main();
