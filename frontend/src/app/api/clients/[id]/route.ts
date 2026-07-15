import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Safe initialization to prevent build-time crashes
let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  try {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not initialized (Key missing during build)" }, { status: 500 });
    }
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('clients')
      .update({
        nationalId: body.nic,
        firstName: body.firstName,
        lastName: body.lastName || '.',
        phone: body.phone,
        address: body.address,
        nic_image: body.nicImage,
        signature_image: body.signatureImage,
        status: body.status || 'ACTIVE'
      })
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
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not initialized (Key missing during build)" }, { status: 500 });
    }
    const { id } = await context.params;
    const { error } = await supabase
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
