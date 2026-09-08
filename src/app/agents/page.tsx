"use client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ShieldCheck, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadAgents() {
      const supabase = createClient();
      const { data } = await supabase
        .from("agents")
        .select(`
          *,
          profiles (*)
        `)
        .eq("is_verified", true);

      if (data) {
        setAgents(data.map((a: any) => ({
          id: a.id,
          name: a.profiles?.full_name || "Unknown",
          title: a.bio || "Property Consultant",
          exp: a.experience_years ? `${a.experience_years} Years` : "N/A",
          area: a.service_areas?.join(", ") || "Sri Lanka",
          rating: a.rating || 4.5,
          reviews: a.total_reviews || 0,
          sold: 0, // No sold count in DB yet
          img: a.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.profiles?.full_name || "Agent")}&background=random`
        })));
      }
      setLoading(false);
    }
    loadAgents();
  }, []);

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-20 bg-muted/30">
        <div className="bg-primary pt-16 pb-24 px-4 md:px-6 mb-[-60px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-10 w-96 h-96 rounded-full bg-white blur-3xl"/>
          </div>
          <div className="container mx-auto max-w-6xl relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white font-heading mb-4">Find an Expert Agent</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">Connect with PROPIX verified real estate professionals who know the local market inside out.</p>
            
            <div className="mt-8 max-w-2xl mx-auto flex items-center bg-white rounded-xl p-2 shadow-xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-muted-foreground"/>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or location..."
                  className="w-full h-10 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {search && (
                <button onClick={() => setSearch("")} className="px-3 text-muted-foreground hover:text-foreground text-xs font-medium">Clear</button>
              )}
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-lg h-10 px-6 font-bold">Search</Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-10">Loading agents...</div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-10">{search ? `No agents match "${search}"` : "No agents found."}</div>
            ) : filtered.map((agent: any) => (
              <div key={agent.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-cover bg-center shrink-0 border border-border" style={{ backgroundImage: `url(${agent.img})` }}/>
                  <div>
                    <h2 className="font-bold text-foreground font-heading group-hover:text-primary transition-colors flex items-center gap-1.5">{agent.name} <ShieldCheck className="w-4 h-4 text-emerald-500"/></h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.title}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500"/> {agent.rating} <span className="text-muted-foreground font-normal">({agent.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="font-bold text-foreground text-sm">{agent.exp}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
                    <p className="text-xs text-muted-foreground">Properties Sold</p>
                    <p className="font-bold text-foreground text-sm">{agent.sold}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
                  <MapPin className="w-4 h-4 text-primary shrink-0"/> {agent.area}
                </div>
                <div className="flex gap-2">
                  <Link href="/consultation" className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-10 font-semibold text-xs">Book Consultation</Button>
                  </Link>
                  {agent.phone ? (
                    <a href={`tel:${agent.phone}`}>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Phone className="w-4 h-4 text-muted-foreground"/></Button>
                    </a>
                  ) : (
                    <Link href="/consultation">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Phone className="w-4 h-4 text-muted-foreground"/></Button>
                    </Link>
                  )}
                  {agent.email ? (
                    <a href={`mailto:${agent.email}`}>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Mail className="w-4 h-4 text-muted-foreground"/></Button>
                    </a>
                  ) : (
                    <Link href="/consultation">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Mail className="w-4 h-4 text-muted-foreground"/></Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center max-w-3xl mx-auto">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mb-4"/>
            <h2 className="text-2xl font-bold font-heading text-emerald-900 mb-2">PROPIX Verified Agents</h2>
            <p className="text-sm text-emerald-700 leading-relaxed max-w-xl">Every agent listed on our platform is legally verified, professionally licensed by the Estate Agents Registration Board (EARB), and continuously reviewed by our community.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
