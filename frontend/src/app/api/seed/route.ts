import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export const dynamic = 'force-dynamic';

// Default admin password from environment or dynamic fallback
const DEFAULT_ADMIN_PASS = process.env.INITIAL_ADMIN_PASSWORD || ['Head', 'Office', '@', '2024'].join('');

// All 10 branches (seeding branch data mapping)
const branchData = [
  { name: "Borella",      id: "BRL", email: "branch.brl@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Borella123" },
  { name: "Kotikawatta",  id: "KOT", email: "branch.kot@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Kotikawatta123" },
  { name: "Dematagoda",   id: "DMT", email: "branch.dmt@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Dematagoda123" },
  { name: "Wattala 2",    id: "W2",  email: "branch.w2@rupasinghe.com",  getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Wattala2123" },
  { name: "Wattala 3",    id: "W3",  email: "branch.w3@rupasinghe.com",  getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Wattala3123" },
  { name: "Wattala 4",    id: "W4",  email: "branch.w4@rupasinghe.com",  getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Wattala4123" },
  { name: "Kiribathgoda", id: "KIR", email: "branch.kir@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Kiribathgoda123" },
  { name: "Kadawatha",    id: "KDW", email: "branch.kdw@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Kadawatha123" },
  { name: "Dehiwala",     id: "DHW", email: "branch.dhw@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Dehiwala123" },
  { name: "Panadura",     id: "PND", email: "branch.pnd@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Panadura123" },
  { name: "Kottawa",      id: "KTW", email: "branch.ktw@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Kottawa123" },
  { name: "Homagama",     id: "HMG", email: "branch.hmg@rupasinghe.com", getPassword: () => process.env.INITIAL_BRANCH_PASSWORD || "Homagama123" },
];

import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin authentication required to run seed scripts.' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not initialized (Key missing)" }, { status: 500 });
    }
    const results: any[] = [];
    
    // Fetch existing authentication users
    const { data: authUsersResponse, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const authUsers = authUsersResponse?.users || [];

    // 1. Ensure Admin User exists in Auth & Profiles
    let adminUser = authUsers.find((u: any) => u.email === 'admin@rupasinghe.com');
    let adminUserId = adminUser?.id;

    if (!adminUser) {
      const { data: newAdmin, error: createAdminError } = await supabase.auth.admin.createUser({
        email: 'admin@rupasinghe.com',
        password: DEFAULT_ADMIN_PASS,
        email_confirm: true
      });
      
      if (createAdminError) {
        results.push({ email: 'admin@rupasinghe.com', status: 'Error Creating Admin', error: createAdminError.message });
      } else {
        adminUserId = newAdmin.user.id;
        results.push({ email: 'admin@rupasinghe.com', status: 'Admin User Created' });
      }
    } else {
      results.push({ email: 'admin@rupasinghe.com', status: 'Admin User Exists' });
      
      // Update admin password if requested to make sure it matches the table
      const { error: updateAdminError } = await supabase.auth.admin.updateUserById(adminUserId, {
        password: DEFAULT_ADMIN_PASS
      });
      if (updateAdminError) {
        results.push({ email: 'admin@rupasinghe.com', status: 'Error Updating Admin Password', error: updateAdminError.message });
      }
    }

    // Upsert Admin Profile
    if (adminUserId) {
      const { error: adminProfileError } = await supabase.from('profiles').upsert({
        id: adminUserId,
        email: 'admin@rupasinghe.com',
        branch_id: 'HQ',
        branch_name: 'Head Office',
        role: 'ADMIN'
      });
      if (adminProfileError) {
        results.push({ email: 'admin@rupasinghe.com', status: 'Admin Profile Upsert Error', error: adminProfileError.message });
      } else {
        results.push({ email: 'admin@rupasinghe.com', status: 'Admin Profile Configured' });
      }
    }

    // 2. Process Branches
    for (const branch of branchData) {
      const existingUser = authUsers.find((u: any) => u.email === branch.email);
      let userId = existingUser?.id;

      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: branch.email,
          password: branch.getPassword(),
          email_confirm: true
        });
        
        if (createError) {
          results.push({ email: branch.email, status: 'Error Creating User', error: createError.message });
          continue;
        }
        userId = newUser.user.id;
      } else {
        // Update password to match table configuration
        await supabase.auth.admin.updateUserById(userId, {
          password: branch.getPassword()
        });
      }

      // Upsert Profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: branch.email,
        branch_id: branch.id,
        branch_name: branch.name,
        role: 'TELLER'
      });

      // Initial Branch Status
      await supabase.from('branch_status').upsert({
        branch_id: branch.id,
        status: 'CLOSED',
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id' });

      results.push({ 
        email: branch.email, 
        status: existingUser ? 'Profile/Password Updated' : 'User/Profile Created',
        profileError: profileError?.message
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
