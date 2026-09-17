import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let adminSupabase: any;
if (supabaseUrl && supabaseKey) {
  adminSupabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const branchParam = searchParams.get('branch') || '';

    if (!adminSupabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // 1. Fetch Interest Entries from stock_interests
    let interestQuery = adminSupabase.from('stock_interests').select('*').eq('date', dateParam);
    if (branchParam && branchParam.toUpperCase() !== 'ALL') {
      interestQuery = interestQuery.ilike('branch', branchParam);
    }
    const { data: interestItems, error: interestErr } = await interestQuery;

    // 2. Fetch Daily Ledger Transactions for F/S and R
    let ledgerTxQuery = adminSupabase
      .from('daily_ledger_transactions')
      .select('*, daily_ledgers(ledger_date, branch_id)')
      .order('created_at', { ascending: false });

    const { data: rawLedgerTxs, error: ledgerErr } = await ledgerTxQuery;

    let fsItems: any[] = [];
    let receiptItems: any[] = [];

    if (rawLedgerTxs && Array.isArray(rawLedgerTxs)) {
      rawLedgerTxs.forEach((tx: any) => {
        const txDate = tx.daily_ledgers?.ledger_date || tx.created_at?.split('T')[0];
        const txBranch = tx.daily_ledgers?.branch_id || tx.branch_id || '';

        const dateMatch = !dateParam || txDate === dateParam;
        const branchMatch = !branchParam || branchParam.toUpperCase() === 'ALL' || txBranch.toUpperCase() === branchParam.toUpperCase();

        if (dateMatch && branchMatch) {
          // F / S charges
          if (tx.fs_type === 'F' || tx.fs_type === 'S' || Number(tx.insurance_rs) > 0) {
            fsItems.push({
              id: tx.id,
              bill_no: tx.bill_no || tx.redeem_no || 'N/A',
              date: txDate,
              fs_type: tx.fs_type || 'F',
              amount: Number(tx.insurance_rs) || Number(tx.amount) || 0,
              branch: txBranch || 'DMT',
              remarks: tx.remarks || 'Form/Stamp Fee',
              category: 'FS'
            });
          }

          // R (Receipts / Redemptions)
          if (tx.type_ir === 'R' || tx.transaction_type === 'REDEEM' || Number(tx.cash_received) > 0) {
            receiptItems.push({
              id: tx.id,
              bill_no: tx.bill_no || tx.redeem_no || 'N/A',
              date: txDate,
              amount: Number(tx.cash_received) || Number(tx.amount) || 0,
              branch: txBranch || 'DMT',
              remarks: tx.remarks || 'Pawn Redemption Receipt',
              category: 'RECEIPT'
            });
          }
        }
      });
    }

    // 3. Fetch Stock Items (Loans & Redeems)
    let stockQuery = adminSupabase.from('stock_items').select('*');
    if (branchParam && branchParam.toUpperCase() !== 'ALL') {
      stockQuery = stockQuery.ilike('branch_id', branchParam);
    }
    const { data: allStock, error: stockErr } = await stockQuery;

    let loanItems: any[] = [];
    let redeemItems: any[] = [];

    if (allStock && Array.isArray(allStock)) {
      allStock.forEach((s: any) => {
        const createDate = s.date || s.created_at?.split('T')[0];
        const withdrawDate = s.withdrawal_date;

        if (createDate === dateParam && s.status === 'Active') {
          loanItems.push({
            id: s.id,
            bill_no: s.bill_no,
            date: createDate,
            amount: Number(s.price) || Number(s.disbursed_amount) || 0,
            weight: Number(s.weight) || 0,
            item_type: s.item_type || 'GOLD',
            branch: s.branch_id || 'DMT',
            category: 'LOAN'
          });
        }

        if (withdrawDate === dateParam && s.status === 'Withdrawn') {
          redeemItems.push({
            id: s.id,
            bill_no: s.bill_no,
            date: withdrawDate,
            amount: Number(s.price) || Number(s.disbursed_amount) || 0,
            weight: Number(s.weight) || 0,
            reason: s.withdrawal_reason || 'Pawn Redeemed',
            branch: s.branch_id || 'DMT',
            category: 'REDEEM'
          });
        }
      });
    }

    const formattedInterests = (interestItems || []).map((i: any) => ({
      id: i.id,
      bill_no: i.bill_no,
      date: i.date,
      amount: Number(i.interest_value) || 0,
      branch: i.branch,
      notes: i.notes || '',
      category: 'INTEREST'
    }));

    // Calculate totals
    const totalFs = fsItems.reduce((acc: number, x: any) => acc + x.amount, 0);
    const totalInterest = formattedInterests.reduce((acc: number, x: any) => acc + x.amount, 0);
    const totalReceipts = receiptItems.reduce((acc: number, x: any) => acc + x.amount, 0);
    const totalLoans = loanItems.reduce((acc: number, x: any) => acc + x.amount, 0);
    const totalRedeems = redeemItems.reduce((acc: number, x: any) => acc + x.amount, 0);

    return NextResponse.json({
      date: dateParam,
      branch: branchParam || 'ALL',
      summary: {
        total_fs: totalFs,
        total_interest: totalInterest,
        total_receipts: totalReceipts,
        total_loans: totalLoans,
        total_redeems: totalRedeems,
        item_count: fsItems.length + formattedInterests.length + receiptItems.length + loanItems.length + redeemItems.length
      },
      data: {
        fs_items: fsItems,
        interest_items: formattedInterests,
        receipt_items: receiptItems,
        loan_items: loanItems,
        redeem_items: redeemItems
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
