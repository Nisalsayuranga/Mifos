"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, User, Mail, Phone, Lock, Home, Building2, Users, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/BrandLogo";

const USER_TYPES = [
  { value: "buyer",  label: "Buyer",  icon: Home,      desc: "Looking to buy or rent" },
  { value: "seller", label: "Seller", icon: Building2, desc: "Want to list property"  },
  { value: "agent",  label: "Agent",  icon: Users,     desc: "Real estate professional" },
];

import { createClient } from "@/lib/supabase/client";

function RegisterForm({ userType, setUserType, onSwitch }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const submit = async (e: any) => {
    e.preventDefault(); 
    setLoading(true);
    setErrorMsg(null);
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          role: userType,
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    
    router.push(`/dashboard`);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Create Your Account</h1>
        <p className="text-muted-foreground text-sm mt-1">Join RUPASINGHE REALTY — Sri Lanka&apos;s premier real estate platform.</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-3">I am a...</label>
        <div className="grid grid-cols-3 gap-2">
          {USER_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => setUserType(t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${userType === t.value ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/40"}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-xs font-bold">{t.label}</span>
              <span className="text-[10px] text-center leading-tight opacity-70">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-10 pr-4 h-12 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30" /></div>
      <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-10 pr-4 h-12 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30" /></div>
      <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="tel" placeholder="Phone (+94 77 123 4567)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-10 pr-4 h-12 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30" /></div>
      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input required type={showPwd ? "text" : "password"} placeholder="Create Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full pl-10 pr-10 h-12 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div>
      <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating Account...</> : <>Create Account<ArrowRight className="w-4 h-4 ml-2"/></>}
      </Button>
      <p className="text-center text-sm text-muted-foreground">Already have an account?{" "}<button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">Sign In</button></p>
    </form>
  );
}

function LoginForm({ onSwitch }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e: any) => {
    e.preventDefault(); 
    setLoading(true);
    setErrorMsg(null);
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    
    router.push("/dashboard");
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Welcome Back</h1>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your RUPASINGHE REALTY account.</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {errorMsg}
        </div>
      )}
      
      <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-10 pr-4 h-12 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30" /></div>
      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input required type={showPwd ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full pl-10 pr-10 h-12 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div>
      <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Signing In...</> : <>Sign In<ArrowRight className="w-4 h-4 ml-2"/></>}
      </Button>
      <p className="text-center text-sm text-muted-foreground">No account?{" "}<button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">Create one free</button></p>
    </form>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login"|"register">("login");
  const [userType, setUserType] = useState("buyer");
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#013B30] via-[#01473A] to-[#00261F]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#C5A059] blur-3xl opacity-30" />
        </div>
        <Link href="/" className="relative z-10 flex items-center">
          <BrandLogo variant="light" size="lg" layout="horizontal" />
        </Link>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white font-heading leading-snug">Find the Right Property.<br /><span className="text-[#E8D196]">Make the Right Move.</span></h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">Sri Lanka&apos;s premier digital real estate platform. Verified listings. Expert agents. Transparent process.</p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[["12K+","Properties"],["8.5K+","Happy Clients"],["500+","Expert Agents"]].map(([v,l]) => (
              <div key={l} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 text-center">
                <p className="text-white font-bold text-2xl">{v}</p><p className="text-white/70 text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/50 text-xs relative z-10">© 2025 RUPASINGHE REALTY (Pvt) Ltd. Regulated by the EARB of Sri Lanka.</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-muted/20">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 lg:hidden block">
            <BrandLogo variant="dark" size="md" />
          </Link>
          <div className="flex gap-1 bg-white border border-border rounded-xl p-1 mb-8 shadow-sm">
            {(["login","register"] as const).map((t) => (
              <button key={t} onClick={() => setMode(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${mode === t ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          {mode === "register" ? <RegisterForm userType={userType} setUserType={setUserType} onSwitch={() => setMode("login")} /> : <LoginForm onSwitch={() => setMode("register")} />}
        </div>
      </div>
    </div>
  );
}