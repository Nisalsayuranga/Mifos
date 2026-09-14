import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeBranchId } from '@/lib/branch-mapping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDEwMTU1OSwiZXhwIjoyMDk5Njc3NTU5fQ.F0KSjnVMl9Nz4fuXV3Z_fHBkQfCU8ieyPT0qJ2xLEMg';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { email, password, branch } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let loginEmail = String(email).trim();
    if (!loginEmail.includes('@')) {
      if (loginEmail.toLowerCase() === 'admin') {
        loginEmail = 'admin@gmail.com';
      } else {
        loginEmail = `${loginEmail.toLowerCase()}@gmail.com`;
      }
    }

    // Direct Supabase client for authentication
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await authSupabase.auth.signInWithPassword({
      email: loginEmail,
      password: String(password)
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Admin Supabase client to fetch profile safely
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    const role = profile?.role || authData.user.user_metadata?.role || (loginEmail.includes('admin') ? 'ADMIN' : 'TELLER');
    const effectiveBranch = normalizeBranchId(branch || profile?.branch_id || 'HQ');

    const token = authData.session?.access_token || '';

    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        branchId: effectiveBranch,
        branchName: profile?.branch_name || effectiveBranch
      },
      profile: profile || { role, branch_id: effectiveBranch },
      token: token
    });

    if (token) {
      response.cookies.set('sb-access-token', token, {
        path: '/',
        maxAge: 28800,
        sameSite: 'lax',
        httpOnly: false
      });
      response.cookies.set('auth_token', token, {
        path: '/',
        maxAge: 28800,
        sameSite: 'lax',
        httpOnly: false
      });
    }

    return response;
  } catch (err: any) {
    console.error('Server login exception:', err);
    return NextResponse.json(
      { error: err.message || 'Authentication server error' },
      { status: 500 }
    );
  }
}
