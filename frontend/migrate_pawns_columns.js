const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ielkaetihagxgnrrasch:0f0eylZnHFJz8rVp@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

async function migrate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to live Supabase Postgres ielkaetihagxgnrrasch!');

    await client.query(`
      ALTER TABLE public.pawns 
      ADD COLUMN IF NOT EXISTS weight text,
      ADD COLUMN IF NOT EXISTS weight_grams numeric,
      ADD COLUMN IF NOT EXISTS weight_mg numeric;
    `);

    console.log('SUCCESSFULLY ADDED weight, weight_grams, and weight_mg columns to live pawns table!');
  } catch (err) {
    console.error('Postgres error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
