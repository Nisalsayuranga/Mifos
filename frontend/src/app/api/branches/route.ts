import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';

let supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      // If table doesn't exist yet, return a helpful error or empty list
      console.error('Branches GET error:', error);
      return NextResponse.json({ error: 'Branches table not found. Please run the migration script.', details: error.message }, { status: 404 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Branches GET failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { name, id } = await request.json();
    console.log('[DEBUG] POST /api/branches started:', { name, id });

    if (!name || !id) {
      console.log('[DEBUG] POST /api/branches missing name or id');
      return NextResponse.json({ error: 'Missing name or id' }, { status: 400 });
    }

    console.log('[DEBUG] POST /api/branches inserting into branches table...');
    const { data, error } = await supabase
      .from('branches')
      .insert([{
        id: id.toUpperCase(),
        name,
        created_at: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();

    if (error) {
       console.error('[DEBUG] POST /api/branches insert error:', error);
       throw error;
    }
    
    console.log('[DEBUG] POST /api/branches upserting into branch_status...');
    await supabase.from('branch_status').upsert({
      branch_id: id.toUpperCase(),
      status: 'CLOSED',
      updated_at: new Date().toISOString()
    });

    console.log('[DEBUG] POST /api/branches finished successfully');
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Branches POST failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
