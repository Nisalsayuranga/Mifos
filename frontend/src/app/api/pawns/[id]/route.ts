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
    const { clientId, description, appraisedValue, disbursedAmount } = body;

    const { data, error } = await supabase.from('pawns').update({
      client_id: clientId,
      description,
      appraised_value: parseFloat(appraisedValue) || 0,
      disbursed_amount: parseFloat(disbursedAmount) || 0,
    }).eq('id', id).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { id } = await context.params;
    const { error } = await supabase.from('pawns').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
