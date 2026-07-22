'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [expiredAlert, setExpiredAlert] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setExpiredAlert(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        throw new Error(signInError?.message || 'Invalid branch credentials');
      }

      // Fetch Profile for the logged-in user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.warn("Profile fetch failed. Check RLS policies:", profileError.message);
      }

      localStorage.setItem('auth_token', data.session?.access_token || '');
      localStorage.setItem('user', JSON.stringify({ 
        email: data.user.email, 
        id: data.user.id,
        role: profile?.role || 'TELLER',
        branchId: profile?.branch_id || 'HQ',
        branchName: profile?.branch_name || 'Head Office'
      }));
      window.location.href = '/'; 
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <Shield className="h-16 w-16 text-blue-600 mb-4" />
          <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">Rupasinghe Pawning</h2>
          <p className="mt-2 text-center text-sm text-slate-500 font-bold">Teller & Admin Secure Portal</p>
        </div>

        <Card className="mt-8 bg-white border-slate-200 shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-100 border-b border-slate-200 pb-6">
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription className="font-medium text-slate-600">Enter your branch email and assigned password.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {expiredAlert && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3 font-semibold mb-4 text-center animate-in fade-in">
                Your session has expired due to 10 minutes of inactivity. Please log in again.
              </div>
            )}
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <Label className="block text-sm font-bold text-slate-700">Email Address</Label>
                <div className="mt-2">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="branch.brl@rupasinghe.com"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-bold text-slate-700">Password</Label>
                <div className="mt-2">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md font-bold text-sm">
                  {error}
                </div>
              )}

              <div>
                <Button type="submit" className="w-full font-bold bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
