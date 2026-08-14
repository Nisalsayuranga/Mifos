import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export async function PATCH(request: Request, context: any) {
  try {
    const session = await getAuthenticatedUser(request);
    const { id } = await context.params;
    const body = await request.json();
    const { clientId, description, appraisedValue, disbursedAmount, billNo, weight, weightGrams, weightMg, itemType, items, clientPhone, clientAddress } = body;

    // Fetch existing pawn to check branch authorization
    const { data: existingPawn, error: fetchErr } = await adminSupabase.from('pawns').select('*').eq('id', id).single();
    if (fetchErr || !existingPawn) {
      return NextResponse.json({ error: 'Pawn ticket not found' }, { status: 404 });
    }

    if (session && session.role === 'TELLER' && existingPawn.branch_id !== session.branchId) {
      return NextResponse.json({ error: 'Forbidden. Tellers cannot modify pawns belonging to another branch.' }, { status: 403 });
    }

    // Resolve valid Client UUID
    let targetClientId = clientId;
    if (clientId && !isUUID(clientId)) {
      const { data: existingClients } = await adminSupabase
        .from('clients')
        .select('id, phone, address')
        .or(`nationalId.eq.${clientId},id.eq.${clientId}`);

      if (existingClients && existingClients.length > 0) {
        targetClientId = existingClients[0].id;
        
        // Update client info if provided
        if (clientPhone || clientAddress) {
          const updateClient: any = {};
          if (clientPhone && clientPhone !== existingClients[0].phone) updateClient.phone = clientPhone;
          if (clientAddress && clientAddress !== existingClients[0].address) updateClient.address = clientAddress;
          
          if (Object.keys(updateClient).length > 0) {
            await adminSupabase.from('clients').update(updateClient).eq('id', targetClientId);
          }
        }
      }
    }

    // Calculate weight values
    let totWeight = parseFloat(weight) || 0;
    let g = parseFloat(weightGrams);
    let mg = parseFloat(weightMg);
    if (isNaN(g) && isNaN(mg) && totWeight > 0) {
      g = Math.floor(totWeight);
      mg = Math.round((totWeight - g) * 1000);
    }
    if (isNaN(g)) g = 0;
    if (isNaN(mg)) mg = 0;
    if (totWeight === 0 && (g > 0 || mg > 0)) {
      totWeight = g + (mg / 1000);
    }

    const updateObj: any = {};
    if (targetClientId && isUUID(targetClientId)) updateObj.client_id = targetClientId;
    if (description) updateObj.description = description;
    if (appraisedValue !== undefined) updateObj.appraised_value = parseFloat(appraisedValue) || 0;
    if (disbursedAmount !== undefined) updateObj.disbursed_amount = parseFloat(disbursedAmount) || 0;
    if (g > 0 || mg > 0 || totWeight > 0) {
      updateObj.weight_grams = g;
      updateObj.weight_mg = mg;
    }
    if (body.periodMonths !== undefined) {
      updateObj.period_months = parseInt(body.periodMonths, 10) || 3;
    }

    const { data, error } = await adminSupabase.from('pawns').update(updateObj).eq('id', id).select().single();

    if (error) throw error;

    if (billNo) {
      await adminSupabase.from('stock_items').update({
        price: parseFloat(appraisedValue) || parseFloat(disbursedAmount) || 0,
        weight: totWeight,
        item_type: itemType || 'PAWN'
      }).eq('bill_no', billNo.trim());
    }

    // Update or Insert pawn_items if weight or items are provided
    const { data: existingItems } = await adminSupabase.from('pawn_items').select('*').eq('pawn_id', id);
    if (existingItems && existingItems.length > 0) {
      await adminSupabase.from('pawn_items').update({
        weight_grams: g,
        weight_mg: mg,
        appraised_value: parseFloat(appraisedValue) || 0,
        description: description || existingItems[0].description
      }).eq('id', existingItems[0].id);
    } else {
      await adminSupabase.from('pawn_items').insert([{
        pawn_id: id,
        item_type: itemType || 'CH',
        description: description || 'Collateral Article',
        weight_grams: g,
        weight_mg: mg,
        appraised_value: parseFloat(appraisedValue) || 0
      }]);
    }

    return NextResponse.json({
       ...data,
       weight: totWeight
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getAuthenticatedUser(request);
    const { id } = await context.params;

    // Fetch pawn details first to verify branch authorization and description / bill_no
    const { data: pawn, error: fetchErr } = await adminSupabase.from('pawns').select('*').eq('id', id).single();
    if (fetchErr || !pawn) {
      return NextResponse.json({ error: 'Pawn ticket not found' }, { status: 404 });
    }

    if (session && session.role === 'TELLER' && pawn.branch_id !== session.branchId) {
      return NextResponse.json({ error: 'Forbidden. Tellers cannot delete pawns belonging to another branch.' }, { status: 403 });
    }

    const { error } = await adminSupabase.from('pawns').delete().eq('id', id);
    if (error) throw error;

    // Also delete from stock_items using stored bill_no or regex fallback
    const targetBillNo = pawn.bill_no || (pawn.description ? pawn.description.match(/^([A-Za-z0-9]+\s+\d+)/)?.[1]?.trim() : null);
    if (targetBillNo) {
      await adminSupabase.from('stock_items').delete().eq('bill_no', targetBillNo);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
