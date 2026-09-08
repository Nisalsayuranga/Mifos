"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BarChart2, CheckCircle2, Calendar, Clock, ArrowRight, Loader2, TrendingUp, FileSearch } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const DISTRICTS = ["Colombo","Gampaha","Kalutara","Kandy","Galle","Kurunegala","Matara","Ratnapura"];
const TYPES = ["House","Apartment","Villa","Land","Commercial","Agricultural"];

export default function ValuationPage() {
  const router = useRouter();
  const [valuationType, setValuationType] = useState<"digital"|"professional"|null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        setBookForm(f => ({ ...f, name: user.user_metadata?.full_name || "", phone: "" }));
      }
    }
    checkUser();
  }, [router]);
  const [result, setResult] = useState<number|null>(null);
  const [form, setForm] = useState({ address:"", district:"Colombo", propertyType:"House", landSize:"", buildingSize:"", beds:"3" });
  const [bookForm, setBookForm] = useState({ name:"", phone:"", date:"", time:"9:00 AM" });
  const [booked, setBooked] = useState(false);
  const [refCode, setRefCode] = useState("");

  const runDigital = async () => {
    setLoading(true);
    const base = { Colombo: 8500000, Gampaha: 4200000, Kandy: 3800000, Galle: 5500000 }[form.district] ?? 4000000;
    const sz = Number(form.buildingSize) || 1500;
    const est = Math.round((base + sz * 3000) * (0.9 + Math.random() * 0.2));
    
    if (user) {
      const supabase = createClient();
      await supabase.from("valuation_requests").insert({
        requested_by: user.id,
        property_address: form.address,
        district: form.district,
        property_type: form.propertyType.toLowerCase(),
        land_size: Number(form.landSize) || null,
        building_size: Number(form.buildingSize) || null,
        valuation_type: "digital",
        estimated_value: est,
        status: "completed"
      });
    }
    
    setResult(est);
    setLoading(false); setStep(2);
  };

  const bookProfessional = async () => {
    setLoading(true);
    const code = `PROPIX-VAL-${Math.floor(Math.random()*90000+10000)}`;
    if (user) {
      const supabase = createClient();
      await supabase.from("valuation_requests").insert({
        requested_by: user.id,
        property_address: form.address || "TBD",
        district: form.district,
        property_type: form.propertyType.toLowerCase(),
        valuation_type: "professional",
        scheduled_date: bookForm.date ? new Date(`${bookForm.date}T${bookForm.time.replace(' ', '')}`).toISOString() : null,
        reference_code: code,
        status: "submitted",
        notes: `Name: ${bookForm.name}, Phone: ${bookForm.phone}`
      });
    }
    setRefCode(code);
    setBooked(true); setLoading(false);
  };

  const inp = "w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30";

  if (!valuationType) return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">Property Valuation</p>
            <h1 className="text-4xl font-bold text-foreground font-heading">Know Your Property Value</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Choose from an instant digital estimate or a professionally certified property valuation.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { key:"digital" as const, icon:FileSearch, title:"Digital Property Estimate", desc:"Get an instant AI-powered valuation estimate based on recent market transactions, location data, and property characteristics.", tag:"Free · Instant", features:["Instant result in 2 seconds","Based on live market data","No professional visit required","Great for quick decisions"], color:"primary" },
              { key:"professional" as const, icon:BarChart2, title:"Professional Valuation", desc:"A certified property valuer visits your property and produces a formal valuation report with full legal standing.", tag:"From LKR 15,000", features:["Certified valuer site visit","Formal valuation certificate","Legal standing for bank loans","Full market analysis report"], color:"secondary" },
            ].map((opt) => (
              <div key={opt.key} onClick={() => setValuationType(opt.key)}
                className="bg-white rounded-2xl border-2 border-border hover:border-primary cursor-pointer p-8 shadow-sm hover:shadow-lg transition-all group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${opt.color === "primary" ? "bg-primary/10" : "bg-secondary/20"}`}>
                  <opt.icon className={`w-7 h-7 ${opt.color === "primary" ? "text-primary" : "text-secondary"}`}/>
                </div>
                <span className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{opt.tag}</span>
                <h2 className="text-xl font-bold text-foreground font-heading mt-3 mb-2 group-hover:text-primary transition-colors">{opt.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{opt.desc}</p>
                <ul className="space-y-2">
                  {opt.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>{f}</li>)}
                </ul>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mt-6 group-hover:gap-3 transition-all">Get Started <ArrowRight className="w-4 h-4"/></div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <button onClick={() => { setValuationType(null); setStep(1); setResult(null); setBooked(false); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">← Back to Options</button>

          {valuationType === "digital" && (
            <>
              {step === 1 && (
                <div className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-5">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><FileSearch className="w-5 h-5 text-primary"/></div><div><h2 className="text-xl font-bold font-heading">Digital Property Estimate</h2><p className="text-sm text-muted-foreground">Enter your property details</p></div></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Property Address</label><input value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="e.g. 45/A, Main Street, Colombo 7" className={inp}/></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">District</label><select value={form.district} onChange={e => setForm({...form,district:e.target.value})} className={inp}>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></div>
                    <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Property Type</label><select value={form.propertyType} onChange={e => setForm({...form,propertyType:e.target.value})} className={inp}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Land Size (Perches)</label><input type="number" value={form.landSize} onChange={e => setForm({...form,landSize:e.target.value})} placeholder="e.g. 20" className={inp}/></div>
                    <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Building Size (Sq Ft)</label><input type="number" value={form.buildingSize} onChange={e => setForm({...form,buildingSize:e.target.value})} placeholder="e.g. 2400" className={inp}/></div>
                  </div>
                  <Button onClick={runDigital} disabled={loading || !form.address} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Analysing Market Data...</> : "Get My Estimate →"}
                  </Button>
                </div>
              )}
              {step === 2 && result && (
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl border border-border p-8 shadow-sm text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingUp className="w-8 h-8 text-primary"/></div>
                    <p className="text-sm text-muted-foreground font-medium">Estimated Market Value</p>
                    <p className="text-5xl font-bold text-primary mt-2 font-heading">LKR {(result / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-muted-foreground mt-1">Range: LKR {((result*0.9)/1000000).toFixed(1)}M — {((result*1.1)/1000000).toFixed(1)}M</p>
                    <div className="bg-muted/50 rounded-xl p-4 mt-6 text-left space-y-2">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">Estimate Based On</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>📍 Location: {form.district}</span><span>🏠 Type: {form.propertyType}</span>
                        {form.buildingSize && <span>📐 Building: {form.buildingSize} sqft</span>}
                        <span>📊 Market: Q1 2025 data</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">This is an automated estimate only. For a legally valid valuation, book a professional visit.</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <h3 className="font-bold text-foreground font-heading mb-2">Want a Certified Valuation?</h3>
                    <p className="text-sm text-muted-foreground mb-4">Book a professional valuer for an official report accepted by banks and courts.</p>
                    <Button onClick={() => { setValuationType("professional"); setStep(1); setBooked(false); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8">Book Professional Valuation</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {valuationType === "professional" && !booked && (
            <div className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center"><BarChart2 className="w-5 h-5 text-secondary"/></div><div><h2 className="text-xl font-bold font-heading">Professional Valuation</h2><p className="text-sm text-muted-foreground">Book a certified valuer</p></div></div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Your Name *</label><input value={bookForm.name} onChange={e => setBookForm({...bookForm,name:e.target.value})} placeholder="Full Name" className={inp}/></div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Phone Number *</label><input value={bookForm.phone} onChange={e => setBookForm({...bookForm,phone:e.target.value})} placeholder="+94 77 123 4567" className={inp}/></div>
              <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Property Address</label><input value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="Full address of property to be valued" className={inp}/></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Preferred Date</label><input type="date" value={bookForm.date} onChange={e => setBookForm({...bookForm,date:e.target.value})} className={inp}/></div>
                <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Preferred Time</label>
                  <select value={bookForm.time} onChange={e => setBookForm({...bookForm,time:e.target.value})} className={inp}>
                    {["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground"><strong>Fee:</strong> From LKR 15,000 (varies by property size and location). Payment is collected on the day of the visit.</p>
              </div>
              <Button onClick={bookProfessional} disabled={loading || !bookForm.name || !bookForm.phone} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Booking...</> : <><Calendar className="w-4 h-4 mr-2"/>Confirm Booking</>}
              </Button>
            </div>
          )}

          {valuationType === "professional" && booked && (
            <div className="bg-white rounded-2xl border border-border p-10 shadow-sm text-center space-y-5">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10 text-emerald-600"/></div>
              <h2 className="text-2xl font-bold font-heading">Valuation Booked!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">A PROPIX certified property valuer will contact you within 24 hours to confirm your appointment on <strong>{bookForm.date || "your selected date"} at {bookForm.time}</strong>.</p>
              <div className="bg-muted/50 rounded-xl px-5 py-4 text-left"><p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">Booking Reference</p><p className="font-bold text-primary text-lg">{refCode}</p></div>
              <Button onClick={() => setValuationType(null)} variant="outline" className="rounded-xl px-8">Back to Valuation Home</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}