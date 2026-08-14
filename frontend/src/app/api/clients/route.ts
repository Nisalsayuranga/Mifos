import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedBranch = searchParams.get('branchId');

    let query = adminSupabase.from('clients').select('*');

    if (session) {
      if (session.role === 'TELLER') {
        if (requestedBranch && requestedBranch !== session.branchId) {
          return NextResponse.json({ error: 'Forbidden. Access to other branch records is denied.' }, { status: 403 });
        }
        query = query.or(`branch_id.eq.${session.branchId},branchId.eq.${session.branchId}`);
      } else if (session.role === 'ADMIN') {
        if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== 'HQ') {
          query = query.or(`branch_id.eq.${requestedBranch},branchId.eq.${requestedBranch}`);
        }
      }
    } else {
      if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== 'HQ') {
        query = query.or(`branch_id.eq.${requestedBranch},branchId.eq.${requestedBranch}`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const body = await request.json();
    const { nic, firstName, lastName, phone, branchId, createdByUserId, address, nicImage, signatureImage } = body;

    if (!nic || !firstName) {
      return NextResponse.json({ error: "Missing required fields (nic, firstName)" }, { status: 400 });
    }

    let effectiveBranchId = branchId || 'HQ';
    let effectiveUserId = session?.user?.id || (isUUID(createdByUserId) ? createdByUserId : null);

    // If effectiveUserId is missing or invalid, resolve valid user ID from profiles
    if (!effectiveUserId) {
      const { data: profileRow } = await adminSupabase.from('profiles').select('id').limit(1).maybeSingle();
      if (profileRow?.id) {
        effectiveUserId = profileRow.id;
      }
    }

    if (session && session.role === 'TELLER') {
      if (branchId && branchId !== session.branchId) {
        return NextResponse.json({ error: 'Forbidden. You cannot create clients for another branch.' }, { status: 403 });
      }
      effectiveBranchId = session.branchId;
    }

    const clientId = crypto.randomUUID();

    // 1. Try snake_case insert (Migration 003 standard)
    const snakePayload: any = {
      id: clientId,
      national_id: nic,
      first_name: firstName,
      last_name: lastName || '.',
      phone: phone || null,
      branch_id: effectiveBranchId,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      address: address || null,
      nic_image: nicImage || null,
      signature_image: signatureImage || null
    };
    if (effectiveUserId) {
      snakePayload.created_by_user_id = effectiveUserId;
    }

    const { data: snakeData, error: snakeErr } = await adminSupabase
      .from('clients')
      .insert([snakePayload])
      .select()
      .single();

    if (!snakeErr && snakeData) {
      return NextResponse.json(snakeData, { status: 201 });
    }

    // 2. Fallback to camelCase insert if database migration is pending
    const camelPayload: any = {
      id: clientId,
      nationalId: nic,
      firstName: firstName,
      lastName: lastName || '.',
      phone: phone || null,
      branchId: effectiveBranchId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      address: address || null,
      nic_image: nicImage || null,
      signature_image: signatureImage || null
    };
    if (effectiveUserId) {
      camelPayload.createdByUserId = effectiveUserId;
    }

    const { data: camelData, error: camelErr } = await adminSupabase
      .from('clients')
      .insert([camelPayload])
      .select()
      .single();

    if (camelErr) {
      console.error("Clients POST error (snake & camel failed):", snakeErr, camelErr);
      throw camelErr;
    }

    return NextResponse.json(camelData, { status: 201 });
  } catch (error: any) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to save customer' }, { status: 500 });
  }
}
