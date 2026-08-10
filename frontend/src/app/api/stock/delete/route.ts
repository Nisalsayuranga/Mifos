import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser(req);
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    if (session && session.role === 'TELLER') {
      const { data: item } = await adminSupabase.from('stock_items').select('branch_id').eq('id', id).single();
      if (item && item.branch_id !== session.branchId) {
        return NextResponse.json({ error: 'Forbidden. Tellers cannot delete stock items belonging to another branch.' }, { status: 403 });
      }
    }

    const { data, error } = await adminSupabase
      .from('stock_items')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
