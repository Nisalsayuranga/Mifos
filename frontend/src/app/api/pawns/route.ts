import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

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
    } else if (role !== 'ADMIN' && branchId && branchId !== 'ALL') {
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
    const { clientId, description, appraisedValue, disbursedAmount, branchId, createdByUserId, billNo, weight, itemType } = body;

    if (!clientId || !disbursedAmount) {
      return NextResponse.json({ error: 'Missing required fields: Customer and Disbursed Amount' }, { status: 400 });
    }

    // 1. Resolve valid Client UUID
    let targetClientId = clientId;
    if (!isUUID(clientId)) {
      // Search client by nationalId / NIC
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .or(`nationalId.eq.${clientId},id.eq.${clientId}`);

      if (existingClients && existingClients.length > 0) {
        targetClientId = existingClients[0].id;
      } else {
        // Auto-create client if not found
        const newClientId = crypto.randomUUID();
        const effectiveBranch = (branchId && branchId !== 'ALL') ? branchId : 'HQ';
        const { data: newClient, error: clientErr } = await supabase.from('clients').insert([{
          id: newClientId,
          nationalId: clientId,
          firstName: clientId,
          lastName: '.',
          branchId: effectiveBranch,
          createdByUserId: '00000000-0000-0000-0000-000000000000',
          status: 'ACTIVE'
        }]).select().single();

        if (!clientErr && newClient) {
          targetClientId = newClient.id;
        } else {
          targetClientId = newClientId;
        }
      }
    }

    // 2. Resolve User UUID & Branch ID
    const targetUserId = isUUID(createdByUserId) ? createdByUserId : '00000000-0000-0000-0000-000000000000';
    const targetBranchId = (branchId && branchId !== 'ALL') ? branchId : 'HQ';
    const pawnId = crypto.randomUUID();

    const { data: pawnData, error: pawnError } = await supabase.from('pawns').insert([{
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

    // 3. Automatically sync into stock_items table so it appears in Vault Stock
    if (billNo) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('stock_items').insert([{
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
      client_id: clientId, // keep original NIC/ID for display
      raw_client_uuid: targetClientId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Pawns POST error:', error);
    return NextResponse.json({ error: error.message || 'Server error creating pawn ticket' }, { status: 500 });
  }
}
