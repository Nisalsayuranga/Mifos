const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToInspect = [
  'branches',
  'profiles',
  'clients',
  'pawns',
  'pawn_items',
  'transaction',
  'stock_items',
  'journal_entry',
  'journal_entry_line',
  'daily_ledgers',
  'daily_ledger_transactions',
  'branch_status',
  'audit_logs'
];

async function inspectFullSchema() {
  console.log('=== FULL SUPABASE DATABASE SCHEMA AUDIT ===\n');

  for (const t of tablesToInspect) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table [${t}]: Error or Not Exists -> ${error.message}`);
    } else {
      const sample = (data && data.length > 0) ? data[0] : null;
      const columns = sample ? Object.keys(sample) : '(Empty table)';
      console.log(`Table [${t}]:`);
      console.log(`  Columns (${Array.isArray(columns) ? columns.length : 0}):`, columns);
    }
  }
}

inspectFullSchema();
