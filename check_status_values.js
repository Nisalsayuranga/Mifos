const MAIN_URL = 'https://ielkaetihagxgnrrasch.supabase.co/rest/v1';
const MAIN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

async function query(endpoint) {
  const res = await fetch(`${MAIN_URL}/${endpoint}`, {
    headers: {
      'apikey': MAIN_KEY,
      'Authorization': `Bearer ${MAIN_KEY}`
    }
  });
  return await res.json();
}

async function run() {
  const sample = await query('stock_items?select=status&limit=100');
  const statuses = [...new Set(sample.map(s => s.status))];
  console.log("Distinct statuses in stock_items:", statuses);
}

run();
