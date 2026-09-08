import { Search, ShieldCheck, Users, ArrowRight } from "lucide-react";

const STEPS = [
  { n: 1, icon: Search, title: "Discover", desc: "Search thousands of verified properties across Sri Lanka. Use radius-based search to find homes near you.", color: "bg-primary/10 text-primary" },
  { n: 2, icon: ShieldCheck, title: "Verify", desc: "Every listing on PROPIX is reviewed and verified by our team. Know exactly what you are buying.", color: "bg-emerald-100 text-emerald-700" },
  { n: 3, icon: Users, title: "Connect", desc: "Speak directly with sellers, schedule viewings, and consult with our network of expert agents.", color: "bg-secondary/20 text-secondary" },
  { n: 4, icon: ArrowRight, title: "Move Forward", desc: "From valuation to financing, PROPIX supports you at every step of your property journey.", color: "bg-accent/15 text-accent" },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Simple Process</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-heading">How PROPIX Works</h2>
          <p className="text-muted-foreground mt-3">From discovery to your dream home — we guide you every step of the way.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.color}`}>
                  <step.icon className="w-7 h-7" />
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                {step.n}
              </div>
              {i < STEPS.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-border" />}
              <h3 className="font-bold text-foreground text-lg mb-2 font-heading">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
