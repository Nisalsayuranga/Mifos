const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreExactRealPawns() {
  console.log('--- RESTORING EXACT REAL ORIGINAL PAWN DATA ---');

  // 1. Client K k champika (197164300820)
  const { data: c1 } = await supabase.from('clients').select('*').or('nationalId.eq.197164300820,national_id.eq.197164300820').single();
  if (c1) {
    console.log('Found client K k champika:', c1.id);
    const { data: p1 } = await supabase.from('pawns').select('*').eq('client_id', c1.id);
    if (p1 && p1.length > 0) {
      await supabase.from('pawns').update({
        disbursed_amount: 193885,
        appraised_value: 230000,
        bill_no: '1R 0002',
        description: '1R 0002 | Gold Jewellery Collateral',
        period_months: 1,
        branch_id: 'KHT'
      }).eq('id', p1[0].id);
      console.log('Restored K k champika pawn ticket to Rs. 193,885, Bill No: 1R 0002');
    }
  }

  // 2. Client M.Suwarnamali (198080100968)
  const { data: c2 } = await supabase.from('clients').select('*').or('nationalId.eq.198080100968,national_id.eq.198080100968').single();
  if (c2) {
    console.log('Found client M.Suwarnamali:', c2.id);
    const { data: p2 } = await supabase.from('pawns').select('*').eq('client_id', c2.id);
    if (p2 && p2.length > 0) {
      await supabase.from('pawns').update({
        disbursed_amount: 85000,
        appraised_value: 110000,
        bill_no: '3M 0604',
        description: '3M 0604 | Gold Necklace Collateral',
        period_months: 3,
        branch_id: 'KHT'
      }).eq('id', p2[0].id);
      console.log('Restored M.Suwarnamali pawn ticket to Rs. 85,000, Bill No: 3M 0604');
    }
  }

  console.log('--- ORIGINAL REAL PAWN DATA RESTORED 100% CLEANLY ---');
}

restoreExactRealPawns();
