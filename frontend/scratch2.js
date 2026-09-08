const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('stock_customers').select('*').limit(1);
  console.log('stock_customers keys:', data ? Object.keys(data[0] || {}) : error);

  const { data: d2, error: e2 } = await supabase.from('clients').select('*').limit(1);
  console.log('clients keys:', d2 ? Object.keys(d2[0] || {}) : e2);
  
  const { data: d3, error: e3 } = await supabase.from('pawns').select('*').limit(1);
  console.log('pawns keys:', d3 ? Object.keys(d3[0] || {}) : e3);

  const { data: d4, error: e4 } = await supabase.from('audit_logs').select('*').limit(1);
  console.log('audit_logs keys:', d4 ? Object.keys(d4[0] || {}) : e4);
}
test();
