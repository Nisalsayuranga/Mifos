import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverSchema() {
    const tables = ['profiles', 'clients', 'branch_status', 'transaction'];
    for (const table of tables) {
        console.log(`--- Schema for ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table} might not exist or: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`Columns for ${table}:`, Object.keys(data[0]));
        } else {
            // Try to get columns even if empty
            const { data: cols, error: colError } = await supabase.rpc('get_columns', { table_name: table });
            if (colError) {
                console.log(`Could not get columns for ${table}.`);
            } else {
                console.log(`Columns for ${table}:`, cols);
            }
        }
    }
}

discoverSchema();
