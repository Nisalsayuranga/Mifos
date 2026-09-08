const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates() {
  console.log('--- CLEANING DUPLICATE TEST CLIENT RECORDS IN SUPABASE ---');

  // Fetch all clients
  const { data: clients } = await supabase.from('clients').select('*').order('createdAt', { ascending: true });

  const seenNics = new Set();
  const duplicateIdsToDelete = [];

  (clients || []).forEach(c => {
    const nicKey = String(c.nationalId || c.national_id || '').trim();
    if (!nicKey) return;

    if (seenNics.has(nicKey)) {
      duplicateIdsToDelete.push(c.id);
    } else {
      seenNics.add(nicKey);
    }
  });

  console.log(`Found ${duplicateIdsToDelete.length} duplicate client records to clean:`, duplicateIdsToDelete);

  for (const id of duplicateIdsToDelete) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) console.error(`Error deleting duplicate ${id}:`, error.message);
    else console.log(`Deleted duplicate client ID: ${id}`);
  }

  console.log('--- DUPLICATE CLEANUP COMPLETED SUCCESSFULLY ---');
}

cleanDuplicates();
