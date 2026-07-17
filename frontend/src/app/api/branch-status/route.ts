import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';

let supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
    }
    const { data, error } = await supabase
      .from('branch_status')
      .select('*');
    
    if (error) throw error;

    // Convert to a mapping: { BRL: 'OPEN', KOT: 'CLOSED' }
    // DB uses snake_case: branch_id
    const statusMap = data.reduce((acc: any, curr: any) => {
      acc[curr.branch_id] = curr.status;
      return acc;
    }, {});

    return NextResponse.json(statusMap);
  } catch (error: any) {
    console.error("Branch status GET failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { branchId, status } = await request.json();

    if (!branchId || !status) {
      return NextResponse.json({ error: "Missing branchId or status" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
    }

    // DB uses snake_case columns
    const { data, error } = await supabase
      .from('branch_status')
      .upsert({
        branch_id: branchId,
        status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id' })
      .select()
      .single();

    if (error) {
      console.error("Supabase toggle error:", error);
      throw error;
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Branch toggle API failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
