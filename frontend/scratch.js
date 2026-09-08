const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing stock_customers...");
  const { data, error } = await supabase.from('stock_customers').select('*').ilike('branch_id', '%KHT%');
  console.log('stock_customers error:', error);
  console.log('stock_customers data length:', data?.length);

  console.log("Testing clients...");
  const { data: d2, error: e2 } = await supabase.from('clients').select('*').or(`branch_id.ilike.%KHT%,branchId.ilike.%KHT%`);
  console.log('clients error:', e2);
  console.log('clients data length:', d2?.length);
}
test();
