import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

const FOOTER_LINKS = {
  "Platform": [
    { label: "Buy Property", href: "/search?type=sale" },
    { label: "Rent Property", href: "/search?type=rent" },
    { label: "Sell Property", href: "/listings/new" },
    { label: "Property Valuation", href: "/valuation" },
    { label: "Financing", href: "/financing" },
  ],
  "Services": [
    { label: "Find an Agent", href: "/agents" },
    { label: "Broker Consultation", href: "/consultation" },
    { label: "Featured Listings", href: "/payment" },
    { label: "Property Insights", href: "#" },
  ],
  "Company": [
    { label: "About RUPASINGHE REALTY", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Help Center", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#042019] text-white border-t border-[#0a3a2d]">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo variant="light" size="lg" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              Find the Right Property. Make the Right Move. Sri Lanka&apos;s premier digital real estate platform connecting buyers, sellers, and certified agents.
            </p>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400 shrink-0" /><span>Level 8, World Trade Centre, Colombo 1, Sri Lanka</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400 shrink-0" /><span>+94 11 234 5678</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-400 shrink-0" /><span>hello@rupasingherealty.lk</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              {[Globe].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>© 2025 RUPASINGHE REALTY (Pvt) Ltd. All rights reserved. Regulated by the Estate Agents Registration Board of Sri Lanka.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
