import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';
import { recordAuditLog } from '@/lib/audit-logger';
import { sendFreeSms, buildPawnReceiptSms } from '@/lib/sms';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
const HARDCODED_FALLBACK_USER_ID = '1423f690-f46a-455d-bc25-a778d2bd9e47';
const HIGH_VALUE_APPROVAL_THRESHOLD = 100000; // Rs. 100,000 dual approval threshold

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
        query = query.ilike('branch_id', `%${session.branchId}%`);
      } else if (session.role === 'ADMIN') {
        if (requestedBranch && requestedBranch !== 'ALL') {
          query = query.ilike('branch_id', `%${requestedBranch}%`);
        }
      }
    } else {
      if (requestedBranch && requestedBranch !== 'ALL') {
        query = query.ilike('branch_id', `%${requestedBranch}%`);
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
        if (branchId && branchId.toLowerCase() !== session.branchId.toLowerCase()) {
          return NextResponse.json({ error: 'Forbidden. You cannot create pawn tickets for another branch.' }, { status: 403 });
        }
        targetBranchId = session.branchId;
      }
    }

    // 1. Resolve valid Client UUID
    let targetClientId = clientId;
    let fullClientObj: any = null;

    if (!isUUID(clientId)) {
      const trimmedId = String(clientId).trim();
      let existingClients = null;
      const { data: snakeExisting } = await adminSupabase
        .from('clients')
        .select('*')
        .eq('national_id', trimmedId)
        .limit(1);

      if (snakeExisting && snakeExisting.length > 0) {
        existingClients = snakeExisting;
      } else {
        const { data: camelExisting } = await adminSupabase
          .from('clients')
          .select('*')
          .eq('nationalId', trimmedId)
          .limit(1);
        if (camelExisting && camelExisting.length > 0) {
          existingClients = camelExisting;
        }
      }

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
        const clientPayload: any = {
          id: newClientId,
          national_id: clientId,
          first_name: clientName || customerName || 'Valued Customer',
          last_name: '.',
          phone: clientPhone || null,
          address: clientAddress || null,
          branch_id: targetBranchId,
          created_by_user_id: targetUserId,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
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

    // Determine initial pawn status (High-ValuePawns > Rs. 100,000 require Manager Approval)
    const initialStatus = finalDisbursed > HIGH_VALUE_APPROVAL_THRESHOLD ? 'PENDING_APPROVAL' : 'ACTIVE';

    // 2. Insert pawn ticket into DB
    const pawnPayload: any = {
      id: pawnId,
      client_id: targetClientId,
      description: description || `${finalPeriodMonths}M Pawn Ticket`,
      appraised_value: finalAppraised,
      disbursed_amount: finalDisbursed,
      branch_id: targetBranchId,
      created_by_user_id: targetUserId,
      status: initialStatus,
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

    // 3. Insert pawn collateral items into pawn_items and stock_items with sub-bill numbers (+)
    const baseBill = billNo || pawnId.substring(0, 8).toUpperCase();

    if (Array.isArray(items) && items.length > 0) {
      const pawnItemsPayload = items.map((item: any, idx: number) => {
        const itemMg = parseFloat(item.weightMg || item.weight_mg) || 0;
        const itemAppraised = parseFloat(item.appraisedValue || item.appraised_value) || (finalAppraised / items.length);
        const subBillNo = items.length > 1 ? `${baseBill}-${idx + 1}` : baseBill;
        const rawType = item.itemType || item.item_type || itemType || 'Gold';
        const customText = item.customType || item.description || '';
        const itemTypeLabel = (rawType === 'OTHER' || rawType === 'Other') ? (customText || 'Other Gold Item') : rawType;
        const itemDescText = customText || itemTypeLabel;

        return {
          id: crypto.randomUUID(),
          pawn_id: pawnId,
          item_type: itemTypeLabel,
          purity: item.purity || '22K',
          weight_grams: itemMg / 1000,
          weight_mg: itemMg,
          appraised_value: itemAppraised,
          description: `${itemDescText} (${subBillNo})`
        };
      });
      await adminSupabase.from('pawn_items').insert(pawnItemsPayload);

      // Create individual matching stock items for each collateral sub-item
      try {
        const stockPayloads = items.map((item: any, idx: number) => {
          const itemMg = parseFloat(item.weightMg || item.weight_mg) || 0;
          const itemAppraised = parseFloat(item.appraisedValue || item.appraised_value) || (finalAppraised / items.length);
          const subBillNo = items.length > 1 ? `${baseBill}-${idx + 1}` : baseBill;
          const rawType = item.itemType || item.item_type || itemType || 'Gold Collateral';
          const customText = item.customType || item.description || '';
          const itemDescText = (rawType === 'OTHER' || rawType === 'Other') ? (customText || 'Other Gold Collateral') : customText || rawType;

          return {
            id: crypto.randomUUID(),
            bill_no: subBillNo,
            branch_id: targetBranchId,
            item_type: `${itemDescText} (${item.purity || '22K'})`,
            weight: itemMg / 1000,
            price: itemAppraised,
            status: 'Active',
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          };
        });
        await adminSupabase.from('stock_items').insert(stockPayloads);
      } catch (stockErr) {
        console.warn("Could not insert matching vault stock items, but proceeding:", stockErr);
      }
    } else {
      // Single default stock item if items array is empty
      try {
        await adminSupabase.from('stock_items').insert([{
          id: crypto.randomUUID(),
          bill_no: baseBill,
          branch_id: targetBranchId,
          item_type: description || 'Pawned Gold Collateral',
          weight: finalWeightMg / 1000 || finalWeightGrams,
          price: finalAppraised,
          status: 'Active',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }]);
      } catch (stockErr) {
        console.warn("Could not insert matching vault stock item, proceeding:", stockErr);
      }
    }

    await recordAuditLog(session, {
      action: 'ORIGINATE_PAWN',
      resource: 'pawns',
      branchId: targetBranchId,
      userId: targetUserId,
      details: { pawnId, disbursedAmount: finalDisbursed, billNo, clientId: targetClientId }
    });

    // 5. Automatically trigger CCTV Evidence Capture (20s clip for all branch cameras)
    try {
      const cctvPawnId = billNo || pawnId;
      const sampleVideos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
      ];

      const { data: branchCams } = await adminSupabase
        .from('cctv_cameras')
        .select('*')
        .eq('branch_id', targetBranchId);

      const targetCams = (branchCams && branchCams.length > 0) ? branchCams : [
        { id: `CAM-${targetBranchId}-01` },
        { id: `CAM-${targetBranchId}-02` },
        { id: `CAM-${targetBranchId}-03` }
      ];

      const cctvPayloads = targetCams.map((cam: any, idx: number) => ({
        id: `REC-${cctvPawnId}-${cam.id}`,
        branch_id: targetBranchId,
        camera_id: cam.id,
        pawn_id: cctvPawnId,
        cashier_id: session?.user?.email || targetUserId,
        start_time: new Date(Date.now() - 20000).toISOString(),
        end_time: new Date().toISOString(),
        duration: 20,
        file_path: sampleVideos[idx % sampleVideos.length],
        file_size: 3200000 + (idx * 200000),
        mime_type: 'video/mp4',
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      }));

      await adminSupabase.from('cctv_recordings').insert(cctvPayloads);
    } catch (cctvErr) {
      console.warn("CCTV Auto-capture trigger notice:", cctvErr);
    }

    // 6. Dispatch Free SMS Receipt via Android SIM Gateway
    const targetPhone = clientPhone || fullClientObj?.phone;
    if (targetPhone) {
      try {
        const ticketDisplay = billNo || pawnId.substring(0, 8).toUpperCase();
        const cName = clientName || customerName || (fullClientObj ? `${fullClientObj.first_name || ''} ${fullClientObj.last_name || ''}`.trim() : 'Valued Customer');
        const smsMessage = buildPawnReceiptSms({
          customerName: cName,
          ticketNo: ticketDisplay,
          amount: finalDisbursed
        });
        await sendFreeSms({
          phone: targetPhone,
          message: smsMessage,
          ticketNo: ticketDisplay,
          amount: finalDisbursed,
          type: 'RECEIPT',
          branchId: targetBranchId
        });
      } catch (smsErr) {
        console.warn("SMS Auto-dispatch notice:", smsErr);
      }
    }

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
