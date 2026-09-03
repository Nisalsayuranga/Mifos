const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('====================================================');
  console.log('      FULL MIFOS SYSTEM DATABASE & HEALTH AUDIT     ');
  console.log('====================================================');

  const report = {};

  // 1. Audit Branches
  const { data: branches, error: bErr } = await supabase.from('branches').select('*');
  report.branchesCount = branches ? branches.length : 0;
  report.branchesError = bErr ? bErr.message : null;
  report.branchList = branches ? branches.map(b => `${b.id}: ${b.name}`) : [];

  // 2. Audit Profiles / Users
  const { data: profiles, error: prErr } = await supabase.from('profiles').select('*');
  report.profilesCount = profiles ? profiles.length : 0;
  report.profilesError = prErr ? prErr.message : null;

  // 3. Audit Pawns Table
  const { data: pawns, error: pErr } = await supabase.from('pawns').select('*');
  report.pawnsCount = pawns ? pawns.length : 0;
  report.pawnsError = pErr ? pErr.message : null;
  report.pawnsWithWeightCols = pawns && pawns.length > 0 ? {
    hasWeight: 'weight' in pawns[0],
    hasGrams: 'weight_grams' in pawns[0],
    hasMg: 'weight_mg' in pawns[0]
  } : 'No pawns';

  // 4. Audit Clients Table
  const { data: clients, error: cErr } = await supabase.from('clients').select('*');
  report.clientsCount = clients ? clients.length : 0;
  report.clientsError = cErr ? cErr.message : null;

  // 5. Audit Daily Ledgers
  const { data: ledgers, error: lErr } = await supabase.from('daily_ledgers').select('*');
  report.ledgersCount = ledgers ? ledgers.length : 0;
  report.ledgersError = lErr ? lErr.message : null;

  // 6. Audit Daily Ledger Transactions
  const { data: txs, error: txErr } = await supabase.from('daily_ledger_transactions').select('*');
  report.transactionsCount = txs ? txs.length : 0;
  report.transactionsError = txErr ? txErr.message : null;

  // 7. Audit Vault Transfers
  const { data: transfers, error: vErr } = await supabase.from('vault_transfer').select('*');
  report.transfersCount = transfers ? transfers.length : 0;
  report.transfersError = vErr ? vErr.message : null;

  // 8. Audit Stock Items
  const { data: stock, error: sErr } = await supabase.from('stock_items').select('*');
  report.stockCount = stock ? stock.length : 0;
  report.stockError = sErr ? sErr.message : null;

  console.log('\n--- AUDIT SUMMARY REPORT ---');
  console.dir(report, { depth: null });
  console.log('\n====================================================');
}

runAudit();
