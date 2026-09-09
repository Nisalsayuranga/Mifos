'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown, Building2, ShieldCheck, User, Phone, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BRANCHES = [
  { id: 'HQ',   name: 'Head Office' },
  { id: 'PAN',  name: 'Panadura' },
  { id: 'DEM',  name: 'Demotagoda' },
  { id: 'WAT4', name: 'Waththala 4' },
  { id: 'BOR',  name: 'Borella' },
  { id: 'KAD',  name: 'Kadawatta' },
  { id: 'KAH',  name: 'Kahathutuwa' },
  { id: 'KOT',  name: 'Kottawa' },
  { id: 'WAT3', name: 'Waththala 3' },
  { id: 'KIR2', name: 'Kiribathgoda 2' },
  { id: 'KIR1', name: 'Kiribathgoda 1' },
  { id: 'HOM',  name: 'Homagama' },
];

export default function LoginPage() {
  /* ── shared ── */
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'update-password'>('login');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState('');

  /* ── login ── */
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [branch, setBranch]       = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [expiredAlert, setExpiredAlert] = useState(false);

  /* ── register ── */
  const [rUsername, setRUsername]       = useState('');
  const [rEmail, setREmail]             = useState('');
  const [rMobile, setRMobile]           = useState('');
  const [rPassword, setRPassword]       = useState('');
  const [rConfirm, setRConfirm]         = useState('');
  const [showRPw, setShowRPw]           = useState(false);
  const [showRCPw, setShowRCPw]         = useState(false);

  /* ── reset ── */
  const [resetEmail, setResetEmail]     = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [showNewPw, setShowNewPw]       = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('expired') === 'true') setExpiredAlert(true);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMode('update-password');
          setSuccess('Verification successful! Please enter your new password.');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  /* switch mode — clear errors */
  const [tempSuccess, setTempSuccess] = useState('');
  const switchMode = (m: 'login' | 'register' | 'reset' | 'update-password') => {
    setMode(m);
    setError('');
    // Keep success if switching to login after reset/register
    if (m === 'login' && tempSuccess) {
      setSuccess(tempSuccess);
      setTempSuccess('');
    } else {
      setSuccess('');
    }
  };

  /* ── RESET PASSWORD (Send Link) ── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    try {
      let loginEmail = resetEmail.trim();
      if (!loginEmail.includes('@')) loginEmail = `${loginEmail.toLowerCase()}@rupasinghe.com`;

      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setSuccess('Verification link sent! Please check your email inbox to proceed.');
      setResetEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── UPDATE PASSWORD (After Link) ── */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (newPassword !== rConfirm) {
      return setError('Passwords do not match.');
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      return setError('New password must be at least 8 characters, include a lowercase & uppercase letter, a number, and a symbol.');
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      const successMsg = 'Password updated successfully! You can now sign in.';
      setTempSuccess(successMsg);
      await supabase.auth.signOut();
      
      setNewPassword('');
      setRConfirm('');
      switchMode('login');
      setSuccess(successMsg);
    } catch (err: any) {
      setError(err.message);
      await supabase.auth.signOut(); // clean up session
    } finally {
      setLoading(false);
    }
  };

  /* ── LOGIN ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) loginEmail = `${loginEmail.toLowerCase()}@rupasinghe.com`;

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError || !data.user) throw new Error(signInError?.message || 'Invalid credentials');

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      const tok = data.session?.access_token || '';
      localStorage.setItem('auth_token', tok);
      document.cookie = `sb-access-token=${tok}; path=/; max-age=28800; SameSite=Lax`;
      localStorage.setItem('user', JSON.stringify({
        email: data.user.email, id: data.user.id,
        role: profile?.role || 'TELLER',
        branchId: branch || profile?.branch_id || 'HQ',
        branchName: BRANCHES.find(b => b.id === branch)?.name || profile?.branch_name || 'Head Office',
      }));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── REGISTER ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!rUsername.trim()) return setError('Username is required.');
    if (!/^\+?[\d\s\-]{7,15}$/.test(rMobile)) return setError('Enter a valid mobile number.');
    if (rPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (rPassword !== rConfirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: rEmail.trim(),
        password: rPassword,
        options: {
          data: { username: rUsername.trim(), mobile: rMobile.trim() },
        },
      });
      if (signUpError) throw new Error(signUpError.message);
      setSuccess('Account created! Please check your email to confirm your account, then sign in.');
      /* clear register fields */
      setRUsername(''); setREmail(''); setRMobile('');
      setRPassword(''); setRConfirm('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedBranch = BRANCHES.find(b => b.id === branch);

  /* ─────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          height: 100%;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          background: #1a1a1a;
        }

        /* ────────── ROOT ────────── */
        .root {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        /* ═════════════════════════════
           LEFT PANEL
        ═════════════════════════════ */
        .left {
          flex: 0 0 50%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(160deg, #2a2a2a 0%, #1f1f1f 55%, #141414 100%);
          position: relative;
          overflow: hidden;
        }
        .left::before {
          content: '';
          position: absolute; top: -120px; right: -120px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(251,191,36,.15) 0%, transparent 65%);
          border-radius: 50%; pointer-events: none;
        }
        .left::after {
          content: '';
          position: absolute; bottom: -100px; left: -80px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(255,235,59,.12) 0%, transparent 65%);
          border-radius: 50%; pointer-events: none;
        }

        /* ── Top bar ── */
        .topbar {
          padding: 24px 52px;
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          flex-shrink: 0;
        }
        .topbar-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, rgba(251,191,36,.3), rgba(255,235,59,.15));
          border: 1px solid rgba(255,235,59,.3);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(251,191,36,.2);
        }
        .topbar-name  { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: .2px; }
        .topbar-tag   { display: block; font-size: 12px; font-weight: 500; color: rgba(251,191,36,.65); letter-spacing: 1px; text-transform: uppercase; }

        /* ── Scrollable form area ── */
        .form-area {
          flex: 1;
          overflow-y: auto;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 40px 52px;
          position: relative; z-index: 2;
        }
        .form-area::-webkit-scrollbar { width: 4px; }
        .form-area::-webkit-scrollbar-track { background: transparent; }
        .form-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }

        .form-card {
          width: 100%; max-width: 520px;
          padding: 8px 0 32px;
          animation: slide-up .4s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Back Button ── */
        .back-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          color: rgba(255,255,255,.7); cursor: pointer;
          margin-bottom: 24px;
          transition: background .15s, color .15s, transform .15s;
        }
        .back-btn:hover {
          background: rgba(251,191,36,.15); color: #fde047; border-color: rgba(251,191,36,.3);
          transform: translateX(-2px);
        }

        /* ── Heading ── */
        .heading { margin-bottom: 32px; }
        .heading-title {
          font-size: 48px; font-weight: 800;
          color: #fff; letter-spacing: -.7px; line-height: 1.1; margin-bottom: 12px;
        }
        .heading-sub { font-size: 18px; color: rgba(255,255,255,.45); line-height: 1.5; }
        .heading-sub a {
          color: #fbbf24; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: color .15s;
        }
        .heading-sub a:hover { color: #fde047; }

        /* ── Alerts ── */
        .alert-warn {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(251,191,36,.08);
          border: 1px solid rgba(251,191,36,.25);
          color: #fbbf24; border-radius: 10px;
          padding: 12px 16px; font-size: 13px; font-weight: 500;
          margin-bottom: 22px;
        }
        .alert-success {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(34,197,94,.08);
          border: 1px solid rgba(34,197,94,.25);
          color: #86efac; border-radius: 10px;
          padding: 12px 16px; font-size: 13px; font-weight: 500;
          margin-bottom: 22px;
        }
        .alert-err {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.22);
          color: #fca5a5; border-radius: 10px;
          padding: 12px 16px; font-size: 13px; font-weight: 500;
        }

        /* ── Form ── */
        .form { display: flex; flex-direction: column; gap: 16px; }

        /* Field */
        .field { display: flex; flex-direction: column; gap: 10px; }
        .field-label { font-size: 18px; font-weight: 600; color: rgba(255,255,255,.7); letter-spacing: .15px; }

        /* Input with icon wrapper */
        .inp-wrap { position: relative; }
        .inp-icon {
          position: absolute; left: 20px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
          display: flex; align-items: center;
        }

        /* Inputs */
        .inp {
          width: 100%; height: 64px;
          background: #fff;
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 0 20px 0 52px;
          font-size: 20px; font-family: inherit;
          color: #0f172a; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .inp-no-icon { padding-left: 18px; }
        .inp::placeholder { color: #b0bec5; }
        .inp:focus { border-color: #fbbf24; box-shadow: 0 0 0 4px rgba(251,191,36,.14); }
        .inp:hover:not(:focus) { border-color: rgba(251,191,36,.3); }
        .inp-pw-pad { padding-right: 52px; }

        /* Eye toggle */
        .eye-btn {
          position: absolute; right: 18px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; padding: 0;
          transition: color .15s;
        }
        .eye-btn:hover { color: #fbbf24; }

        /* Branch dropdown */
        .br-wrap { position: relative; }
        .br-btn {
          width: 100%; height: 64px;
          background: #fff;
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 0 20px 0 52px;
          font-size: 20px; font-family: inherit;
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .br-btn:hover:not(.open) { border-color: rgba(251,191,36,.3); }
        .br-btn.open, .br-btn:focus { border-color: #fbbf24; box-shadow: 0 0 0 4px rgba(251,191,36,.14); }
        .br-txt { flex: 1; text-align: left; }
        .br-txt--ph  { color: #b0bec5; }
        .br-txt--val { color: #0f172a; }
        .br-chev { flex-shrink: 0; color: #94a3b8; transition: transform .22s; }
        .br-btn.open .br-chev { transform: rotate(180deg); }

        .br-menu {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #1f1f1f;
          border: 1px solid rgba(251,191,36,.28);
          border-radius: 12px; overflow: hidden; z-index: 80;
          box-shadow: 0 16px 48px rgba(0,0,0,.6);
          animation: menu-in .15s ease both;
        }
        @keyframes menu-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .br-item {
          width: 100%; background: none; border: none;
          padding: 18px 24px; font-size: 18px;
          font-family: inherit; cursor: pointer;
          text-align: left; color: rgba(255,255,255,.75);
          display: flex; align-items: center; gap: 10px;
          transition: background .14s, color .14s;
        }
        .br-item::before {
          content: ''; width: 6px; height: 6px;
          border-radius: 50%; background: rgba(255,255,255,.2);
          flex-shrink: 0; transition: background .14s;
        }
        .br-item:hover { background: rgba(251,191,36,.15); color: #fde047; }
        .br-item:hover::before { background: #fbbf24; }
        .br-item.sel { color: #fbbf24; font-weight: 600; }
        .br-item.sel::before { background: #fbbf24; }

        /* Forgot */
        .forgot { text-align: right; margin-top: -4px; }
        .forgot a { font-size: 15px; color: #fbbf24; font-weight: 500; cursor: pointer; text-decoration: none; transition: color .15s; }
        .forgot a:hover { color: #fde047; }

        /* ── Primary button ── */
        .btn-primary {
          width: 100%; height: 64px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none; border-radius: 12px;
          font-size: 20px; font-weight: 700;
          color: #1a1a1a; cursor: pointer;
          letter-spacing: .3px;
          display: flex; align-items: center; justify-content: center;
          font-family: inherit; position: relative; overflow: hidden;
          transition: transform .15s, box-shadow .2s, opacity .2s;
          box-shadow: 0 4px 24px rgba(245,158,11,.45);
          margin-top: 4px;
        }
        .btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,.2), transparent);
          pointer-events: none;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(245,158,11,.55); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          width: 20px; height: 20px;
          border: 2.5px solid rgba(26,26,26,.3);
          border-top-color: #1a1a1a;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .lp-footer {
          padding: 18px 52px;
          text-align: center;
          position: relative; z-index: 2;
          border-top: 1px solid rgba(255,255,255,.05);
          flex-shrink: 0;
        }
        .lp-footer p { font-size: 11.5px; color: rgba(255,255,255,.2); letter-spacing: .3px; }

        /* ═════════════════════════════
           RIGHT PANEL
        ═════════════════════════════ */
        .right {
          flex: 1;
          background: linear-gradient(145deg, #1c1c1c 0%, #121212 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 52px 48px;
          position: relative; overflow: hidden;
          gap: 44px;
        }
        .right::before {
          content: '';
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(251,191,36,.1) 0%, transparent 60%);
          border-radius: 50%; pointer-events: none;
        }

        /* Shield */
        .shield-ring {
          position: relative; z-index: 1; flex-shrink: 0;
          width: 360px; height: 360px;
        }
        .shield-ring::before {
          content: ''; position: absolute; inset: -16px; border-radius: 50%;
          border: 1px solid rgba(251,191,36,.2);
          animation: pulse 3s ease-in-out infinite;
        }
        .shield-ring::after {
          content: ''; position: absolute; inset: -32px; border-radius: 50%;
          border: 1px solid rgba(251,191,36,.1);
          animation: pulse 3s ease-in-out infinite .6s;
        }
        @keyframes pulse {
          0%, 100% { opacity: .4; transform: scale(1); }
          50%       { opacity: 1;  transform: scale(1.03); }
        }
        .shield-img-wrap {
          width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 2px rgba(251,191,36,.25), 0 0 60px rgba(251,191,36,.35), 0 0 120px rgba(251,191,36,.18);
        }
        .shield-img { width: 80%; height: 80%; object-fit: contain; display: block; }

        /* Right text */
        .right-text { text-align: center; z-index: 1; max-width: 500px; }
        .right-eyebrow { font-size: 14px; font-weight: 700; letter-spacing: 3px; color: #fbbf24; text-transform: uppercase; margin-bottom: 16px; }
        .right-title { font-size: 38px; font-weight: 800; color: #fff; letter-spacing: -.5px; line-height: 1.25; margin-bottom: 16px; }
        .right-body { font-size: 18px; color: rgba(255,255,255,.45); line-height: 1.6; margin-bottom: 32px; }
        .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
        .chip {
          background: rgba(251,191,36,.12);
          border: 1px solid rgba(255,235,59,.2);
          color: #fde047; font-size: 15px; font-weight: 600;
          padding: 8px 18px; border-radius: 999px; letter-spacing: .3px;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .root { flex-direction: column; }
          .left { flex: none; width: 100%; }
          .right { flex: none; padding: 48px 32px; }
          .shield-ring { width: 240px; height: 240px; }
        }
        @media (max-width: 520px) {
          .form-area { padding: 32px 24px; }
          .topbar, .lp-footer { padding-left: 24px; padding-right: 24px; }
          .heading-title { font-size: 26px; }
        }
      `}</style>

      <div className="root">

        {/* ═══════════ LEFT ═══════════ */}
        <div className="left">

          {/* Brand */}
          <div className="topbar">
            <div className="topbar-icon">
              <ShieldCheck size={18} color="#60a5fa" />
            </div>
            <div>
              <span className="topbar-name">Mifos X</span>
              <span className="topbar-tag">Secure Portal</span>
            </div>
          </div>

          {/* Scrollable form */}
          <div className="form-area">
            <div className="form-card">

              {/* ════════ LOGIN FORM ════════ */}
              {mode === 'login' && (
                <>
                  <div className="heading">
                    <h1 className="heading-title">Welcome back</h1>
                    <p className="heading-sub">
                      Don&apos;t have an account?{' '}
                      <a onClick={() => switchMode('register')}>Create now</a>
                    </p>
                  </div>

                  {expiredAlert && (
                    <div className="alert-warn">⚠ Your session expired after 10 min of inactivity.</div>
                  )}
                  {success && <div className="alert-success">✓ {success}</div>}

                  <form className="form" onSubmit={handleLogin} autoComplete="off">

                    {/* Email */}
                    <div className="field">
                      <label className="field-label" htmlFor="l-email">Email address</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Mail size={16} /></span>
                        <input id="l-email" type="text" className="inp" placeholder="you@example.com"
                          value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="field">
                      <label className="field-label" htmlFor="l-password">Password</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Lock size={16} /></span>
                        <input id="l-password" type={showPw ? 'text' : 'password'}
                          className="inp inp-pw-pad" placeholder="••••••••••••"
                          value={password} onChange={e => setPassword(e.target.value)}
                          required autoComplete="current-password" />
                        <button type="button" className="eye-btn" tabIndex={-1}
                          onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="forgot"><a role="button" tabIndex={0} onClick={() => switchMode('reset')}>Forgot password?</a></div>
                    </div>

                    {/* Branch */}
                    <div className="field">
                      <label className="field-label" htmlFor="l-branch">Branch</label>
                      <div className="br-wrap">
                        <div className="inp-icon" style={{ zIndex: 1 }}><Building2 size={15} /></div>
                        <button id="l-branch" type="button"
                          className={`br-btn${branchOpen ? ' open' : ''}`}
                          onClick={() => setBranchOpen(v => !v)}
                          aria-haspopup="listbox" aria-expanded={branchOpen}>
                          <span className={`br-txt ${selectedBranch ? 'br-txt--val' : 'br-txt--ph'}`}>
                            {selectedBranch ? selectedBranch.name : 'Select your branch'}
                          </span>
                          <ChevronDown size={15} className="br-chev" />
                        </button>
                        {branchOpen && (
                          <div className="br-menu" role="listbox">
                            {BRANCHES.map(b => (
                              <button key={b.id} type="button" role="option"
                                aria-selected={branch === b.id}
                                className={`br-item${branch === b.id ? ' sel' : ''}`}
                                onClick={() => { setBranch(b.id); setBranchOpen(false); }}>
                                {b.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {error && <div className="alert-err" role="alert"><span>⚠</span>{error}</div>}

                    <button id="l-submit" type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Sign in'}
                    </button>

                  </form>
                </>
              )}

              {/* ════════ REGISTER FORM ════════ */}
              {mode === 'register' && (
                <>
                  <button type="button" className="back-btn" onClick={() => switchMode('login')} aria-label="Go back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="heading">
                    <h1 className="heading-title">Create account</h1>
                    <p className="heading-sub">
                      Already have an account?{' '}
                      <a onClick={() => switchMode('login')}>Sign in</a>
                    </p>
                  </div>

                  {success && <div className="alert-success">✓ {success}</div>}

                  <form className="form" onSubmit={handleRegister} autoComplete="off">

                    {/* Username */}
                    <div className="field">
                      <label className="field-label" htmlFor="r-username">Username</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><User size={16} /></span>
                        <input id="r-username" type="text" className="inp"
                          placeholder="e.g. john_doe"
                          value={rUsername} onChange={e => setRUsername(e.target.value)} required />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="field">
                      <label className="field-label" htmlFor="r-email">Email address</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Mail size={16} /></span>
                        <input id="r-email" type="email" className="inp"
                          placeholder="you@example.com"
                          value={rEmail} onChange={e => setREmail(e.target.value)} required />
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="field">
                      <label className="field-label" htmlFor="r-mobile">Mobile number</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Phone size={16} /></span>
                        <input id="r-mobile" type="tel" className="inp"
                          placeholder="+94 77 123 4567"
                          value={rMobile} onChange={e => setRMobile(e.target.value)} required />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="field">
                      <label className="field-label" htmlFor="r-password">Password</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Lock size={16} /></span>
                        <input id="r-password" type={showRPw ? 'text' : 'password'}
                          className="inp inp-pw-pad"
                          placeholder="Min. 8 characters"
                          value={rPassword} onChange={e => setRPassword(e.target.value)} required />
                        <button type="button" className="eye-btn" tabIndex={-1}
                          onClick={() => setShowRPw(v => !v)} aria-label="Toggle password">
                          {showRPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="field">
                      <label className="field-label" htmlFor="r-confirm">Confirm password</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Lock size={16} /></span>
                        <input id="r-confirm" type={showRCPw ? 'text' : 'password'}
                          className="inp inp-pw-pad"
                          placeholder="Re-enter your password"
                          value={rConfirm} onChange={e => setRConfirm(e.target.value)} required />
                        <button type="button" className="eye-btn" tabIndex={-1}
                          onClick={() => setShowRCPw(v => !v)} aria-label="Toggle confirm password">
                          {showRCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {error && <div className="alert-err" role="alert"><span>⚠</span>{error}</div>}

                    <button id="r-submit" type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Create account'}
                    </button>

                  </form>
                </>
              )}

              {/* ════════ RESET PASSWORD FORM (Send Link) ════════ */}
              {mode === 'reset' && (
                <>
                  <button type="button" className="back-btn" onClick={() => switchMode('login')} aria-label="Go back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="heading">
                    <h1 className="heading-title">Reset password</h1>
                    <p className="heading-sub">
                      Remember your password?{' '}
                      <a onClick={() => switchMode('login')}>Sign in</a>
                    </p>
                  </div>

                  {success && <div className="alert-success">✓ {success}</div>}
                  {error && <div className="alert-err" role="alert"><span>⚠</span>{error}</div>}

                  <form className="form" onSubmit={handleResetPassword} autoComplete="off">
                    {/* Email */}
                    <div className="field">
                      <label className="field-label" htmlFor="rs-email">Email address</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Mail size={16} /></span>
                        <input id="rs-email" type="email" className="inp" placeholder="you@example.com"
                          value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Send Verification Link'}
                    </button>
                  </form>
                </>
              )}

              {/* ════════ UPDATE PASSWORD FORM (After Link) ════════ */}
              {mode === 'update-password' && (
                <>
                  <div className="heading">
                    <h1 className="heading-title">Set new password</h1>
                    <p className="heading-sub">
                      Please enter a strong password to secure your account.
                    </p>
                  </div>

                  {success && <div className="alert-success">✓ {success}</div>}
                  {error && <div className="alert-err" role="alert"><span>⚠</span>{error}</div>}

                  <form className="form" onSubmit={handleUpdatePassword} autoComplete="off">
                    {/* New Password */}
                    <div className="field">
                      <label className="field-label" htmlFor="up-new-password">New Password</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Lock size={16} /></span>
                        <input id="up-new-password" type={showNewPw ? 'text' : 'password'}
                          className="inp inp-pw-pad" placeholder="Min 8 chars, mixed case, symbol, number"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <button type="button" className="eye-btn" tabIndex={-1}
                          onClick={() => setShowNewPw(v => !v)} aria-label="Toggle password">
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="field">
                      <label className="field-label" htmlFor="up-confirm-password">Confirm Password</label>
                      <div className="inp-wrap">
                        <span className="inp-icon"><Lock size={16} /></span>
                        <input id="up-confirm-password" type={showRCPw ? 'text' : 'password'}
                          className="inp inp-pw-pad" placeholder="Re-enter your new password"
                          value={rConfirm} onChange={e => setRConfirm(e.target.value)} required />
                        <button type="button" className="eye-btn" tabIndex={-1}
                          onClick={() => setShowRCPw(v => !v)} aria-label="Toggle password">
                          {showRCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Update Password'}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="lp-footer">
            <p>Teller &amp; Admin Secure Portal &mdash; Mifos X &copy; 2026</p>
          </div>
        </div>

        {/* ═══════════ RIGHT ═══════════ */}
        <div className="right">
          <div className="shield-ring">
            <div className="shield-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rupasinghe_logo.png" alt="Rupasinghe Pawning" className="shield-img" />
            </div>
          </div>
          <div className="right-text">
            <p className="right-eyebrow">Enterprise-Grade Security</p>
            <h2 className="right-title">Your Data,<br />Always Protected</h2>
            <p className="right-body">
              Multi-branch MFI platform secured with end-to-end
              encryption, role-based access control and real-time audit logging.
            </p>
            <div className="chips">
              {['256-bit Encryption', 'Role-Based Access', 'Audit Logging', 'Multi-Branch'].map(t => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
