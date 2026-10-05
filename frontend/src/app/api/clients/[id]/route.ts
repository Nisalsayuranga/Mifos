import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (body.phone) {
      const phoneDigits = String(body.phone).replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        return NextResponse.json({ error: "invalid mobile number" }, { status: 400 });
      }
    }

    const updatePayload: Record<string, any> = {};
    if (body.nic !== undefined || body.national_id !== undefined || body.nationalId !== undefined) {
      updatePayload.national_id = body.nic || body.national_id || body.nationalId;
    }
    if (body.firstName !== undefined || body.first_name !== undefined) {
      updatePayload.first_name = body.firstName || body.first_name;
    }
    if (body.lastName !== undefined || body.last_name !== undefined) {
      updatePayload.last_name = body.lastName || body.last_name;
    }
    if (body.phone !== undefined) {
      updatePayload.phone = body.phone;
    }
    if (body.address !== undefined) {
      updatePayload.address = body.address;
    }
    if (body.nicImage !== undefined || body.nic_image !== undefined) {
      updatePayload.nic_image = body.nicImage || body.nic_image;
    }
    if (body.signatureImage !== undefined || body.signature_image !== undefined) {
      updatePayload.signature_image = body.signatureImage || body.signature_image;
    }
    if (body.status !== undefined) {
      updatePayload.status = body.status;
    }

    const { data, error } = await adminSupabase
      .from('clients')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const { error } = await adminSupabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
