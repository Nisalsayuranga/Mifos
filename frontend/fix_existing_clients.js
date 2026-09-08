const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('--- CLEANING UP CLIENT RECORDS IN SUPABASE ---');

  // Update client ee03da2c
  const { error: e1 } = await supabase
    .from('clients')
    .update({ firstName: '', lastName: '' })
    .eq('id', 'ee03da2c-2f74-4afa-be68-533efdb8dfaf');
  if (e1) console.error('Err e1:', e1.message);
  else console.log('Cleaned client ee03da2c');

  // Update client 56d59d8e
  const { error: e2 } = await supabase
    .from('clients')
    .update({ firstName: '', lastName: '' })
    .eq('id', '56d59d8e-3389-4f6c-a1fb-bb7594d0f198');
  if (e2) console.error('Err e2:', e2.message);
  else console.log('Cleaned client 56d59d8e');

  // Update any other clients where firstName equals nationalId or lastName equals '.'
  const { data: allC } = await supabase.from('clients').select('*');
  for (const c of (allC || [])) {
    if (c.firstName === c.nationalId || c.lastName === '.') {
      console.log('Cleaning client:', c.id, c.nationalId);
      await supabase.from('clients').update({
        firstName: (c.firstName === c.nationalId) ? '' : c.firstName,
        lastName: (c.lastName === '.') ? '' : c.lastName
      }).eq('id', c.id);
    }
  }

  console.log('--- CLEANUP FINISHED SUCCESSFULLY ---');
}

fix();
