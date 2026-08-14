import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';
import { recordAuditLog } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedBranch = searchParams.get('branchId') || searchParams.get('filterBranch');

    let query = adminSupabase.from('pawns').select('*, clients(*), pawn_items(*)').order('created_at', { ascending: false });

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

    // Fetch clients manually if clients relation join returned null or missing
    const clientIds = Array.from(new Set((data || []).map((p: any) => p.client_id).filter(Boolean)));
    let clientsByIdMap: Record<string, any> = {};
    if (clientIds.length > 0) {
      const { data: clientRows } = await adminSupabase.from('clients').select('*').in('id', clientIds);
      if (clientRows) {
        clientRows.forEach(c => {
          clientsByIdMap[c.id] = c;
          if (c.nationalId) clientsByIdMap[c.nationalId] = c;
        });
      }
    }

    // Fetch pawn_items manually
    const pawnIds = data?.map(p => p.id) || [];
    let itemsMap: Record<string, any[]> = {};
    
    if (pawnIds.length > 0) {
      const { data: allItems } = await adminSupabase.from('pawn_items').select('*').in('pawn_id', pawnIds);
      if (allItems) {
         allItems.forEach(item => {
            if (!itemsMap[item.pawn_id]) itemsMap[item.pawn_id] = [];
            itemsMap[item.pawn_id].push(item);
         });
      }
    }

    const mappedData = (data || []).map((pawn: any) => {
       const pItems = itemsMap[pawn.id] || [];
       let totalWeight = 0;
       if (pItems.length > 0) {
           pItems.forEach((item: any) => {
               totalWeight += (parseFloat(item.weight_grams) || 0) + ((parseFloat(item.weight_mg) || 0) / 1000);
           });
       }
       pawn.weight = totalWeight;
       pawn.items = pItems;
       
       if (!pawn.clients && pawn.client_id && clientsByIdMap[pawn.client_id]) {
         pawn.clients = clientsByIdMap[pawn.client_id];
       }

       return pawn;
    });

    return NextResponse.json(mappedData);
  } catch (error: any) {
    console.error('Pawns GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const body = await request.json();
    const { clientId, clientName, customerName, description, appraisedValue, disbursedAmount, branchId, createdByUserId, billNo, weight, weightGrams, weightMg, interestRate, periodMonths, itemType, items } = body;

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
    let fullClientObj: any = null;

    if (!isUUID(clientId)) {
      const { data: existingClients } = await adminSupabase
        .from('clients')
        .select('*')
        .or(`national_id.eq.${clientId},id.eq.${clientId}`);

      if (existingClients && existingClients.length > 0) {
        targetClientId = existingClients[0].id;
        fullClientObj = existingClients[0];
      } else {
        const newClientId = crypto.randomUUID();
        const resolvedName = clientName || customerName || '';
        const { data: newClient, error: clientErr } = await adminSupabase.from('clients').insert([{
          id: newClientId,
          national_id: clientId,
          first_name: resolvedName,
          last_name: '',
          branch_id: targetBranchId,
          created_by_user_id: targetUserId,
          status: 'ACTIVE'
        }]).select().single();

        if (!clientErr && newClient) {
          targetClientId = newClient.id;
          fullClientObj = newClient;
        } else {
          targetClientId = newClientId;
          fullClientObj = { firstName: resolvedName, nationalId: clientId };
        }
      }
    } else {
      const { data: existingClient } = await adminSupabase.from('clients').select('*').eq('id', clientId).single();
      if (existingClient) fullClientObj = existingClient;
    }

    const pawnId = crypto.randomUUID();
    const computedWeightGrams = parseFloat(weightGrams || weight || '0') || 0;
    const computedWeightMg = parseFloat(weightMg || '0') || 0;

    const { data: pawnData, error: pawnError } = await adminSupabase.from('pawns').insert([{
      id: pawnId,
      client_id: targetClientId,
      bill_no: billNo ? String(billNo).trim() : null,
      description: description || 'Gold Collateral',
      appraised_value: parseFloat(appraisedValue) || 0,
      disbursed_amount: parseFloat(disbursedAmount) || 0,
      weight_grams: computedWeightGrams,
      weight_mg: computedWeightMg,
      interest_rate: parseFloat(interestRate) || 3.50,
      period_months: parseInt(periodMonths, 10) || 3,
      branch_id: targetBranchId,
      created_by_user_id: targetUserId,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }]).select().single();

    if (pawnError) {
      console.error("Pawns insert error:", pawnError);
      throw pawnError;
    }

    // 2. Insert itemized breakdown into pawn_items
    let insertedItems: any[] = [];
    if (Array.isArray(items) && items.length > 0) {
      const itemRows = items.map((it: any) => {
        let g = parseFloat(it.weightGrams);
        let mg = parseFloat(it.weightMg);
        if (isNaN(g) && isNaN(mg) && weight) {
          const totW = parseFloat(weight) || 0;
          g = Math.floor(totW);
          mg = Math.round((totW - g) * 1000);
        }
        return {
          pawn_id: pawnId,
          item_type: it.itemType || itemType || 'CH',
          description: it.description || description || 'Collateral Article',
          weight_grams: !isNaN(g) ? g : (parseFloat(weightGrams) || 0),
          weight_mg: !isNaN(mg) ? mg : (parseFloat(weightMg) || 0),
          appraised_value: parseFloat(it.appraisedValue) || parseFloat(appraisedValue) || 0
        };
      });
      const { data: itemRes } = await adminSupabase.from('pawn_items').insert(itemRows).select();
      if (itemRes) insertedItems = itemRes;
    } else {
      let g = parseFloat(weightGrams);
      let mg = parseFloat(weightMg);
      if (isNaN(g) && isNaN(mg) && weight) {
        const totW = parseFloat(weight) || 0;
        g = Math.floor(totW);
        mg = Math.round((totW - g) * 1000);
      }
      const singleRow = [{
        pawn_id: pawnId,
        item_type: itemType || 'CH',
        description: description || 'Collateral Article',
        weight_grams: !isNaN(g) ? g : 0,
        weight_mg: !isNaN(mg) ? mg : 0,
        appraised_value: parseFloat(appraisedValue) || 0
      }];
      const { data: itemRes } = await adminSupabase.from('pawn_items').insert(singleRow).select();
      if (itemRes) insertedItems = itemRes;
    }

    let computedWeight = 0;
    insertedItems.forEach((it: any) => {
      computedWeight += (parseFloat(it.weight_grams) || 0) + ((parseFloat(it.weight_mg) || 0) / 1000);
    });
    if (computedWeight === 0 && weight) {
      computedWeight = parseFloat(weight) || 0;
    }

    // 3. Automatically sync into stock_items table so it appears in Vault Stock
    if (billNo) {
      const today = new Date().toISOString().split('T')[0];
      if (Array.isArray(items) && items.length > 1) {
        const stockRows = items.map((it: any, idx: number) => {
          const g = parseFloat(it.weightGrams) || 0;
          const mg = parseFloat(it.weightMg) || 0;
          const totW = g + (mg / 1000);
          return {
            bill_no: `${billNo.trim()} (${idx + 1}/${items.length})`,
            price: parseFloat(it.appraisedValue) || 0,
            weight: totW,
            date: today,
            item_type: it.itemType || 'PAWN',
            status: 'Active',
            branch_id: targetBranchId
          };
        });
        await adminSupabase.from('stock_items').insert(stockRows);
      } else {
        await adminSupabase.from('stock_items').insert([{
          bill_no: billNo.trim(),
          price: parseFloat(appraisedValue) || parseFloat(disbursedAmount) || 0,
          weight: computedWeight,
          date: today,
          item_type: itemType || 'PAWN',
          status: 'Active',
          branch_id: targetBranchId
        }]);
      }
    }

    // 4. Record Audit Log
    recordAuditLog(session, {
      action: 'ORIGINATE_PAWN',
      resource: `Pawn Ticket #${pawnId.substring(0, 8)}`,
      branchId: targetBranchId,
      details: {
        pawnId,
        billNo,
        amount: disbursedAmount,
        appraised: appraisedValue,
        client: targetClientId,
        itemsCount: Array.isArray(items) ? items.length : 1
      }
    });

    return NextResponse.json({
      ...pawnData,
      weight: computedWeight,
      client_id: targetClientId,
      raw_client_uuid: targetClientId,
      items: insertedItems,
      clients: fullClientObj || {
        firstName: clientName || customerName || '',
        nationalId: isUUID(clientId) ? '' : clientId
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Pawns POST error:', error);
    return NextResponse.json({ error: error.message || 'Server error creating pawn ticket' }, { status: 500 });
  }
}

