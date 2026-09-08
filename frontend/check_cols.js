const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    const { data, error } = await supabase.from('clients').insert([{
      id: '00000000-0000-0000-0000-000000000000',
      nationalId: '12345',
      firstName: 'Test',
      lastName: 'User',
      phone: '123',
      branchId: 'HQ',
      createdByUserId: '00000000-0000-0000-0000-000000000000',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      address: 'Test Address',
      nic_image: 'base64',
      signature_image: 'base64'
    }]).select();
    
    console.log("DATA:", data);
    console.log("ERROR:", error);

    // Clean up if it succeeded
    if (data && data.length > 0) {
      await supabase.from('clients').delete().eq('id', '00000000-0000-0000-0000-000000000000');
      console.log("Cleaned up successfully!");
    }
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

testInsert();
