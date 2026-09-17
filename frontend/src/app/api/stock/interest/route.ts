import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let adminSupabase: any;
if (supabaseUrl && supabaseKey) {
  adminSupabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

// GET: Fetch interest records for a specific bill or all bills
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const billNo = searchParams.get('bill_no');

    if (!adminSupabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    let query = adminSupabase
      .from('stock_interests')
      .select('*')
      .order('created_at', { ascending: false });

    if (billNo) {
      query = query.eq('bill_no', billNo);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty array gracefully
      if (error.code === 'PGRST205' || error.message?.includes('not find')) {
        return NextResponse.json({ data: [], warning: 'Table stock_interests not yet created in Supabase' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new interest record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bill_no, date, interest_value, branch, notes } = body;

    if (!bill_no || !date || interest_value === undefined || interest_value === null || !branch) {
      return NextResponse.json({ error: 'Missing required fields: bill_no, date, interest_value, branch' }, { status: 400 });
    }

    const numericValue = parseFloat(interest_value);
    if (isNaN(numericValue)) {
      return NextResponse.json({ error: 'Invalid interest_value' }, { status: 400 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const payload = {
      bill_no: bill_no.trim(),
      date: date,
      interest_value: numericValue,
      branch: branch.trim().toUpperCase(),
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await adminSupabase
      .from('stock_interests')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove an interest record by ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing required param: id' }, { status: 400 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    const { error } = await adminSupabase
      .from('stock_interests')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Interest record deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
