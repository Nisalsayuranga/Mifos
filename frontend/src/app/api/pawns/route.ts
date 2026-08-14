import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';
import { recordAuditLog } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
const HARDCODED_FALLBACK_USER_ID = '1423f690-f46a-455d-bc25-a778d2bd9e47';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const filterBranch = searchParams.get('filterBranch');
    const branchIdParam = searchParams.get('branchId');
    const requestedBranch = (filterBranch && filterBranch !== '') ? filterBranch : branchIdParam;

    let query = adminSupabase.from('pawns').select('*').order('created_at', { ascending: false });

    if (session) {
      if (session.role === 'TELLER') {
        // Teller is restricted to their assigned branch
        query = query.eq('branch_id', session.branchId);
      } else if (session.role === 'ADMIN') {
        if (requestedBranch && requestedBranch !== 'ALL') {
          query = query.eq('branch_id', requestedBranch);
        }
      }
    } else {
      if (requestedBranch && requestedBranch !== 'ALL') {
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
          if (c.national_id) clientsByIdMap[c.national_id] = c;
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
       let totalWeight = (parseFloat(pawn.weight_grams) || 0) + ((parseFloat(pawn.weight_mg) || 0) / 1000);
       if (totalWeight === 0 && pItems.length > 0) {
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
    const { clientId, clientName, customerName, phone: clientPhone, address: clientAddress, description, appraisedValue, disbursedAmount, branchId, createdByUserId, billNo, weight, weightGrams, weightMg, interestRate, periodMonths, itemType, items } = body;

    if (!clientId || !disbursedAmount) {
      return NextResponse.json({ error: 'Missing required fields: Customer and Disbursed Amount' }, { status: 400 });
    }

    // Determine target branch & user ID from session if available
    let targetBranchId = branchId || 'HQ';
    let targetUserId = session?.user?.id || (isUUID(createdByUserId) ? createdByUserId : HARDCODED_FALLBACK_USER_ID);

    if (session) {
      if (session.role === 'TELLER') {
        if (branchId && branchId !== session.branchId) {
          return NextResponse.json({ error: 'Forbidden. You cannot create pawn tickets for another branch.' }, { status: 403 });
        }
        targetBranchId = session.branchId;
      }
    }

    // 1. Resolve valid Client UUID
    let targetClientId = clientId;
    let fullClientObj: any = null;

    if (!isUUID(clientId)) {
      const { data: existingClients } = await adminSupabase
        .from('clients')
        .select('*')
        .or(`national_id.eq.${clientId},nationalId.eq.${clientId},id.eq.${clientId}`);

      if (existingClients && existingClients.length > 0) {
        targetClientId = existingClients[0].id;
        fullClientObj = existingClients[0];
        
        // Update client info if provided
        if (clientPhone || clientAddress) {
          const updateClient: any = {};
          if (clientPhone && clientPhone !== fullClientObj.phone) updateClient.phone = clientPhone;
          if (clientAddress && clientAddress !== fullClientObj.address) updateClient.address = clientAddress;
          
          if (Object.keys(updateClient).length > 0) {
            const { data: updatedClient, error: updateErr } = await adminSupabase
              .from('clients')
              .update(updateClient)
              .eq('id', targetClientId)
              .select()
              .single();
            if (updatedClient && !updateErr) {
              fullClientObj = updatedClient;
            }
          }
        }
      } else {
        // Auto-create client profile if missing
        const newClientId = crypto.randomUUID();
        const clientPayload = {
          id: newClientId,
          nationalId: clientId,
          firstName: clientName || customerName || 'Valued Customer',
          lastName: '.',
          phone: clientPhone || null,
          address: clientAddress || null,
          branchId: targetBranchId,
          createdByUserId: targetUserId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };
        const { data: createdClient, error: createErr } = await adminSupabase.from('clients').insert([clientPayload]).select().single();
        if (!createErr && createdClient) {
          targetClientId = createdClient.id;
          fullClientObj = createdClient;
        } else {
          console.error("Auto-client creation failed:", createErr);
        }
      }
    }

    const pawnId = crypto.randomUUID();
    const finalDisbursed = parseFloat(disbursedAmount) || 0;
    const finalAppraised = parseFloat(appraisedValue) || finalDisbursed;
    const finalWeightGrams = parseFloat(weightGrams) || parseFloat(weight) || 0;
    const finalWeightMg = parseFloat(weightMg) || 0;
    const finalInterestRate = parseFloat(interestRate) || 3.50;
    const finalPeriodMonths = parseInt(periodMonths, 10) || 3;

    // 2. Insert pawn ticket into DB
    const pawnPayload: any = {
      id: pawnId,
      client_id: targetClientId,
      description: description || `${finalPeriodMonths}M Pawn Ticket`,
      appraised_value: finalAppraised,
      disbursed_amount: finalDisbursed,
      branch_id: targetBranchId,
      created_by_user_id: targetUserId,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      bill_no: billNo || null,
      weight_grams: finalWeightGrams,
      weight_mg: finalWeightMg,
      interest_rate: finalInterestRate,
      period_months: finalPeriodMonths
    };

    const { data: newPawn, error: pawnErr } = await adminSupabase
      .from('pawns')
      .insert([pawnPayload])
      .select()
      .single();

    if (pawnErr) throw pawnErr;

    // 3. Insert pawn collateral items into pawn_items table if provided
    if (Array.isArray(items) && items.length > 0) {
      const pawnItemsPayload = items.map((item: any) => ({
        id: crypto.randomUUID(),
        pawn_id: pawnId,
        item_type: item.item_type || itemType || 'Gold',
        purity: item.purity || '22K',
        weight_grams: parseFloat(item.weight_grams) || 0,
        weight_mg: parseFloat(item.weight_mg) || 0,
        appraised_value: parseFloat(item.appraised_value) || 0,
        description: item.description || ''
      }));
      await adminSupabase.from('pawn_items').insert(pawnItemsPayload);
    }

    // 4. Create matching vault stock item
    await adminSupabase.from('stock_items').insert([{
      id: crypto.randomUUID(),
      pawn_id: pawnId,
      branch_id: targetBranchId,
      item_name: description || 'Pawned Gold Collateral',
      weight_grams: finalWeightGrams + (finalWeightMg / 1000),
      appraised_value: finalAppraised,
      status: 'VAULT_STORED',
      created_at: new Date().toISOString()
    }]);

    await recordAuditLog(session, {
      action: 'ORIGINATE_PAWN',
      resource: 'pawns',
      branchId: targetBranchId,
      userId: targetUserId,
      details: { pawnId, disbursedAmount: finalDisbursed, billNo, clientId: targetClientId }
    });

    // Attach client details to response
    if (fullClientObj) {
      newPawn.clients = fullClientObj;
    }

    return NextResponse.json(newPawn, { status: 201 });
  } catch (error: any) {
    console.error('Pawns POST Exception:', error);
    return NextResponse.json({ error: error.message || 'Failed to create pawn ticket' }, { status: 500 });
  }
}
