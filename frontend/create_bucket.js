const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT'
);

async function createBucket() {
  console.log("Checking if 'trademarks' bucket exists...");
  const { data: buckets, error: fetchError } = await supabase.storage.listBuckets();
  
  if (fetchError) {
    console.error("Error fetching buckets:", fetchError);
    return;
  }
  
  const exists = buckets.some(b => b.name === 'trademarks');
  if (exists) {
    console.log("Bucket 'trademarks' already exists!");
    return;
  }
  
  console.log("Creating 'trademarks' bucket...");
  const { data, error } = await supabase.storage.createBucket('trademarks', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
  });
  
  if (error) {
    console.error("Error creating bucket:", error);
  } else {
    console.log("Successfully created 'trademarks' bucket!");
  }
}

createBucket();
