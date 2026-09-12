const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log('Testing fetch...');
  const { data, error } = await supabase.from('clusters').select('*').limit(1);
  if (error) {
    console.error('Fetch error:', error);
  } else {
    console.log('Fetch success, rows:', data.length);
  }
}

test();
