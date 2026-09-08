import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const requestedBranch = searchParams.get('branchId');
    const filterAction = searchParams.get('action');

    let query = adminSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);

    if (session) {
      if (session.role === 'TELLER') {
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

    if (filterAction && filterAction !== 'ALL') {
      query = query.ilike('action', `%${filterAction}%`);
    }

    const { data, error } = await query;
    if (error) {
      // Return empty array if audit_logs table is created fresh
      return NextResponse.json([]);
    }
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Audit Logs GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
