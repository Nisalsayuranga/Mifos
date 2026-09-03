const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRealPawnData() {
  console.log('--- SEARCHING FOR REAL ORIGINAL PAWN DATA ---');

  const clientIds = ['9930e3c2-c240-44d8-b781-95058bb6e979', '02f6af7f-7b41-44d0-a319-5a72680551ea'];

  // 1. Audit logs
  const { data: logs } = await supabase.from('audit_logs').select('*');
  console.log('Total audit logs found:', logs ? logs.length : 0);
  (logs || []).forEach(l => {
    console.log('Audit log:', l);
  });

  // 2. Transaction table
  const { data: txs } = await supabase.from('transaction').select('*');
  console.log('\nTotal transactions found:', txs ? txs.length : 0);
  (txs || []).forEach(t => console.log('Transaction:', t));

  // 3. Journal entries
  const { data: journals } = await supabase.from('journal_entry').select('*');
  console.log('\nTotal journal entries found:', journals ? journals.length : 0);
  (journals || []).forEach(j => console.log('Journal:', j));

  // 4. Daily ledger transactions
  const { data: dailyTxs } = await supabase.from('daily_ledger_transactions').select('*');
  console.log('\nTotal daily ledger transactions found:', dailyTxs ? dailyTxs.length : 0);
  (dailyTxs || []).forEach(dt => console.log('Daily Ledger Tx:', dt));

  // 5. Stock items
  const { data: stock } = await supabase.from('stock_items').select('*');
  console.log('\nTotal stock items found:', stock ? stock.length : 0);
  (stock || []).forEach(s => console.log('Stock item:', s));
}

findRealPawnData();
