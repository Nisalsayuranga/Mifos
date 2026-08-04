const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:GCaXoI4kY7uwO2tb@db.zxsxxipvcchpqgttmzvi.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    
    const query = `
      ALTER TABLE public.daily_ledgers 
      ADD COLUMN IF NOT EXISTS transfer_in_type text,
      ADD COLUMN IF NOT EXISTS transfer_out_type text;
    `;
    
    await client.query(query);
    console.log("SQL executed successfully: Added transfer type columns.");
    
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await client.end();
  }
}

run();
