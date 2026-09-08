import Link from "next/link";
import { ArrowRight, BarChart2, Tag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SellSection() {
  return (
    <section className="py-20 bg-primary text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary blur-3xl" />
      </div>
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">Sell Smarter</p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Ready to Make Your Move?</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            List your property on PROPIX and reach thousands of serious buyers. Our verified platform ensures your listing gets the right attention.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[["Free to List", "No upfront cost"], ["Verified Buyers", "Quality inquiries only"], ["Expert Support", "Agent assistance"]].map(([t, d]) => (
              <div key={t} className="bg-white/10 rounded-xl p-4 border border-white/15">
                <CheckCircle className="w-5 h-5 text-secondary mb-2 mx-auto" />
                <p className="font-bold text-sm">{t}</p>
                <p className="text-white/60 text-xs mt-1">{d}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/listings/new">
              <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-8 h-12 rounded-xl">
                <Tag className="w-4 h-4 mr-2" /> List Your Property
              </Button>
            </Link>
            <Link href="/valuation">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12 rounded-xl bg-transparent">
                <BarChart2 className="w-4 h-4 mr-2" /> Get a Valuation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
