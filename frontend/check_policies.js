const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgres://postgres.gaanedxlwtjftqxhncfw:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
  });
  // Wait, I don't have the database password. I should query the migrations instead.
}
main();
