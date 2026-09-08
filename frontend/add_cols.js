const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.zxsxxipvcchpqgttmzvi:0f0eylZnHFJz8rVp@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres'
});
async function run() {
  await client.connect();
  console.log('Connected.');
  try {
    await client.query(`
      ALTER TABLE public.daily_ledger_transactions
      ADD COLUMN redeem_no text,
      ADD COLUMN type_ir text,
      ADD COLUMN quantity text;
    `);
    console.log('Columns added successfully.');
  } catch (err) {
    console.error('Error adding columns', err.message);
  } finally {
    await client.end();
  }
}
run();
