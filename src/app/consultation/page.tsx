"use client";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { getApprovedProperties } from "@/lib/data";
import { CheckCircle2, Users, Calendar, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { value:"buying", label:"Buying a Property", desc:"Expert advice on finding the right property" },
  { value:"selling", label:"Selling a Property", desc:"Guidance on listing, pricing, and closing" },
  { value:"investment", label:"Investment Strategy", desc:"Portfolio analysis and ROI projections" },
  { value:"general", label:"General Consultation", desc:"Any property-related questions" },
];
const TIMES = ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

export default function ConsultationPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:"", email:"", phone:"", property:"none", consultType:"buying", date:"", time:"10:00 AM", notes:"" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        setForm(f => ({ ...f, name: user.user_metadata?.full_name || "", email: user.email || "" }));
        const { data: props } = await supabase.from("properties").select("id, title").eq("status", "published");
        if (props) setProperties(props);
      }
    }
    loadData();
  }, [router]);

  const submit = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const code = `CON-${Math.floor(Math.random()*90000+10000)}`;
    if (user) {
      const supabase = createClient();
      await supabase.from("consultation_requests").insert({
        requested_by: user.id,
        property_id: form.property !== "none" ? form.property : null,
        consultation_type: form.consultType,
        preferred_date: form.date || null,
        preferred_time: form.date ? `${form.time.replace(' ', '')}` : null,
        message: form.notes,
        reference_code: code,
        status: "pending",
        guest_name: form.name,
        guest_email: form.email,
        guest_phone: form.phone
      });
    }
    setRefCode(code);
    setDone(true); setLoading(false);
  };

  const inp = "w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-muted/30";

  if (done) return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-xl border border-border space-y-5">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10 text-emerald-600"/></div>
          <h2 className="text-2xl font-bold font-heading">Consultation Requested!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Your consultation request has been submitted. A PROPIX agent will contact you within <strong>2 business hours</strong> to confirm your appointment.</p>
          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference:</span><span className="font-bold text-primary">{refCode}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type:</span><span className="font-medium capitalize">{form.consultType}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Requested:</span><span className="font-medium">{form.date} at {form.time}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status:</span><span className="font-bold text-amber-600">REQUESTED</span></div>
          </div>
          <Button onClick={() => setDone(false)} variant="outline" className="rounded-xl w-full">Book Another</Button>
        </div>
      </main>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">Expert Guidance</p>
            <h1 className="text-4xl font-bold text-foreground font-heading">Broker Consultation</h1>
            <p className="text-muted-foreground mt-3">Connect with our verified real estate experts for personalised property advice.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={submit} className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="font-bold text-foreground text-lg font-heading mb-4">Select Consultation Type</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {TYPES.map(t => (
                      <button key={t.value} type="button" onClick={() => setForm({...form,consultType:t.value})}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${form.consultType === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <p className={`font-bold text-sm ${form.consultType === t.value ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Related Property (optional)</label>
                  <select value={form.property} onChange={e => setForm({...form,property:e.target.value})} className={inp}>
                    <option value="none">No specific property</option>
                    {properties.slice(0,6).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Your Name *</label><input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Full Name" className={inp}/></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Email" className={inp}/></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Phone</label><input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+94 77..." className={inp}/></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Preferred Date *</label><input required type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})} className={inp}/></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Preferred Time *</label><select value={form.time} onChange={e => setForm({...form,time:e.target.value})} className={inp}>{TIMES.map(t => <option key={t}>{t}</option>)}</select></div>
                </div>
                <div><label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">Additional Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Any specific questions or requirements..." className={`${inp} resize-none`}/></div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Submitting...</> : <><Calendar className="w-4 h-4 mr-2"/>Submit Consultation Request</>}
                </Button>
              </form>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3"><Users className="w-5 h-5 text-primary"/></div>
                <h3 className="font-bold text-foreground font-heading mb-2">Our Expert Agents</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">All PROPIX consultants are licensed real estate professionals with local market expertise.</p>
              </div>
              {[["🕐","Response Time","Within 2 hours"],["📍","Coverage","All Sri Lanka districts"],["✅","Verified","EARB Licensed Professionals"],["💼","Experience","Avg. 8+ years"]].map(([icon,l,v]) => (
                <div key={l} className="bg-white rounded-xl border border-border px-5 py-4 shadow-sm flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div><p className="text-xs text-muted-foreground">{l}</p><p className="text-sm font-bold text-foreground">{v}</p></div>
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