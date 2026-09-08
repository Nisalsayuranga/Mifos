const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectClients() {
  console.log('--- INSPECTING ALL CLIENT RECORDS IN SUPABASE DATABASE ---');
  const { data: clients, error } = await supabase.from('clients').select('*');
  
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Total Client Records in Supabase: ${clients ? clients.length : 0}`);
  (clients || []).forEach((c, idx) => {
    console.log(`[Record ${idx + 1}] ID: ${c.id}`);
    console.log(`  Name: ${c.firstName || c.first_name || 'N/A'}`);
    console.log(`  NIC: ${c.nationalId || c.national_id || 'N/A'}`);
    console.log(`  Branch: ${c.branchId || c.branch_id || 'N/A'}`);
    console.log(`  Created By: ${c.createdByUserId || c.created_by_user_id || 'N/A'}`);
    console.log(`  Created At: ${c.createdAt || c.created_at || 'N/A'}`);
    console.log('---');
  });
}

inspectClients();
