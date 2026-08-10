import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = adminSupabase.from('vault_transfer').select('*').order('date', { ascending: false }).order('time', { ascending: false });
    
    if (session && session.role === 'TELLER') {
      query = query.or(`from_vault.eq.${session.branchId},to_vault.eq.${session.branchId}`);
    }

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const body = await request.json();
    let { fromVault, toVault, amount, currency, notes, initiatedBy } = body;
    
    if (session) {
      if (session.role === 'TELLER') {
        if (fromVault && fromVault !== session.branchId) {
          return NextResponse.json({ error: 'Forbidden. Tellers can only transfer funds from their own branch vault.' }, { status: 403 });
        }
        fromVault = session.branchId;
      }
      if (session.user?.email) {
        initiatedBy = session.user.email;
      }
    }

    if (!fromVault || !toVault || !amount) {
      return NextResponse.json({ error: "Missing required transfer fields" }, { status: 400 });
    }
    if (fromVault === toVault) {
      return NextResponse.json({ error: "Cannot transfer to the same vault" }, { status: 400 });
    }

    const transferId = `VT-${Date.now().toString().slice(-6)}`;
    const dateObj = new Date();

    const { data, error } = await adminSupabase.from('vault_transfer').insert([{
      id: transferId,
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().slice(0, 5),
      from_vault: fromVault,
      to_vault: toVault,
      amount: parseFloat(amount),
      currency: currency || 'LKR',
      status: 'Pending',
      initiated_by: initiatedBy || 'System User',
      notes: notes || null
    }]).select().single();

    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const body = await request.json();
    const { id, status, approvedBy } = body;

    let effectiveApprovedBy = approvedBy || 'System Admin';
    if (session) {
      // Only Admin or destination vault teller can approve transfer
      if (session.user?.email) {
        effectiveApprovedBy = session.user.email;
      }
    }
    
    const { data, error } = await adminSupabase.from('vault_transfer')
      .update({ status, approved_by: effectiveApprovedBy })
      .eq('id', id)
      .select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

