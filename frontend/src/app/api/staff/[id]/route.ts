import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

let supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const dynamic = 'force-dynamic';

// PATCH: Update user email, password, or profile details
export async function PATCH(request: Request, context: any) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { id } = await context.params;
    const { email, password, branchId, branchName, role } = await request.json();

    // 1. Update auth (email / password) if provided
    const authUpdates: any = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdates);
      if (authError) throw authError;
    }

    // 2. Update profile record
    const profileUpdates: any = {};
    if (email)      profileUpdates.email       = email;
    if (branchId)   profileUpdates.branch_id   = branchId;
    if (branchName) profileUpdates.branch_name = branchName;
    if (role)       profileUpdates.role        = role;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', id);
      if (profileError) throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Staff PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove user from auth and profiles
export async function DELETE(request: Request, context: any) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { id } = await context.params;

    // 1. Delete profile first (FK constraint)
    await supabase.from('profiles').delete().eq('id', id);

    // 2. Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
