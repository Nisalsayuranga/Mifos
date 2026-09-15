const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteHardcoded() {
  const billsToDelete = ['3M B', '6R 00003', '1R 0002'];
  const { error } = await supabase.from('stock_items').delete().in('bill_no', billsToDelete);
  
  if (error) {
    console.error('Error deleting:', error.message);
  } else {
    console.log('Successfully deleted the 3 hardcoded stock items.');
  }
}
deleteHardcoded();
