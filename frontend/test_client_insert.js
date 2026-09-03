const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFix() {
  console.log('--- TESTING CLIENT INSERTION WITH CREATED_BY_USER_ID ---');
  
  // Fetch existing profile ID
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const validUserId = profiles && profiles.length > 0 ? profiles[0].id : '00000000-0000-0000-0000-000000000000';
  console.log('Using valid profile ID:', validUserId);

  const { data: d3, error: e3 } = await supabase.from('clients').insert([{
    id: crypto.randomUUID(),
    nationalId: '777777777V',
    firstName: 'Test Customer Fixed',
    lastName: '.',
    phone: '0779998887',
    branchId: 'HQ',
    createdByUserId: validUserId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }]).select();

  console.log('Insertion with valid createdByUserId result:', { data: d3, error: e3 });
}

testFix();
