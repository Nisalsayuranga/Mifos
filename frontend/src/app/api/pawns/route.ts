import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedBranch = searchParams.get('branchId') || searchParams.get('filterBranch');

    let query = adminSupabase.from('pawns').select('*').order('created_at', { ascending: false });

    if (session) {
      if (session.role === 'TELLER') {
        if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== session.branchId) {
          return NextResponse.json({ error: 'Forbidden. Access to other branch pawn records is denied.' }, { status: 403 });
        }
        query = query.eq('branch_id', session.branchId);
      } else if (session.role === 'ADMIN') {
        if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== 'HQ') {
          query = query.eq('branch_id', requestedBranch);
        }
      }
    } else {
      if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== 'HQ') {
        query = query.eq('branch_id', requestedBranch);
      }
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
    const session = await getAuthenticatedUser(request);
    const body = await request.json();
    const { clientId, description, appraisedValue, disbursedAmount, branchId, createdByUserId, billNo, weight, itemType } = body;

    if (!clientId || !disbursedAmount) {
      return NextResponse.json({ error: 'Missing required fields: Customer and Disbursed Amount' }, { status: 400 });
    }

    // Determine target branch & user ID from session if available
    let targetBranchId = branchId || 'HQ';
    let targetUserId = isUUID(createdByUserId) ? createdByUserId : '00000000-0000-0000-0000-000000000000';

    if (session) {
      if (session.role === 'TELLER') {
        if (branchId && branchId !== session.branchId) {
          return NextResponse.json({ error: 'Forbidden. You cannot create pawn tickets for another branch.' }, { status: 403 });
        }
        targetBranchId = session.branchId;
      }
      targetUserId = session.user.id;
    }

    // 1. Resolve valid Client UUID
    let targetClientId = clientId;
    if (!isUUID(clientId)) {
      const { data: existingClients } = await adminSupabase
        .from('clients')
        .select('*')
        .or(`nationalId.eq.${clientId},id.eq.${clientId}`);

      if (existingClients && existingClients.length > 0) {
        targetClientId = existingClients[0].id;
      } else {
        const newClientId = crypto.randomUUID();
        const { data: newClient, error: clientErr } = await adminSupabase.from('clients').insert([{
          id: newClientId,
          nationalId: clientId,
          firstName: clientId,
          lastName: '.',
          branchId: targetBranchId,
          createdByUserId: targetUserId,
          status: 'ACTIVE'
        }]).select().single();

        if (!clientErr && newClient) {
          targetClientId = newClient.id;
        } else {
          targetClientId = newClientId;
        }
      }
    }

    const pawnId = crypto.randomUUID();

    const { data: pawnData, error: pawnError } = await adminSupabase.from('pawns').insert([{
      id: pawnId,
      client_id: targetClientId,
      description: description || 'Gold Collateral',
      appraised_value: parseFloat(appraisedValue) || 0,
      disbursed_amount: parseFloat(disbursedAmount) || 0,
      branch_id: targetBranchId,
      created_by_user_id: targetUserId,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }]).select().single();

    if (pawnError) {
      console.error("Pawns insert error:", pawnError);
      throw pawnError;
    }

    // Automatically sync into stock_items table so it appears in Vault Stock
    if (billNo) {
      const today = new Date().toISOString().split('T')[0];
      await adminSupabase.from('stock_items').insert([{
        bill_no: billNo.trim(),
        price: parseFloat(appraisedValue) || parseFloat(disbursedAmount) || 0,
        weight: parseFloat(weight) || 0,
        date: today,
        item_type: itemType || 'PAWN',
        status: 'Active',
        branch_id: targetBranchId
      }]);
    }

    return NextResponse.json({
      ...pawnData,
      client_id: clientId,
      raw_client_uuid: targetClientId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Pawns POST error:', error);
    return NextResponse.json({ error: error.message || 'Server error creating pawn ticket' }, { status: 500 });
  }
}

