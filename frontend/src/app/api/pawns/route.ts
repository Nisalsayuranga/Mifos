import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const role = searchParams.get('role');
    const filterBranch = searchParams.get('filterBranch'); // Admin branch filter

    let query = supabase.from('pawns').select('*').order('created_at', { ascending: false });

    // Admin can filter by a specific branch, or see all
    if (role === 'ADMIN' && filterBranch && filterBranch !== 'ALL') {
      query = query.eq('branch_id', filterBranch);
    } else if (role !== 'ADMIN' && branchId) {
      // Tellers only see their own branch
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Pawns GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const body = await request.json();
    const { clientId, description, appraisedValue, disbursedAmount, branchId, createdByUserId } = body;

    if (!clientId || !description || !disbursedAmount || !branchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('pawns').insert([{
      id: crypto.randomUUID(),
      client_id: clientId,
      description,
      appraised_value: parseFloat(appraisedValue) || 0,
      disbursed_amount: parseFloat(disbursedAmount) || 0,
      branch_id: branchId,
      created_by_user_id: createdByUserId,
      status: 'PENDING_APPROVAL',
      created_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Pawns POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
