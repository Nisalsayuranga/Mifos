const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCustomer() {
  console.log('--- INSPECTING CUSTOMER 953323460V ---');
  const { data: clients } = await supabase.from('clients').select('*').or('nationalId.eq.953323460V,national_id.eq.953323460V,nationalId.ilike.%953323460V%');
  console.log('Found clients for 953323460V:', JSON.stringify(clients, null, 2));

  const { data: allClients } = await supabase.from('clients').select('id, nationalId, firstName, branchId');
  console.log('\nAll Clients in DB:', JSON.stringify(allClients, null, 2));
}

inspectCustomer();
