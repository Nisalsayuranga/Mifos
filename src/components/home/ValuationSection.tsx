import Link from "next/link";
import { BarChart2, TrendingUp, FileSearch, ArrowRight } from "lucide-react";

const OPTIONS = [
  { icon: FileSearch, title: "Digital Property Estimate", desc: "Get an instant data-driven valuation estimate for your property based on recent market transactions.", tag: "Free", color: "bg-primary/10 text-primary", href: "/valuation?type=digital" },
  { icon: BarChart2, title: "Professional Valuation", desc: "A certified property valuer visits your property and provides a formal valuation report with legal standing.", tag: "From LKR 15,000", color: "bg-secondary/20 text-secondary", href: "/valuation?type=professional" },
  { icon: TrendingUp, title: "Market Insights", desc: "Access PROPIX data analytics — pricing trends, demand analysis, and regional performance reports.", tag: "Premium", color: "bg-accent/15 text-accent", href: "/valuation" },
];

export function ValuationSection() {
  return (
    <section className="py-20 bg-muted/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Know Your Property Value</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-heading">Property Valuation Services</h2>
          <p className="text-muted-foreground mt-3">Accurate, transparent, and professionally backed property valuations for informed decisions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {OPTIONS.map((opt) => (
            <Link key={opt.title} href={opt.href} className="group bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${opt.color}`}>
                <opt.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{opt.tag}</span>
              <h3 className="font-bold text-foreground text-lg mt-3 mb-2 font-heading group-hover:text-primary transition-colors">{opt.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</p>
              <div className="flex items-center gap-1 text-primary text-sm font-semibold mt-4 group-hover:gap-2 transition-all">
                Learn More <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
