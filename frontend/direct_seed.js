const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const branchData = [
  { name: "Borella",      id: "BRL", email: "branch.brl@rupasinghe.com", password: "Borella123" },
  { name: "Kotikawatta",  id: "KOT", email: "branch.kot@rupasinghe.com", password: "Kotikawatta123" },
  { name: "Dematagoda",   id: "DMT", email: "branch.dmt@rupasinghe.com", password: "Dematagoda123" },
  { name: "Wattala 2",    id: "W2",  email: "branch.w2@rupasinghe.com",  password: "Wattala2123" },
  { name: "Wattala 3",    id: "W3",  email: "branch.w3@rupasinghe.com",  password: "Wattala3123" },
  { name: "Wattala 4",    id: "W4",  email: "branch.w4@rupasinghe.com",  password: "Wattala4123" },
  { name: "Kiribathgoda", id: "KIR", email: "branch.kir@rupasinghe.com", password: "Kiribathgoda123" },
  { name: "Kadawatha",    id: "KDW", email: "branch.kdw@rupasinghe.com", password: "Kadawatha123" },
  { name: "Dehiwala",     id: "DHW", email: "branch.dhw@rupasinghe.com", password: "Dehiwala123" },
  { name: "Panadura",     id: "PND", email: "branch.pnd@rupasinghe.com", password: "Panadura123" },
  { name: "Kottawa",      id: "KTW", email: "branch.ktw@rupasinghe.com", password: "Kottawa123" },
  { name: "Homagama",     id: "HMG", email: "branch.hmg@rupasinghe.com", password: "Homagama123" },
];

async function seed() {
  console.log("Starting direct seeding...");
  
  // 1. Fetch auth users
  const { data: authUsersResponse, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }
  const authUsers = authUsersResponse.users || [];
  console.log(`Successfully fetched ${authUsers.length} existing auth users.`);
  
  // 2. Ensure Admin User
  let adminUser = authUsers.find(u => u.email === 'admin@rupasinghe.com');
  let adminUserId;
  if (!adminUser) {
    console.log("Creating Admin User...");
    const { data: newAdmin, error: createAdminError } = await supabase.auth.admin.createUser({
      email: 'admin@rupasinghe.com',
      password: 'HeadOffice@2024',
      email_confirm: true
    });
    if (createAdminError) {
      console.error("Error creating admin:", createAdminError.message);
    } else {
      adminUserId = newAdmin.user.id;
      console.log("Admin User Created:", adminUserId);
    }
  } else {
    adminUserId = adminUser.id;
    console.log("Admin User Exists:", adminUserId);
    // Update admin password
    const { error: updateAdminError } = await supabase.auth.admin.updateUserById(adminUserId, {
      password: 'HeadOffice@2024'
    });
    if (updateAdminError) {
      console.error("Error updating admin password:", updateAdminError.message);
    } else {
      console.log("Admin password updated successfully");
    }
  }
  
  if (adminUserId) {
    const { error: adminProfileError } = await supabase.from('profiles').upsert({
      id: adminUserId,
      email: 'admin@rupasinghe.com',
      branch_id: 'HQ',
      branch_name: 'Head Office',
      role: 'ADMIN'
    });
    if (adminProfileError) {
      console.error("Error upserting admin profile:", adminProfileError.message);
    } else {
      console.log("Admin profile set up successfully");
    }
  }
  
  // 3. Ensure Branch Users
  for (const branch of branchData) {
    let existingUser = authUsers.find(u => u.email === branch.email);
    let userId;
    if (!existingUser) {
      console.log(`Creating user for ${branch.name}...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: branch.email,
        password: branch.password,
        email_confirm: true
      });
      if (createError) {
        console.error(`Error creating user for ${branch.name}:`, createError.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`User created for ${branch.name}:`, userId);
    } else {
      userId = existingUser.id;
      console.log(`User exists for ${branch.name}:`, userId);
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: branch.password
      });
      if (updateError) {
        console.error(`Error updating password for ${branch.name}:`, updateError.message);
      } else {
        console.log(`Password updated for ${branch.name}`);
      }
    }
    
    // Upsert Profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: branch.email,
      branch_id: branch.id,
      branch_name: branch.name,
      role: 'TELLER'
    });
    if (profileError) {
      console.error(`Error upserting profile for ${branch.name}:`, profileError.message);
    } else {
      console.log(`Profile configured for ${branch.name}`);
    }
    
    // Initial Branch Status
    const { error: statusError } = await supabase.from('branch_status').upsert({
      branch_id: branch.id,
      status: 'CLOSED',
      updated_at: new Date().toISOString()
    }, { onConflict: 'branch_id' });
    if (statusError) {
      console.error(`Error setting status for ${branch.name}:`, statusError.message);
    } else {
      console.log(`Branch status set to CLOSED for ${branch.name}`);
    }
  }
  
  console.log("Direct seeding complete!");
}

seed();
