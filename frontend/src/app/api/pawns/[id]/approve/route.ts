import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { id } = await params;
    const body = await request.json();
    const { approvedBy } = body;

    // 1. Get Pawn Details
    const { data: pawn, error: fetchError } = await supabase
      .from('pawns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !pawn) {
      return NextResponse.json({ error: 'Pawn ticket not found' }, { status: 404 });
    }

    if (pawn.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Pawn ticket is already approved or not pending' }, { status: 400 });
    }

    const principal = pawn.disbursed_amount || 0;

    // 2. Update Pawn Status to ACTIVE
    const { error: updateError } = await supabase
      .from('pawns')
      .update({ status: 'ACTIVE' })
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Log Disbursement Transaction
    const { error: txError } = await supabase.from('transaction').insert([{
      id: crypto.randomUUID(),
      client_id: pawn.client_id,
      type: 'PAWN_DISBURSE',
      amount: principal,
      description: `Disbursed Pawn: ${pawn.description}`,
      branch_id: pawn.branch_id,
      timestamp: new Date().toISOString()
    }]);

    if (txError) throw txError;

    // 4. Generate Automated Double-Entry General Ledger Posting
    const jeId = `JE-AUTO-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const { error: jeError } = await supabase.from('journal_entry').insert([{
      id: jeId,
      date: dateStr,
      description: `Automated Posting - Originated Pawn: ${pawn.description}`,
      reference: `PAWN-${pawn.id.substring(0, 8).toUpperCase()}`,
      total_debit: principal,
      total_credit: principal,
      created_by: approvedBy || 'Manager / Admin'
    }]);

    if (jeError) throw jeError;

    const { error: linesError } = await supabase.from('journal_entry_line').insert([
      {
        journal_entry_id: jeId,
        account_name: 'Pawn Loan Portfolio (Asset)',
        debit: principal,
        credit: 0
      },
      {
        journal_entry_id: jeId,
        account_name: 'Vault Cash (Asset)',
        debit: 0,
        credit: principal
      }
    ]);

    if (linesError) throw linesError;

    return NextResponse.json({ success: true, pawnId: id, journalEntryId: jeId });
  } catch (error: any) {
    console.error('Pawn approval error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
