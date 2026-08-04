const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data, error } = await supabase.rpc('get_columns', { table_name: 'daily_ledger_transactions' });
    if (error) {
      // If RPC fails, try fetching one row
      const { data: rowData } = await supabase.from('daily_ledger_transactions').select('*').limit(1);
      if (rowData && rowData.length > 0) {
        console.log("Columns:", Object.keys(rowData[0]));
      } else {
        console.log("No rows to infer columns from.");
      }
    } else {
      console.log("Columns:", data);
    }
  } catch (err) {
    console.error(err);
  }
}
check();
