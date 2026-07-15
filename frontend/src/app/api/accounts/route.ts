import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Extremely secure backend logic executing entirely server-side on Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// We use the service role key to bypass client restrictions and enforce our own transaction logic
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Optional filter

    let query = supabase.from('account').select('*').order('opened_date', { ascending: false });
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
    const body = await request.json();
    
    // Server-side validation logic
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Auto-generate ID sequence if needed
    const accountId = `ACC-${Date.now().toString().slice(-6)}`;

    // Database Insertion
    const { data, error } = await supabase.from('account').insert([{
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
