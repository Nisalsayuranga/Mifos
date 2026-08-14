import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';
import { recordAuditLog } from '@/lib/audit-logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    const { id } = await params;
    const body = await request.json();
    const { insurance = 50, days = 1, approvedBy } = body;

    // 1. Fetch Pawn Ticket Details
    const { data: pawn, error: fetchError } = await adminSupabase
      .from('pawns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !pawn) {
      return NextResponse.json({ error: 'Pawn ticket not found' }, { status: 404 });
    }

    if (session && session.role === 'TELLER' && pawn.branch_id !== session.branchId) {
      return NextResponse.json({ error: 'Forbidden. You cannot redeem pawn tickets belonging to another branch.' }, { status: 403 });
    }

    if (pawn.status === 'REDEEMED') {
      return NextResponse.json({ error: 'Pawn ticket is already redeemed' }, { status: 400 });
    }

    // 2. Perform Interest Calculation Logic
    const principal = pawn.disbursed_amount || 0;
    const manualInsurance = parseFloat(insurance) || 0;
    
    // Rupasinghe Tiered Interest Structure
    const tier = principal < 50000 ? 'A' : 'B';
    let interestRate = 0.0250; // Tier A: 2.50%
    let discountRate = 0.0100; // Tier A: 1.00%
    if (tier === 'B') {
      interestRate = 0.0275; // Tier B: 2.75%
      discountRate = 0.0050; // Tier B: 0.50%
    }

    const interestOne = principal * interestRate;
    const totalAmount = principal + interestOne;

    let settlement = 0;
    if (days <= 10) {
      const discount = totalAmount * discountRate;
      settlement = totalAmount - discount;
    } else if (days <= 30) {
      settlement = totalAmount;
    } else if (days <= 38) {
      settlement = principal + ((totalAmount * interestRate) * 0.25) + interestOne + manualInsurance;
    } else if (days <= 45) {
      settlement = principal + ((totalAmount * interestRate) * 0.50) + interestOne + manualInsurance;
    } else if (days <= 60) {
      settlement = principal + (totalAmount * interestRate) + interestOne + manualInsurance;
    } else {
      const months = Math.ceil(days / 30);
      settlement = principal + ((totalAmount * interestRate) * (months - 1)) + interestOne + manualInsurance;
    }

    const accruedCharges = Math.max(0, settlement - principal);
    const interest = accruedCharges;

    // 3. Mark Pawn Ticket as REDEEMED
    const { error: updateError } = await adminSupabase
      .from('pawns')
      .update({
        status: 'REDEEMED',
        redeemed_at: new Date().toISOString(),
        redeemed_by: approvedBy || 'Teller / Cashier',
        redeem_amount: settlement,
        redeem_interest: interest,
        branch_id: pawn.branch_id
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 4. Log Settle/Redemption Transaction in User History (Soft Fallback)
    try {
      await adminSupabase.from('transaction').insert([{
        id: crypto.randomUUID(),
        client_id: pawn.client_id,
        type: 'PAWN_REDEEM',
        amount: settlement,
        description: `Redeemed Pawn: ${pawn.description} (Principal: Rs. ${principal.toLocaleString()}, Charges: Rs. ${accruedCharges.toLocaleString()}, Insurance: Rs. ${manualInsurance.toLocaleString()})`,
        branch_id: pawn.branch_id,
        timestamp: new Date().toISOString()
      }]);
    } catch (txErr) {
      console.warn("Transaction log warning (non-fatal):", txErr);
    }

    // 5. Post Balanced Double-Entry Journal Entry
    const jeId = `JE-AUTO-RED-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const { error: jeError } = await adminSupabase.from('journal_entry').insert([{
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

    await adminSupabase.from('journal_entry_line').insert(journalLines);

    // 6. Record Security Audit Log
    recordAuditLog(session, {
      action: 'REDEEM_PAWN',
      resource: `Pawn Ticket #${id.substring(0, 8)}`,
      branchId: pawn.branch_id,
      details: {
        pawnId: id,
        settlement,
        principal,
        interest,
        insurance: manualInsurance,
        days
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pawn redeemed and GL accounting entries posted.',
      journalEntryId: jeId,
      settlementAmount: settlement,
      principalAmount: principal,
      interestAmount: interest
    });
  } catch (error: any) {
    console.error('Pawns Redeem API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error redeeming pawn ticket' }, { status: 500 });
  }
}
