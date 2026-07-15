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

// GET: List all users from profiles + auth
export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Get all auth users so we can show their emails
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authUsers = authData?.users || [];

    // Merge profiles with auth user emails
    const merged = (profiles || []).map((profile: any) => {
      const authUser = authUsers.find((u: any) => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || profile.email || '',
        lastSignIn: authUser?.last_sign_in_at || null,
        createdAt: authUser?.created_at || profile.created_at,
      };
    });

    return NextResponse.json(merged);
  } catch (error: any) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new user + profile
export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Supabase not initialized' }, { status: 500 });

    const { email, password, branchId, branchName, role } = await request.json();
    console.log('[DEBUG] POST /api/staff started:', { email, branchId, branchName, role });

    if (!email || !password || !branchId || !branchName) {
      console.log('[DEBUG] POST /api/staff missing fields');
      return NextResponse.json({ error: 'Missing required fields: email, password, branchId, branchName' }, { status: 400 });
    }

    // 1. Create the Supabase auth user
    console.log('[DEBUG] POST /api/staff creating auth user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so they can login immediately
    });

    if (createError) {
      console.error('[DEBUG] POST /api/staff auth creation error:', createError);
      throw createError;
    }

    if (!newUser.user) {
       console.error('[DEBUG] POST /api/staff auth user created but newUser.user is null');
       throw new Error('Auth user creation failed (no user object returned)');
    }

    // 2. Create the profile record
    console.log('[DEBUG] POST /api/staff creating profile record for user:', newUser.user.id);
    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUser.user.id,
      email,
      branch_id: branchId,
      branch_name: branchName,
      role: role || 'TELLER',
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('[DEBUG] POST /api/staff profile creation error:', profileError);
      throw profileError;
    }

    console.log('[DEBUG] POST /api/staff finished successfully');
    return NextResponse.json({ success: true, userId: newUser.user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
