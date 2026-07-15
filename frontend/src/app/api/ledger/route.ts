import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { data: entries, error } = await supabase.from('journal_entry').select('*, journal_entry_line(*)').order('date', { ascending: false });
    if (error) throw error;
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Server-side double-entry validation
    const totalDebit = body.entries.reduce((sum: number, line: any) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = body.entries.reduce((sum: number, line: any) => sum + (parseFloat(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: "Debits and Credits must balance identically." }, { status: 400 });
    }

    const entryId = `JE-${Date.now()}`;

    // Insert Header
    const { error: headerError } = await supabase.from('journal_entry').insert([{
      id: entryId,
      date: body.date,
      description: body.description,
      reference: body.reference,
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_by: body.createdBy || 'System Admin'
    }]);

    if (headerError) throw headerError;

    // Insert Lines
    const lines = body.entries.map((line: any) => ({
      journal_entry_id: entryId,
      account_name: line.account,
      debit: parseFloat(line.debit) || 0,
      credit: parseFloat(line.credit) || 0
    }));

    const { error: linesError } = await supabase.from('journal_entry_line').insert(lines);
    if (linesError) throw linesError;
    
    return NextResponse.json({ success: true, id: entryId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
