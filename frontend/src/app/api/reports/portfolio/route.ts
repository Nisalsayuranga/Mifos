import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || (session?.role === 'TELLER' ? session.branchId : 'ALL');

    let query = adminSupabase.from('pawns').select('disbursed_amount, appraised_value, status, branch_id');
    if (branchId !== 'ALL') {
      query = query.eq('branch_id', branchId);
    }

    const { data: pawns, error } = await query;
    if (error) throw error;

    const totalActiveLoans = (pawns || []).filter(p => p.status === 'ACTIVE').length;
    const activePortfolioValue = (pawns || []).filter(p => p.status === 'ACTIVE').reduce((sum, p) => sum + Number(p.disbursed_amount || 0), 0);
    const totalRedeemedLoans = (pawns || []).filter(p => p.status === 'REDEEMED').length;
    const totalAppraisedValue = (pawns || []).reduce((sum, p) => sum + Number(p.appraised_value || 0), 0);

    return NextResponse.json({
      totalActiveLoans,
      activePortfolioValue,
      totalRedeemedLoans,
      totalAppraisedValue,
      branchId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
