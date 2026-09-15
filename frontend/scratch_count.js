const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: pawns } = await supabase.from('pawns').select('id, bill_no, branch_id');
  const { data: stocks } = await supabase.from('stock_items').select('id, bill_no, branch_id');
  
  console.log('Total Pawns:', pawns?.length);
  console.log('Total Stock Items:', stocks?.length);
}
test();
