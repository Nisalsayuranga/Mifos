const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing inserting a pawn ticket...');
  const newPawnId = crypto.randomUUID();
  const { data, error } = await supabase.from('pawns').insert([{
    id: newPawnId,
    client_id: 'ee03da2c-2f74-4afa-be68-533efdb8dfaf',
    description: '3M TEST | 22k Gold Chain, Weight: 12g 500mg',
    appraised_value: 100000,
    disbursed_amount: 80000,
    branch_id: 'KHT',
    created_by_user_id: '3086d253-4c39-4b25-a119-073a93c12498',
    status: 'ACTIVE'
  }]).select().single();

  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('Insert SUCCEEDED! Record created:', data.id, data.description);
    // Cleanup test record
    await supabase.from('pawns').delete().eq('id', newPawnId);
    console.log('Cleaned up test record successfully!');
  }
}

testInsert();
