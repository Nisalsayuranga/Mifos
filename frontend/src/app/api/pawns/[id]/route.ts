import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { id } = await context.params;
    const body = await request.json();
    const { clientId, description, appraisedValue, disbursedAmount, billNo, weight, itemType } = body;

    const { data, error } = await supabase.from('pawns').update({
      client_id: clientId,
      description,
      appraised_value: parseFloat(appraisedValue) || 0,
      disbursed_amount: parseFloat(disbursedAmount) || 0,
    }).eq('id', id).select().single();

    if (error) throw error;

    // Update stock item if billNo is present
    if (billNo) {
      await supabase.from('stock_items').update({
        price: parseFloat(appraisedValue) || parseFloat(disbursedAmount) || 0,
        weight: parseFloat(weight) || 0,
        item_type: itemType || 'PAWN'
      }).eq('bill_no', billNo.trim());
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { id } = await context.params;

    // Fetch pawn details first to get description / bill_no
    const { data: pawn } = await supabase.from('pawns').select('*').eq('id', id).single();

    const { error } = await supabase.from('pawns').delete().eq('id', id);
    if (error) throw error;

    // Also delete from stock_items if bill_no can be extracted
    if (pawn && pawn.description) {
      const match = pawn.description.match(/^([A-Za-z0-9]+\s+\d+)/);
      if (match) {
        const billNo = match[1].trim();
        await supabase.from('stock_items').delete().eq('bill_no', billNo);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
