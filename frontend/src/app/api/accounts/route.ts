import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminSupabase } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = adminSupabase.from('account').select('*').order('opened_date', { ascending: false });
    if (type && type !== 'All') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    const body = await request.json();
    
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accountId = `ACC-${Date.now().toString().slice(-6)}`;

    const { data, error } = await adminSupabase.from('account').insert([{
      id: accountId,
      name: body.name,
      type: body.type,
      balance: parseFloat(body.balance) || 0,
      interest_rate: parseFloat(body.interestRate) || 0,
      status: 'Active',
      opened_date: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
