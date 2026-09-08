const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPawns() {
  console.log('--- INSPECTING ALL PAWN RECORDS IN SUPABASE DATABASE ---');
  const { data: pawns, error } = await supabase.from('pawns').select('*');
  
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Total Pawn Records in Supabase: ${pawns ? pawns.length : 0}`);
  (pawns || []).forEach((p, idx) => {
    console.log(`[Pawn ${idx + 1}] ID: ${p.id}`);
    console.log(`  Bill No: ${p.bill_no || p.billNo || 'N/A'}`);
    console.log(`  Client ID: ${p.client_id || p.clientId || 'N/A'}`);
    console.log(`  Branch ID: ${p.branch_id || p.branchId || 'N/A'}`);
    console.log(`  Disbursed Amount: ${p.disbursed_amount || p.disbursedAmount || '0'}`);
    console.log(`  Status: ${p.status || 'N/A'}`);
    console.log(`  Created At: ${p.created_at || p.createdAt || 'N/A'}`);
    console.log('---');
  });
}

inspectPawns();
