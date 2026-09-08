const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { error: e1 } = await supabase.from('stock_customers').select('*').eq('branchId', 'test').limit(1);
  console.log('branchId error:', e1?.message);

  const { error: e2 } = await supabase.from('stock_customers').select('*').eq('branch_id', 'test').limit(1);
  console.log('branch_id error:', e2?.message);

  const { error: e3 } = await supabase.from('stock_customers').select('id, name, branchId, branch_id').limit(1);
  console.log('select columns error:', e3?.message);
}
test();
