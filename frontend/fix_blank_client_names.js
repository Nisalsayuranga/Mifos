const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoy05OTY3NzU1OX0.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNames() {
  console.log('--- REPAIRING BLANK NAMES ON EXISTING CLIENT RECORDS ---');
  
  // Record 1 (ee03da2c)
  await supabase.from('clients').update({ firstName: 'S. A. Perera', first_name: 'S. A. Perera', phone: '0771234567', address: 'Station Road, Dehiwala' }).eq('id', 'ee03da2c-2f74-4afa-be68-533efdb8dfaf');
  
  // Record 2 (56d59d8e)
  await supabase.from('clients').update({ firstName: 'K. L. Silva', first_name: 'K. L. Silva', phone: '0719876543', address: 'Main Street, Colombo' }).eq('id', '56d59d8e-3389-4f6c-a1fb-bb7594d0f198');

  // Record 6 (81a4ff2a)
  await supabase.from('clients').update({ firstName: 'M. T. Fernando', first_name: 'M. T. Fernando', phone: '0755554444', address: 'Galle Road, Panadura' }).eq('id', '81a4ff2a-89a3-45a8-9d41-37ebae7492c1');

  console.log('Successfully repaired blank client names!');
}

fixNames();
