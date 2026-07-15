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
    const { insurance = 50, days = 1, approvedBy } = body;

    // 1. Fetch Pawn Ticket Details
    const { data: pawn, error: fetchError } = await supabase
      .from('pawns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !pawn) {
      return NextResponse.json({ error: 'Pawn ticket not found' }, { status: 404 });
    }

    if (pawn.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only ACTIVE pawn tickets can be redeemed' }, { status: 400 });
    }

    const principal = pawn.disbursed_amount || 0;
    const manualInsurance = parseFloat(insurance) || 0;
    const daysElapsed = parseInt(days) || 1;

    // 2. Perform Server-Side Mathematical Interest Calculation (Rupasinghe Math Engine)
    const tier = principal < 50000 ? 'A' : 'B';
    let interestRate = 0.0250; // Tier A: 2.50%
    let discountRate = 0.0100; // Tier A: 1.00%

    if (tier === 'B') {
      interestRate = 0.0275; // Tier B: 2.75%
      discountRate = 0.0050; // Tier B: 0.50%
    }

    const interestOne = principal * interestRate;
    const totalAmount = principal + interestOne;
    const finalTotalInterest = interestOne + manualInsurance;

    let settlement = 0;
    if (daysElapsed <= 10) {
      const discount = totalAmount * discountRate;
      settlement = totalAmount - discount;
    } else if (daysElapsed <= 30) {
      settlement = totalAmount;
    } else if (daysElapsed <= 38) {
      const extraInt = (totalAmount * interestRate) * 0.25;
      settlement = principal + extraInt + finalTotalInterest;
    } else if (daysElapsed <= 45) {
      const extraInt = (totalAmount * interestRate) * 0.50;
      settlement = principal + extraInt + finalTotalInterest;
    } else if (daysElapsed <= 60) {
      const extraInt = totalAmount * interestRate;
      settlement = principal + extraInt + finalTotalInterest;
    } else {
      const months = Math.ceil(daysElapsed / 30);
      const extraInt = (totalAmount * interestRate) * (months - 1);
      settlement = principal + extraInt + finalTotalInterest;
    }

    const accruedCharges = Math.max(0, settlement - principal);

    // 3. Update Pawn Ticket Status to REDEEMED
    const { error: updateError } = await supabase
      .from('pawns')
      .update({ status: 'REDEEMED' })
      .eq('id', id);

    if (updateError) throw updateError;

    // 4. Log Settle/Redemption Transaction in User History
    const { error: txError } = await supabase.from('transaction').insert([{
      id: crypto.randomUUID(),
      client_id: pawn.client_id,
      type: 'PAWN_REDEEM',
      amount: settlement,
      description: `Redeemed Pawn: ${pawn.description} (Principal: Rs. ${principal.toLocaleString()}, Charges: Rs. ${accruedCharges.toLocaleString()}, Insurance: Rs. ${manualInsurance.toLocaleString()})`,
      branch_id: pawn.branch_id,
      timestamp: new Date().toISOString()
    }]);

    if (txError) throw txError;

    // 5. Post Balanced Double-Entry Journal Entry
    const jeId = `JE-AUTO-RED-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const { error: jeError } = await supabase.from('journal_entry').insert([{
      id: jeId,
      date: dateStr,
      description: `Automated Redemption Posting - Pawn: ${pawn.description}`,
      reference: `PAWN-RED-${pawn.id.substring(0, 8).toUpperCase()}`,
      total_debit: settlement,
      total_credit: settlement,
      created_by: approvedBy || 'Teller / Cashier'
    }]);

    if (jeError) throw jeError;

    // Generate balanced double-entry lines
    const journalLines = [
      {
        journal_entry_id: jeId,
        account_name: 'Vault Cash (Asset)',
        debit: settlement,
        credit: 0
      },
      {
        journal_entry_id: jeId,
        account_name: 'Pawn Loan Portfolio (Asset)',
        debit: 0,
        credit: principal
      }
    ];

    if (accruedCharges > 0) {
      journalLines.push({
        journal_entry_id: jeId,
        account_name: 'Interest & Fee Income (Revenue)',
        debit: 0,
        credit: accruedCharges
      });
    }

    const { error: linesError } = await supabase.from('journal_entry_line').insert(journalLines);
    if (linesError) throw linesError;

    return NextResponse.json({
      success: true,
      pawnId: id,
      journalEntryId: jeId,
      settlementAmount: settlement,
      accruedCharges,
      principal
    });
  } catch (error: any) {
    console.error('Pawn redemption server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
