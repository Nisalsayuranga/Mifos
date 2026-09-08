"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Eye, MessageSquare, PlusCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatLKR } from "@/lib/data";

export default function SellerListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  useEffect(() => {
    async function fetchListings() {
      const supabase = createClient();

      // Get the real authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const sellerId = user.id;
      
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images (storage_path)
        `)
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setListings(data.map(d => ({
          ...d,
          images: d.property_images?.map((img: any) => img.storage_path) || [],
          status: d.status === "published" ? "approved" : (d.status === "submitted" ? "pending" : d.status),
          inquiries: d.inquiries_count || 0,
          createdAt: new Date(d.created_at).toISOString().split('T')[0],
          priceLabel: d.price_label || formatLKR(d.price)
        })));
      }
      setLoading(false);
    }
    fetchListings();
  }, []);

  const filtered = filter === "all" ? listings : listings.filter(p => p.status === filter);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">My Listings</h1>
          <p className="text-muted-foreground mt-1">{listings.length} total properties</p>
        </div>
        <Link href="/listings/new"><Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"><PlusCircle className="w-4 h-4"/>Add Property</Button></Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["all","approved","pending","rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize border transition-all ${filter === s ? "bg-primary text-white border-primary" : "bg-white border-border text-foreground hover:border-primary"}`}>{s === "all" ? "All" : s}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-border shadow-sm divide-y divide-border">
        {loading ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-foreground font-semibold">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-4xl mb-3">🏡</p><p className="text-foreground font-bold">No listings found</p><p className="text-muted-foreground text-sm mt-1">Try adjusting your filter.</p></div>
        ) : filtered.map((p) => (
          <div key={p.id} className="flex items-start gap-4 p-5 hover:bg-muted/20 transition-colors">
            <div className="w-20 h-16 rounded-xl bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-foreground">{p.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.address}</p>
                  <p className="text-sm font-bold text-primary mt-1">{p.priceLabel}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3.5 h-3.5"/>{p.views} views</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5"/>{p.inquiries} inquiries</span>
                <span className="text-xs text-muted-foreground">Listed: {p.createdAt}</span>
                {p.status === "rejected" && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">Resubmit required</span>}
              </div>
            </div>
            <Link href={`/properties/${p.id}`} className="shrink-0 flex items-center gap-1 text-xs text-primary font-semibold hover:underline"><ArrowRight className="w-3.5 h-3.5"/></Link>
          </div>
        ))}
      </div>
    </div>
  );
}