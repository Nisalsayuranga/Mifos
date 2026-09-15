const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPawnsToStock() {
  // Fetch all pawns
  const { data: pawns, error: pawnErr } = await supabase.from('pawns').select('*');
  if (pawnErr) {
    console.error('Error fetching pawns:', pawnErr);
    return;
  }
  
  // Fetch all pawn items to get item_types
  const { data: pawnItems } = await supabase.from('pawn_items').select('*');
  
  // Fetch all stock items to avoid duplicates
  const { data: stocks } = await supabase.from('stock_items').select('bill_no');
  const existingBills = new Set(stocks.map(s => s.bill_no));

  let inserted = 0;

  for (const pawn of pawns) {
    const billNo = pawn.bill_no || (pawn.description ? (pawn.description.match(/^([A-Za-z0-9]+\s+\d+)/)?.[1]?.trim()) : null) || pawn.id.substring(0, 8);
    
    if (billNo && !existingBills.has(billNo)) {
      // Find item type from pawn_items
      const items = pawnItems.filter(i => i.pawn_id === pawn.id);
      const itemType = items.length > 0 ? items.map(i => i.item_type).join(', ') : 'PAWN';
      
      const totWeight = (parseFloat(pawn.weight_grams) || 0) + (parseFloat(pawn.weight_mg) || 0) / 1000;
      
      // Determine status: if REDEEMED, it's Withdrawn. Otherwise Active.
      const status = pawn.status === 'REDEEMED' ? 'Withdrawn' : 'Active';
      const withdrawalDate = pawn.status === 'REDEEMED' ? pawn.redeemed_at?.split('T')[0] : null;

      const newStock = {
        id: crypto.randomUUID(),
        bill_no: billNo,
        branch_id: pawn.branch_id,
        item_type: itemType || pawn.description || 'Pawned Gold Collateral',
        weight: totWeight,
        price: pawn.appraised_value || pawn.disbursed_amount || 0,
        status: status,
        date: (pawn.created_at || new Date().toISOString()).split('T')[0],
        created_at: pawn.created_at || new Date().toISOString()
      };

      if (withdrawalDate) {
         newStock.withdrawal_date = withdrawalDate;
         newStock.withdrawal_reason = 'Pawn Redeemed (Closed)';
      }

      const { error: insErr } = await supabase.from('stock_items').insert([newStock]);
      if (insErr) {
        console.error('Error inserting stock:', insErr, newStock);
      } else {
        inserted++;
        existingBills.add(billNo);
      }
    } else if (billNo && existingBills.has(billNo)) {
        // If it exists, ensure its status is correct
        const status = pawn.status === 'REDEEMED' ? 'Withdrawn' : 'Active';
        if (status === 'Withdrawn') {
            await supabase.from('stock_items').update({
                status: 'Withdrawn',
                withdrawal_date: pawn.redeemed_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                withdrawal_reason: 'Pawn Redeemed (Closed)'
            }).eq('bill_no', billNo);
        } else {
            await supabase.from('stock_items').update({
                status: 'Active'
            }).eq('bill_no', billNo);
        }
    }
  }

  console.log(`Synced pawns to stock items. Inserted ${inserted} new items.`);
}

syncPawnsToStock();
