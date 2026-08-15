const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: d1, error: e1 } = await supabase.from('pawn_items').select('*').limit(1);
  console.log('pawn_items error:', e1?.message || 'OK');
  const { data: d2, error: e2 } = await supabase.from('stock_items').select('*').limit(1);
  console.log('stock_items error:', e2?.message || 'OK');
}
test();
