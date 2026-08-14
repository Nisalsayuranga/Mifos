import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

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
    let effectiveUserId = createdByUserId || '00000000-0000-0000-0000-000000000000';

    if (session) {
      if (session.role === 'TELLER') {
        if (branchId && branchId !== session.branchId) {
          return NextResponse.json({ error: 'Forbidden. You cannot create clients for another branch.' }, { status: 403 });
        }
        effectiveBranchId = session.branchId;
      }
      effectiveUserId = session.user.id;
    }

    const clientId = crypto.randomUUID();

    // 1. Try snake_case insert (Migration 003 standard)
    const { data: snakeData, error: snakeErr } = await adminSupabase.from('clients').insert([{
      id: clientId,
      national_id: nic,
      first_name: firstName,
      last_name: lastName || '.',
      phone: phone,
      branch_id: effectiveBranchId,
      created_by_user_id: effectiveUserId,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      address: address || null,
      nic_image: nicImage || null,
      signature_image: signatureImage || null
    }]).select().single();

    if (!snakeErr && snakeData) {
      return NextResponse.json(snakeData, { status: 201 });
    }

    // 2. Fallback to camelCase insert if database migration is pending
    const { data: camelData, error: camelErr } = await adminSupabase.from('clients').insert([{
      id: clientId,
      nationalId: nic,
      firstName: firstName,
      lastName: lastName || '.',
      phone: phone,
      branchId: effectiveBranchId,
      createdByUserId: effectiveUserId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      address: address || null,
      nic_image: nicImage || null,
      signature_image: signatureImage || null
    }]).select().single();

    if (camelErr) throw camelErr;
    return NextResponse.json(camelData, { status: 201 });
  } catch (error: any) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

