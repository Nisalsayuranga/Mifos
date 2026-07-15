import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase.from('vault_transfer').select('*').order('date', { ascending: false }).order('time', { ascending: false });
    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.fromVault || !body.toVault || !body.amount) {
      return NextResponse.json({ error: "Missing required transfer fields" }, { status: 400 });
    }
    if (body.fromVault === body.toVault) {
      return NextResponse.json({ error: "Cannot transfer to the same vault" }, { status: 400 });
    }

    const transferId = `VT-${Date.now().toString().slice(-6)}`;
    const dateObj = new Date();

    const { data, error } = await supabase.from('vault_transfer').insert([{
      id: transferId,
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().slice(0, 5),
      from_vault: body.fromVault,
      to_vault: body.toVault,
      amount: parseFloat(body.amount),
      currency: body.currency,
      status: 'Pending', // All transfers start as pending for dual-approval
      initiated_by: body.initiatedBy || 'System User',
      notes: body.notes
    }]).select().single();

    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, approvedBy } = body;
    
    const { data, error } = await supabase.from('vault_transfer')
      .update({ status, approved_by: approvedBy })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
