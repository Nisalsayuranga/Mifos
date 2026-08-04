const MAIN_URL = 'https://ielkaetihagxgnrrasch.supabase.co/rest/v1';
const MAIN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const OLD_URL = 'https://zxsxxipvcchpqgttmzvi.supabase.co/rest/v1';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiInp4c3h4aXB2Y2NocHFndHRtenZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc5NTE4MywiZXhwIjoyMTAwMzcxMTgzfQ.irz2Fn5P82SZ6EZMOpwAqGYandhWR4VIdNW6XTKuHn8';

async function query(url, key, endpoint) {
  const res = await fetch(`${url}/${endpoint}`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  if (!res.ok) return { error: await res.text() };
  return await res.json();
}

async function run() {
  console.log("=== Checking stock_items (bill_no ilike %20326%) ===");
  const s1 = await query(MAIN_URL, MAIN_KEY, 'stock_items?bill_no=ilike.*20326*');
  console.log("stock_items bill_no:", JSON.stringify(s1, null, 2));

  console.log("=== Checking rti_pawn_export (pawn_bill_no ilike %20326%) ===");
  const r1 = await query(OLD_URL, OLD_KEY, 'rti_pawn_export?pawn_bill_no=ilike.*20326*');
  console.log("rti_pawn_export pawn_bill_no:", JSON.stringify(r1, null, 2));

  console.log("=== Checking rti_pawn_export (pawn_detail_no ilike %20326%) ===");
  const r2 = await query(OLD_URL, OLD_KEY, 'rti_pawn_export?pawn_detail_no=ilike.*20326*');
  console.log("rti_pawn_export pawn_detail_no:", JSON.stringify(r2, null, 2));

  console.log("=== Checking Kiribathgoda (KIR) in rti_pawn_export with 20326 ===");
  const r3 = await query(OLD_URL, OLD_KEY, 'rti_pawn_export?branch_code=eq.KIR&or=(pawn_bill_no.ilike.*20326*,pawn_detail_no.ilike.*20326*)');
  console.log("Kiribathgoda 20326 in rti_pawn_export:", JSON.stringify(r3, null, 2));

  console.log("=== Checking daily_ledger_transactions (bill_no or redeem_no ilike %20326%) ===");
  const d1 = await query(MAIN_URL, MAIN_KEY, 'daily_ledger_transactions?or=(bill_no.ilike.*20326*,redeem_no.ilike.*20326*)');
  console.log("daily_ledger_transactions 20326:", JSON.stringify(d1, null, 2));
}

run();
