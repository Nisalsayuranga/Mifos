const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const branchId = 'PND';
  const dateA = '2025-01-07';
  const dateB = '2025-07-01';
  const tempDate = '2025-12-31';

  console.log("Fetching ledgers for PND...");
  
  const { data: ledgerA } = await supabase.from('daily_ledgers').select('id, ledger_date').eq('branch_id', branchId).eq('ledger_date', dateA).maybeSingle();
  const { data: ledgerB } = await supabase.from('daily_ledgers').select('id, ledger_date').eq('branch_id', branchId).eq('ledger_date', dateB).maybeSingle();

  console.log("Ledger A (Jan 7):", ledgerA);
  console.log("Ledger B (Jul 1):", ledgerB);

  if (ledgerA && ledgerB) {
    console.log("Both exist, swapping...");
    await supabase.from('daily_ledgers').update({ ledger_date: tempDate }).eq('id', ledgerA.id);
    await supabase.from('daily_ledgers').update({ ledger_date: dateA }).eq('id', ledgerB.id);
    await supabase.from('daily_ledgers').update({ ledger_date: dateB }).eq('id', ledgerA.id);
    console.log("Swap complete!");
  } else if (ledgerA && !ledgerB) {
    console.log("Only Jan 7 exists, moving to Jul 1...");
    await supabase.from('daily_ledgers').update({ ledger_date: dateB }).eq('id', ledgerA.id);
    console.log("Move complete!");
  } else if (!ledgerA && ledgerB) {
    console.log("Only Jul 1 exists, moving to Jan 7...");
    await supabase.from('daily_ledgers').update({ ledger_date: dateA }).eq('id', ledgerB.id);
    console.log("Move complete!");
  } else {
    console.log("Neither exists!");
  }
}
run();
