"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle2, ChevronRight, Calculator, Building, Clock, FileText, ArrowRight, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const BANKS = [
  { name: "Peoples Bank", logo: "🏛️", rate: "11.5%", term: "Up to 25 Years" },
  { name: "Bank of Ceylon", logo: "🏢", rate: "11.75%", term: "Up to 25 Years" },
  { name: "Hatton National Bank (HNB)", logo: "🏦", rate: "12.0%", term: "Up to 20 Years" },
  { name: "Sampath Bank", logo: "💳", rate: "12.25%", term: "Up to 20 Years" },
];

export default function FinancingPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(15000000);
  const [term, setTerm] = useState(20);
  const [rate, setRate] = useState(12);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setForm(f => ({ ...f, name: user.user_metadata?.full_name || "", email: user.email || "" }));
      }
      // No redirect — unauthenticated users can still use the EMI calculator
    }
    checkUser();
  }, []);

  const [form, setForm] = useState({ name: "", email: "", phone: "", income: "", employment: "Salaried", property: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [refCode, setRefCode] = useState("");

  // Simple EMI Calculation (P x R x (1+R)^N) / ((1+R)^N - 1)
  const monthlyRate = (rate / 100) / 12;
  const numPayments = term * 12;
  const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  const submit = async (e: any) => {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    setLoading(true);
    const code = `PROPIX-LOAN-${Math.floor(Math.random()*90000+10000)}`;
    if (user) {
      const supabase = createClient();
      await supabase.from("financing_requests").insert({
        applicant_id: user.id,
        employment_status: form.employment.toLowerCase().replace(" ", "_"),
        monthly_income: Number(form.income) || 0,
        requested_loan: amount,
        property_value: Number(form.property) || null,
        loan_term_years: term,
        interest_rate: rate,
        reference_code: code,
        status: "submitted",
        notes: `Name: ${form.name}, Email: ${form.email}, Phone: ${form.phone}`
      });
    }
    setRefCode(code);
    setDone(true); setLoading(false);
  };

  const inp = "w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">Property Financing</p>
            <h1 className="text-4xl font-bold text-foreground font-heading">Find the Right Home Loan</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Compare rates from Sri Lanka&apos;s leading banks and apply for pre-approval directly through PROPIX.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* EMI Calculator */}
            <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Calculator className="w-5 h-5 text-primary"/></div><h2 className="text-xl font-bold font-heading">Loan Calculator</h2></div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2"><label className="text-xs font-bold uppercase tracking-wider text-foreground">Loan Amount (LKR)</label><span className="font-bold text-primary">{amount.toLocaleString()}</span></div>
                  <input type="range" min="1000000" max="100000000" step="1000000" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2"><label className="text-xs font-bold uppercase tracking-wider text-foreground">Loan Term (Years)</label><span className="font-bold text-primary">{term} Years</span></div>
                  <input type="range" min="5" max="30" step="5" value={term} onChange={e => setTerm(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between mb-2"><label className="text-xs font-bold uppercase tracking-wider text-foreground">Interest Rate (%)</label><span className="font-bold text-primary">{rate}%</span></div>
                  <input type="range" min="5" max="25" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl p-6 border border-border text-center mt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Monthly Repayment</p>
                  <p className="text-4xl font-bold text-primary font-heading">LKR {Math.round(emi).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Application Form */}
            {done ? (
              <div className="bg-white rounded-2xl border border-border p-10 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-10 h-10 text-emerald-600"/></div>
                <h2 className="text-2xl font-bold font-heading mb-2">Request Submitted!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">Our financing partners will review your details and contact you within <strong>1 business day</strong> to discuss your loan pre-approval.</p>
                <div className="bg-muted/50 rounded-xl p-4 w-full text-left space-y-2 mb-6">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Reference ID: {refCode}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4 text-amber-500"/> Status: Under Review</div>
                </div>
                <Button onClick={() => setDone(false)} variant="outline" className="rounded-xl px-8">Submit Another Request</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-5">
                <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-secondary"/></div><div><h2 className="text-xl font-bold font-heading">Request Loan Pre-Approval</h2><p className="text-sm text-muted-foreground">Fast-track your property purchase</p></div></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Full Name *</label><input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className={inp}/></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Phone Number *</label><input required value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} className={inp}/></div>
                </div>
                <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Email Address *</label><input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className={inp}/></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Monthly Income (LKR)</label><input type="number" required value={form.income} onChange={e => setForm({...form,income:e.target.value})} className={inp}/></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Employment Type</label>
                    <select value={form.employment} onChange={e => setForm({...form,employment:e.target.value})} className={inp}>
                      {["Salaried","Self-Employed","Business Owner","Overseas Employed"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold mt-2">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Submitting...</> : "Request Pre-Approval →"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">By submitting, you consent to PROPIX sharing your contact details with our partner banks.</p>
              </form>
            )}
          </div>

          {/* Partner Banks */}
          <div>
            <h2 className="font-bold text-foreground text-xl font-heading mb-6 flex items-center gap-2"><Building className="w-5 h-5 text-primary"/> Our Partner Banks</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BANKS.map((b) => (
                <div key={b.name} className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{b.logo}</div>
                  <h3 className="font-bold text-foreground text-sm mb-2">{b.name}</h3>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">From <span className="font-bold text-primary">{b.rate}</span></p>
                    <p className="text-xs text-muted-foreground">{b.term}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
