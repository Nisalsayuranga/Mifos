const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  console.log('--- ADDING DEDICATED WEIGHT COLUMNS TO PAWNS TABLE ---');

  // Check if RPC or SQL query can add columns or test inserting weight_grams and weight_mg
  const sql = `
    ALTER TABLE pawns ADD COLUMN IF NOT EXISTS weight numeric;
    ALTER TABLE pawns ADD COLUMN IF NOT EXISTS weight_grams numeric;
    ALTER TABLE pawns ADD COLUMN IF NOT EXISTS weight_mg numeric;
  `;

  // Use Supabase rpc or direct test query
  try {
    const res = await supabase.rpc('exec_sql', { sql_query: sql });
    console.log('RPC exec_sql result:', res);
  } catch (err) {
    console.log('RPC exec_sql not available, testing column presence via update');
  }

  // Verify by attempting a dummy select
  const { data, error } = await supabase.from('pawns').select('*').limit(1);
  if (data && data[0]) {
    console.log('Columns after schema update:', Object.keys(data[0]));
  }
}

addColumns();
