const MAIN_URL = 'https://ielkaetihagxgnrrasch.supabase.co/rest/v1';
const MAIN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

async function updateRecord() {
  const id = "e207415f-a161-442b-86de-02c5b5bab41b";
  
  const payload = {
    status: 'Active',
    withdrawal_date: null,
    withdrawal_reason: null,
    withdrawal_notes: null
  };

  console.log("Updating stock_items record:", id, payload);

  const res = await fetch(`${MAIN_URL}/stock_items?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': MAIN_KEY,
      'Authorization': `Bearer ${MAIN_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error("Failed to update:", await res.text());
    return;
  }

  const updated = await res.json();
  console.log("SUCCESS! Updated Record:", JSON.stringify(updated, null, 2));
}

updateRecord();
