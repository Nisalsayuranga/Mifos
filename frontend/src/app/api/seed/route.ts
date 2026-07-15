import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export const dynamic = 'force-dynamic';

// All 11 branches
const branchData = [
  { name: "Borella",      id: "BRL", email: "branch.brl@rupasinghe.com", password: "Borella123" },
  { name: "Kotikawatta",  id: "KOT", email: "branch.kot@rupasinghe.com", password: "Kotikawatta123" },
  { name: "Dematagoda",   id: "DMT", email: "branch.dmt@rupasinghe.com", password: "Dematagoda123" },
  { name: "Wattala",      id: "WAT", email: "branch.wat@rupasinghe.com", password: "Wattala123" },
  { name: "Kiribathgoda", id: "KIR", email: "branch.kir@rupasinghe.com", password: "Kiribathgoda123" },
  { name: "Kadawatha",    id: "KDW", email: "branch.kdw@rupasinghe.com", password: "Kadawatha123" },
  { name: "Dehiwala",     id: "DHW", email: "branch.dhw@rupasinghe.com", password: "Dehiwala123" },
  { name: "Panadura",     id: "PND", email: "branch.pnd@rupasinghe.com", password: "Panadura123" },
  { name: "Kottawa",      id: "KTW", email: "branch.ktw@rupasinghe.com", password: "Kottawa123" },
  { name: "Homagama",     id: "HMG", email: "branch.hmg@rupasinghe.com", password: "Homagama123" },
];

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not initialized (Key missing during build)" }, { status: 500 });
    }
    const results: any[] = [];
    const { data: authUsersResponse } = await supabase.auth.admin.listUsers();
    const authUsers = authUsersResponse?.users || [];

    // 1. Ensure Admin Profile (uses snake_case columns)
    const adminUser = authUsers.find((u: any) => u.email === 'admin@rupasinghe.com');
    if (adminUser) {
      await supabase.from('profiles').upsert({
        id: adminUser.id,
        email: adminUser.email,
        branch_id: 'HQ',
        branch_name: 'Head Office',
        role: 'ADMIN'
      });
      results.push({ email: 'admin@rupasinghe.com', status: 'Admin Profile Set' });
    }

    // 2. Process Branches
    for (const branch of branchData) {
      const existingUser = authUsers.find((u: any) => u.email === branch.email);
      let userId = existingUser?.id;

      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: branch.email,
          password: branch.password,
          email_confirm: true
        });
        
        if (createError) {
          results.push({ email: branch.email, status: 'Error Creating User', error: createError.message });
          continue;
        }
        userId = newUser.user.id;
      }

      // Upsert Profile (snake_case columns)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: branch.email,
        branch_id: branch.id,
        branch_name: branch.name,
        role: 'TELLER'
      });

      // Initial Branch Status (snake_case columns)
      await supabase.from('branch_status').upsert({
        branch_id: branch.id,
        status: 'CLOSED',
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id' });

      results.push({ 
        email: branch.email, 
        status: existingUser ? 'Profile Updated' : 'User/Profile Created',
        profileError: profileError?.message
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
