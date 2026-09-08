const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres.zxsxxipvcchpqgttmzvi:0f0eylZnHFJz8rVp@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    
    // Check if table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_ledgers'
      );
    `;
    const checkRes = await client.query(checkQuery);
    const tableExists = checkRes.rows[0].exists;

    if (!tableExists) {
      console.error("Error: The table 'daily_ledgers' DOES NOT EXIST in this database.");
      return;
    }

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
