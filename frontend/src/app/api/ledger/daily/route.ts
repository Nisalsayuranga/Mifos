import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch_id = searchParams.get('branch_id');
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // YYYY-MM

    if (date && branch_id) {
      // Fetch specific single day ledger
      const { data: ledger, error: ledgerErr } = await supabase
        .from('daily_ledgers')
        .select('*')
        .eq('branch_id', branch_id)
        .eq('ledger_date', date)
        .maybeSingle();

      if (ledgerErr) {
        return NextResponse.json({ error: ledgerErr.message }, { status: 500 });
      }

      let transactions = [];
      let expenses = [];

      if (ledger) {
        const [txRes, expRes] = await Promise.all([
          supabase.from('daily_ledger_transactions').select('*').eq('ledger_id', ledger.id).order('created_at', { ascending: true }),
          supabase.from('daily_ledger_expenses').select('*').eq('ledger_id', ledger.id).order('created_at', { ascending: true })
        ]);
        transactions = txRes.data || [];
        expenses = expRes.data || [];
      }

      // Also fetch previous day closing balance for continuity validation
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];

      const { data: prevLedger } = await supabase
        .from('daily_ledgers')
        .select('closing_balance, cp_balance, ledger_date')
        .eq('branch_id', branch_id)
        .lt('ledger_date', date)
        .order('ledger_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        ledger: ledger || null,
        transactions,
        expenses,
        previous_closing: prevLedger ? Number(prevLedger.closing_balance) : null,
        previous_capital: prevLedger ? Number(prevLedger.cp_balance) : null,
        previous_ledger_date: prevLedger ? prevLedger.ledger_date : null
      });
    }

    // Otherwise fetch list for branch / month
    let query = supabase.from('daily_ledgers').select('*').order('ledger_date', { ascending: false });

    if (branch_id && branch_id !== 'HQ' && branch_id !== 'ALL') {
      query = query.eq('branch_id', branch_id);
    }

    if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      query = query.gte('ledger_date', startDate).lte('ledger_date', endDate);
    }

    const { data: ledgers, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ledgers: ledgers || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      branch_id,
      ledger_date,
      cp_balance = 0,
      opening_capital = 0,
      opening_balance = 0,
      transfer_in = 0,
      transfer_in_type = '',
      transfer_out = 0,
      transfer_out_type = '',
      loan_issued_total = 0,
      redemption_total = 0,
      interest_rec_total = 0,
      recovery_total = 0,
      insurance_total = 0,
      expenses_total = 0,
      closing_balance = 0,
      actual_cash_count = null,
      staff_shift = '',
      status = 'APPROVED',
      created_by = 'System User',
      transactions = [],
      expenses = []
    } = body;

    if (!branch_id || !ledger_date) {
      return NextResponse.json({ error: 'branch_id and ledger_date are required' }, { status: 400 });
    }

    // --- CASH MATH ---
    const calcOpeningCash = Number(opening_balance) || 0;
    const calcTrIn = Number(transfer_in) || 0;
    const calcTrOut = Number(transfer_out) || 0;
    const calcLoans = Number(loan_issued_total) || 0;
    const calcRedeem = Number(redemption_total) || 0;
    const calcInterest = Number(interest_rec_total) || 0;
    const calcRecovery = Number(recovery_total) || 0;
    const calcInsurance = Number(insurance_total) || 0;
    const calcExpenses = Number(expenses_total) || 0;
    const userClosingCash = Number(closing_balance) || 0; // This is the Cash they entered

    const calculatedClosingCash = Number((
      calcOpeningCash + calcTrIn - calcTrOut - calcLoans + calcRedeem + calcInterest + calcRecovery + calcInsurance - calcExpenses
    ).toFixed(2));

    const cashMismatch = Math.abs(userClosingCash - calculatedClosingCash) > 0.01;
    const cashVariance = Number((userClosingCash - calculatedClosingCash).toFixed(2));

    // --- CAPITAL MATH ---
    const userOpeningCapital = Number(opening_capital) || 0; // New field from payload
    const userClosingCapital = Number(cp_balance) || 0;      // CP Balance = Closing Capital

    const calculatedClosingCapital = Number((
      userOpeningCapital + calcLoans - calcRedeem
    ).toFixed(2));

    const capitalMismatch = Math.abs(userClosingCapital - calculatedClosingCapital) > 0.01;
    const capitalVariance = Number((userClosingCapital - calculatedClosingCapital).toFixed(2));

    // Determine status (Flag if EITHER is mismatched)
    const finalStatus = (cashMismatch || capitalMismatch) ? 'FLAGGED' : status;

    // Use variance field to store cash variance primarily, or capital variance if only capital is mismatched
    const storedVariance = cashMismatch ? cashVariance : (capitalMismatch ? capitalVariance : 0);

    // 2. Upsert Daily Ledger
    const ledgerPayload: Record<string, any> = {
      branch_id,
      ledger_date,
      cp_balance: userClosingCapital,
      opening_capital: userOpeningCapital,
      opening_balance: calcOpeningCash,
      transfer_in: calcTrIn,
      transfer_out: calcTrOut,
      loan_issued_total: calcLoans,
      redemption_total: calcRedeem,
      interest_rec_total: calcInterest,
      recovery_total: calcRecovery,
      insurance_total: calcInsurance,
      expenses_total: calcExpenses,
      closing_balance: userClosingCash,
      actual_cash_count: userClosingCash, // Set actual cash to entered cash
      variance: storedVariance,
      staff_shift,
      status: finalStatus,
      created_by,
      updated_at: new Date().toISOString()
    };

    if (transfer_in_type) ledgerPayload.transfer_in_type = transfer_in_type;
    if (transfer_out_type) ledgerPayload.transfer_out_type = transfer_out_type;

    let { data: ledger, error: ledgerErr } = await supabase
      .from('daily_ledgers')
      .upsert(ledgerPayload, { onConflict: 'branch_id, ledger_date' })
      .select('*')
      .single();

    // If database table does not contain transfer_in_type/transfer_out_type columns, retry without them
    if (ledgerErr && (ledgerErr.message?.includes('transfer_in_type') || ledgerErr.message?.includes('transfer_out_type') || ledgerErr.code === 'PGRST204')) {
      delete ledgerPayload.transfer_in_type;
      delete ledgerPayload.transfer_out_type;

      const retryRes = await supabase
        .from('daily_ledgers')
        .upsert(ledgerPayload, { onConflict: 'branch_id, ledger_date' })
        .select('*')
        .single();

      ledger = retryRes.data;
      ledgerErr = retryRes.error;
    }

    if (ledgerErr) {
      return NextResponse.json({ error: ledgerErr.message }, { status: 500 });
    }

    const ledgerId = ledger.id;

    // 3. Clear and Re-insert Child Transactions & Expenses
    await Promise.all([
      supabase.from('daily_ledger_transactions').delete().eq('ledger_id', ledgerId),
      supabase.from('daily_ledger_expenses').delete().eq('ledger_id', ledgerId)
    ]);

    if (Array.isArray(transactions) && transactions.length > 0) {
      const txRows = transactions.map((t: any) => {
        let finalRemarks = t.remarks || '';
        
        return {
          ledger_id: ledgerId,
          transaction_type: t.transaction_type || 'LOAN_ISSUED',
          bill_no: t.loan_no || t.bill_no || '',
          amount: Number(t.cash_loan) || Number(t.amount) || 0,
          weight_g: Number(t.weight_g) || 0,
          weight_mg: Number(t.weight_mg) || 0,
          insurance_rs: Number(t.insurance_rs) || 0,
          item_code: t.item_code || '',
          interest_rs: Number(t.interest_rs) || 0,
          cash_received: Number(t.cash_received) || 0,
          fs_type: t.fs_type || '',
          redeem_no: t.redeem_no || '',
          type_ir: t.type_ir || '',
          quantity: t.quantity || '',
          remarks: finalRemarks
        };
      });
      const { error: txErr } = await supabase.from('daily_ledger_transactions').insert(txRows);
      if (txErr) {
        return NextResponse.json({ error: 'Failed to save transactions: ' + txErr.message }, { status: 500 });
      }
    }

    if (Array.isArray(expenses) && expenses.length > 0) {
      const expRows = expenses.map((e: any) => ({
        ledger_id: ledgerId,
        description: e.description || 'Expense',
        amount: Number(e.amount) || 0
      }));
      await supabase.from('daily_ledger_expenses').insert(expRows);
    }

    return NextResponse.json({
      success: true,
      ledger_id: ledgerId,
      calculated_closing_cash: calculatedClosingCash,
      calculated_closing_capital: calculatedClosingCapital,
      cash_status: cashMismatch ? 'MISMATCH' : 'OK',
      capital_status: capitalMismatch ? 'MISMATCH' : 'OK',
      variance: storedVariance,
      status: finalStatus
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });

    const { error } = await supabase.from('daily_ledgers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, is_flag_ignored } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabase
      .from('daily_ledgers')
      .update({ is_flag_ignored: !!is_flag_ignored })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
