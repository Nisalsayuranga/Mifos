const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPawnsAPI() {
  console.log('--- TESTING FIXED PAWNS API LOGIC ---');
  
  // 1. Fetch pawns
  const { data: data, error } = await supabase.from('pawns').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching pawns:', error);
    return;
  }

  // 2. Fetch clients
  const clientIds = Array.from(new Set((data || []).map((p) => p.client_id).filter(Boolean)));
  let clientsByIdMap = {};
  if (clientIds.length > 0) {
    const { data: clientRows } = await supabase.from('clients').select('*').in('id', clientIds);
    if (clientRows) {
      clientRows.forEach(c => {
        clientsByIdMap[c.id] = c;
        if (c.nationalId) clientsByIdMap[c.nationalId] = c;
        if (c.national_id) clientsByIdMap[c.national_id] = c;
      });
    }
  }

  // 3. Fetch pawn_items
  const pawnIds = data?.map(p => p.id) || [];
  let itemsMap = {};
  if (pawnIds.length > 0) {
    const { data: allItems } = await supabase.from('pawn_items').select('*').in('pawn_id', pawnIds);
    if (allItems) {
       allItems.forEach(item => {
          if (!itemsMap[item.pawn_id]) itemsMap[item.pawn_id] = [];
          itemsMap[item.pawn_id].push(item);
       });
    }
  }

  const mappedData = (data || []).map((pawn) => {
     const pItems = itemsMap[pawn.id] || [];
     let totalWeight = 0;
     if (pItems.length > 0) {
         pItems.forEach((item) => {
             totalWeight += (parseFloat(item.weight_grams) || 0) + ((parseFloat(item.weight_mg) || 0) / 1000);
         });
     }
     pawn.weight = totalWeight;
     pawn.items = pItems;
     
     if (!pawn.clients && pawn.client_id && clientsByIdMap[pawn.client_id]) {
       pawn.clients = clientsByIdMap[pawn.client_id];
     }

     return pawn;
  });

  console.log('Mapped Pawns Result Count:', mappedData.length);
  console.log('Sample Mapped Pawn Record:', JSON.stringify(mappedData[0], null, 2));
}

testPawnsAPI();
