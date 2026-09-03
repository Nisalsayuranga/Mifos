const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanOtherPawns() {
  console.log('--- KEEPING 2 TRUE PAWNS AND DELETING OTHERS ---');

  // 1. Fetch target clients for NIC 197164300820 & 198080100968
  const { data: clients } = await supabase.from('clients').select('*');
  const targetClientIds = new Set(
    (clients || [])
      .filter(c => {
        const nic = c.nationalId || c.national_id;
        return nic === '197164300820' || nic === '198080100968';
      })
      .map(c => c.id)
  );

  console.log('Target Client IDs for true pawnings:', Array.from(targetClientIds));

  // 2. Fetch all pawns
  const { data: pawns } = await supabase.from('pawns').select('*');
  console.log(`Found total ${pawns ? pawns.length : 0} pawn records in DB.`);

  const keptPawns = [];
  const deletedPawns = [];

  for (const p of (pawns || [])) {
    if (targetClientIds.has(p.client_id)) {
      keptPawns.push(p);
    } else {
      deletedPawns.push(p);
    }
  }

  console.log(`Kept ${keptPawns.length} true pawns:`, keptPawns.map(p => ({ id: p.id, client: p.client_id, desc: p.description })));
  console.log(`Deleting ${deletedPawns.length} non-matching pawns...`);

  for (const p of deletedPawns) {
    // Delete associated pawn_items
    await supabase.from('pawn_items').delete().eq('pawn_id', p.id);
    // Delete associated stock_items
    await supabase.from('stock_items').delete().eq('pawn_id', p.id);
    // Delete pawn record
    const { error } = await supabase.from('pawns').delete().eq('id', p.id);
    if (error) console.error(`Error deleting pawn ${p.id}:`, error.message);
    else console.log(`Deleted pawn ID: ${p.id}`);
  }

  console.log('--- CLEANUP COMPLETED SUCCESSFULLY ---');
}

cleanOtherPawns();
