"use client";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, ShieldCheck, Lock, Star, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

const PLANS = [
  { id: "basic", name: "Standard Listing", price: "Free", desc: "Basic visibility on PROPIX", features: ["30 Days Active", "Up to 5 Photos", "Standard Search Ranking"], color: "bg-muted text-foreground border-border", btn: "bg-white text-foreground border-border" },
  { id: "featured", name: "Featured Property", price: "LKR 4,500", period: "/month", desc: "3x more views and inquiries", features: ["Featured Badge", "Top of Search Results", "Up to 20 Photos", "Social Media Promotion", "Priority Admin Verification"], color: "bg-accent/10 text-accent border-accent/20", btn: "bg-accent text-white border-accent", popular: true },
  { id: "premium", name: "Premium Seller", price: "LKR 12,000", period: "/month", desc: "For serious sellers and agents", features: ["Everything in Featured", "Dedicated Agent Support", "Professional Photography", "Digital Valuation Included"], color: "bg-primary text-white border-primary", btn: "bg-white text-primary border-white" },
];

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState("featured");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });

  const processPayment = async (e: any) => {
    e.preventDefault(); setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false); setStep(3);
  };

  const inp = "w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          {step === 1 && (
            <div className="space-y-10">
              <div className="text-center">
                <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">Boost Your Listing</p>
                <h1 className="text-4xl font-bold text-foreground font-heading mb-3">Choose Your Visibility Plan</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">Stand out from the crowd. Featured properties get 300% more views and sell 2x faster.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <div key={plan.id} className={`relative rounded-2xl border p-8 shadow-sm transition-all hover:-translate-y-1 ${plan.color} ${selectedPlan === plan.id ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                    {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1"><Star className="w-3 h-3 fill-white"/>Most Popular</div>}
                    <h3 className="font-bold text-lg font-heading">{plan.name}</h3>
                    <p className={`text-sm mt-1 mb-4 ${plan.id === "premium" ? "text-white/80" : "text-muted-foreground"}`}>{plan.desc}</p>
                    <div className="mb-6"><span className="text-3xl font-bold font-heading">{plan.price}</span><span className={`text-sm ${plan.id === "premium" ? "text-white/80" : "text-muted-foreground"}`}>{plan.period}</span></div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.id === "premium" ? "text-white" : "text-primary"}`}/>{f}
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => { setSelectedPlan(plan.id); if (plan.id !== "basic") setStep(2); }} className={`w-full rounded-xl border-2 font-bold ${plan.btn} hover:opacity-90`}>
                      {plan.id === "basic" ? "Current Plan" : "Select Plan"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-primary mb-6 flex items-center gap-1">← Back to Plans</button>
              <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                  <div>
                    <h2 className="text-2xl font-bold font-heading">Secure Checkout</h2>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5"/> 256-bit SSL Encrypted</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total to pay</p>
                    <p className="text-2xl font-bold text-primary font-heading">{PLANS.find(p=>p.id===selectedPlan)?.price}</p>
                  </div>
                </div>
                <form onSubmit={processPayment} className="space-y-5">
                  <div><label className="text-xs font-bold uppercase tracking-wider block mb-2">Cardholder Name</label><input required value={card.name} onChange={e=>setCard({...card,name:e.target.value})} placeholder="Name on card" className={inp}/></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider block mb-2">Card Number</label>
                    <div className="relative"><CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><input required value={card.number} onChange={e=>setCard({...card,number:e.target.value})} placeholder="0000 0000 0000 0000" maxLength={19} className={`${inp} pl-10 font-mono`}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold uppercase tracking-wider block mb-2">Expiry Date</label><input required value={card.expiry} onChange={e=>setCard({...card,expiry:e.target.value})} placeholder="MM/YY" maxLength={5} className={inp}/></div>
                    <div><label className="text-xs font-bold uppercase tracking-wider block mb-2">CVC</label><input required value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value})} type="password" placeholder="123" maxLength={3} className={inp}/></div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3 mt-4 border border-border">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"/>
                    <p className="text-xs text-muted-foreground leading-relaxed">Your payment is securely processed by Stripe. PROPIX does not store your credit card information. By confirming, you agree to our Terms of Service.</p>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg mt-6">
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/>Processing...</> : `Pay ${PLANS.find(p=>p.id===selectedPlan)?.price}`}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-border p-10 shadow-sm text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="w-10 h-10 text-emerald-600"/></div>
              <h2 className="text-2xl font-bold font-heading mb-2">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground mb-6">Your property has been upgraded to the <strong className="text-foreground capitalize">{selectedPlan}</strong> plan. It will now receive priority visibility.</p>
              <div className="bg-muted/50 rounded-xl px-5 py-4 text-left mb-6">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Receipt Number</p>
                <p className="font-bold text-primary font-mono text-lg">RCPT-{Math.floor(Math.random()*900000+100000)}</p>
              </div>
              <Link href="/dashboard/seller">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold">Return to Dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
