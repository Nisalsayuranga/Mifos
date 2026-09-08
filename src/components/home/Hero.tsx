"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const TABS = ["Buy", "Rent"];
const LOCATIONS = ["Colombo", "Gampaha", "Kalutara", "Kandy", "Galle", "Kurunegala", "Matara", "Negombo", "Anuradhapura", "Ratnapura"];
const TYPES = ["Any Type", "House", "Apartment", "Villa", "Land", "Commercial", "Agricultural"];
const PRICES_SALE = ["Any Price", "Under 10M", "Under 25M", "Under 50M", "Under 100M", "100M+"];
const PRICES_RENT = ["Any Price", "Under 25K", "Under 50K", "Under 100K", "Under 200K", "200K+"];
const RADII = ["Any Distance", "5 km", "10 km", "25 km"];

export function Hero() {
  const router = useRouter();
  const [tab, setTab] = useState("Buy");
  const [location, setLocation] = useState("");
  const [propType, setPropType] = useState("Any Type");
  const [price, setPrice] = useState("Any Price");
  const [radius, setRadius] = useState("Any Distance");

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("type", tab === "Buy" ? "sale" : "rent");
    if (location) params.set("district", location);
    if (propType !== "Any Type") params.set("category", propType.toLowerCase());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 pt-24 pb-20 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-white/90 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Sri Lanka&apos;s Most Trusted Real Estate Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 font-heading">
            Find the Right Property.<br />
            <span className="text-secondary">Make the Right Move.</span>
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Discover verified properties, connect with trusted experts, and make confident property decisions in one place.
          </p>
        </motion.div>

        {/* Search Panel */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="w-full max-w-4xl">
          {/* Buy/Rent Tabs */}
          <div className="flex gap-1 mb-0">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-8 py-3 font-semibold text-sm rounded-t-xl transition-all ${tab === t ? "bg-white text-primary" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-4">
            {/* Main row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Location */}
              <div className="md:col-span-2 flex items-center gap-2 bg-muted rounded-xl px-4 h-12 border border-border">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="text"
                  placeholder="Search city, district or area..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  list="locations-list"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none h-full"
                />
                <datalist id="locations-list">
                  {LOCATIONS.map((l) => <option key={l} value={l} />)}
                </datalist>
              </div>
              {/* Type */}
              <div className="flex items-center bg-muted rounded-xl px-4 h-12 border border-border relative">
                <select value={propType} onChange={(e) => setPropType(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground focus:outline-none appearance-none cursor-pointer h-full">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-4 pointer-events-none" />
              </div>
              {/* Search Button */}
              <Button onClick={handleSearch} className="h-12 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-md text-base">
                <Search className="w-5 h-5 mr-2" /> Search
              </Button>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground relative">
                <span className="text-muted-foreground">Price:</span>
                <select value={price} onChange={(e) => setPrice(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer appearance-none pr-4 text-foreground">
                  {(tab === "Buy" ? PRICES_SALE : PRICES_RENT).map((p) => <option key={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 pointer-events-none" />
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground relative">
                <span className="text-muted-foreground">Radius:</span>
                <select value={radius} onChange={(e) => setRadius(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer appearance-none pr-4 text-foreground">
                  {RADII.map((r) => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 pointer-events-none" />
              </div>
              {["Verified Only", "New Listings"].map((f) => (
                <button key={f} className="bg-white border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
                  {f}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trending */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-2 mt-6 text-sm text-white/70">
          <span className="font-medium">Popular:</span>
          {["Colombo 7", "Rajagiriya", "Galle Fort", "Kandy", "Negombo"].map((a) => (
            <button key={a} onClick={() => router.push(`/search?district=${a}`)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm border border-white/15 transition-colors">
              {a}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
