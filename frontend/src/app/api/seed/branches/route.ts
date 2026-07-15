import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export const dynamic = 'force-dynamic';

const INITIAL_BRANCHES = [
  { id: 'BRL', name: 'Borella' },
  { id: 'DHW', name: 'Dehiwala' },
  { id: 'DMT', name: 'Dematagoda' },
  { id: 'HMG', name: 'Homagama' },
  { id: 'KDW', name: 'Kadawatha' },
  { id: 'KIR', name: 'Kiribathgoda' },
  { id: 'KOT', name: 'Kotikawatta' },
  { id: 'KTW', name: 'Kottawa' },
  { id: 'MRG', name: 'Maharagama' },
  { id: 'PND', name: 'Panadura' },
  { id: 'WAT', name: 'Wattala' },
  { id: 'HQ',  name: 'Head Office' },
];

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const results = [];
    for (const branch of INITIAL_BRANCHES) {
      const { data, error } = await supabase
        .from('branches')
        .upsert({
          id: branch.id,
          name: branch.name,
          created_at: new Date().toISOString(),
          is_active: true
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        results.push({ id: branch.id, status: 'error', error: error.message });
      } else {
        results.push({ id: branch.id, status: 'success' });
      }
    }

    return NextResponse.json({ 
      message: 'Migration attempt finished.', 
      results,
      sqlNeeded: `CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
