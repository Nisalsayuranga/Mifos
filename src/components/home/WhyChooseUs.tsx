import { ShieldCheck, Eye, HeadphonesIcon, Award } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Verified Listings Only", desc: "Every property on PROPIX is reviewed and verified by our team before going live." },
  { icon: Eye, title: "Full Transparency", desc: "See the full history of every listing — price changes, status updates, and ownership details." },
  { icon: HeadphonesIcon, title: "Expert Support", desc: "Our property specialists are available 7 days a week to assist buyers, sellers, and agents." },
  { icon: Award, title: "Trusted by Thousands", desc: "Over 8,500 successful property transactions facilitated through PROPIX across Sri Lanka." },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Why PROPIX</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-heading">Built on Trust. Backed by Expertise.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITEMS.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-2 font-heading">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
