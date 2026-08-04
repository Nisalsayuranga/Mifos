const MAIN_URL = 'https://ielkaetihagxgnrrasch.supabase.co/rest/v1';
const MAIN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

async function query(endpoint) {
  const res = await fetch(`${MAIN_URL}/${endpoint}`, {
    headers: {
      'apikey': MAIN_KEY,
      'Authorization': `Bearer ${MAIN_KEY}`
    }
  });
  if (!res.ok) return { error: await res.text() };
  return await res.json();
}

async function run() {
  console.log("=== Checking stock_items with Withdrawn status ===");
  const withdrawn = await query('stock_items?status=eq.Withdrawn&limit=200');
  console.log(`Found ${withdrawn.length} withdrawn items.`);
  
  console.log("=== Checking items with F/S in withdrawal_notes or withdrawal_reason ===");
  const fsItems = await query('stock_items?or=(withdrawal_notes.ilike.*F/S*,withdrawal_notes.ilike.*FS*,withdrawal_reason.ilike.*F/S*,withdrawal_reason.ilike.*FS*)');
  console.log("F/S items:", JSON.stringify(fsItems, null, 2));

  console.log("=== Checking items with 'Other' withdrawal_reason ===");
  const otherItems = await query('stock_items?withdrawal_reason=ilike.*Other*');
  console.log(`Found ${otherItems.length} items with 'Other' reason:`);
  console.log(JSON.stringify(otherItems, null, 2));
}

run();
