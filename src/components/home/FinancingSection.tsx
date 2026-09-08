import Link from "next/link";
import { DollarSign, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PARTNERS = ["Peoples Bank", "Bank of Ceylon", "HNB", "Sampath Bank", "NTB"];
const BENEFITS = ["Low interest rate referrals", "Quick approval process", "Flexible repayment terms", "Expert financial guidance"];

export function FinancingSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-10 md:p-14">
              <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">Financing Partners</p>
              <h2 className="text-3xl font-bold text-white font-heading mb-4">Explore Property Financing Options</h2>
              <p className="text-white/75 leading-relaxed mb-6">
                PROPIX connects eligible buyers with Sri Lanka&apos;s leading financial institutions. Get pre-approved and move faster on your dream property.
              </p>
              <ul className="space-y-2.5 mb-8">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-white/85 text-sm">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Link href="/financing">
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-7 h-11 rounded-xl">
                  <DollarSign className="w-4 h-4 mr-2" /> Explore Financing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-10 bg-white/5">
              <div className="text-center">
                <p className="text-white/50 text-sm mb-6 uppercase tracking-wider font-medium">Our Banking Partners</p>
                <div className="grid grid-cols-2 gap-3">
                  {PARTNERS.map((bank) => (
                    <div key={bank} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15 text-center">
                      <p className="text-white font-semibold text-sm">{bank}</p>
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-6">+ More partner banks available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
