"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PROPERTIES } from "@/lib/data";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Home, Clock, CheckCircle2, MessageSquare, PlusCircle, ArrowRight, Eye, TrendingUp, DollarSign, UploadCloud, ShieldCheck, UserCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const JOURNEY_STEPS = [
  { id: "add", label: "Add Property", icon: PlusCircle },
  { id: "docs", label: "Upload Docs", icon: UploadCloud },
  { id: "review", label: "Admin Review", icon: ShieldCheck },
  { id: "published", label: "Published", icon: CheckCircle2 },
  { id: "offers", label: "Receive Offers", icon: MessageSquare },
  { id: "close", label: "Close Deal", icon: UserCheck },
];

import { createClient } from "@/lib/supabase/client";
import { adaptProperty } from "@/lib/adapters";

export default function SellerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ name: user.user_metadata?.full_name || "Seller", email: user.email });
        
        // Fetch properties
        const { data: props } = await supabase
          .from("properties")
          .select(`*, property_images(storage_path)`)
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });

        if (props) {
          setMyListings(props.map(p => adaptProperty(p)));
        }

        // Fetch inquiries
        const { data: inqs } = await supabase
          .from("inquiries")
          .select(`*, properties(title)`)
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });
          
        if (inqs) {
          const reqs = inqs.map((iq: any) => ({
            id: iq.id,
            property: iq.properties?.title || "Property",
            buyer: iq.guest_name || "Buyer",
            type: "Inquiry",
            date: new Date(iq.created_at).toLocaleDateString(),
            status: iq.status
          }));
          setBuyerRequests(reqs);
        }
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  const approved = myListings.filter(p => p.status === "published" || p.status === "approved");
  const pending = myListings.filter(p => p.status === "submitted" || p.status === "under_review");
  const totalViews = myListings.reduce((s, p) => s + (p.views || 0), 0);
  const totalInquiries = myListings.reduce((s, p) => s + (p.inquiries || 0), 0);

  // Determine current active journey step based on listings
  let activeStep = 0;
  if (myListings.length === 0) activeStep = 0;
  else if (pending.length > 0) activeStep = 2; // Under review
  else if (totalInquiries > 0) activeStep = 4; // Receiving offers
  else if (approved.length > 0) activeStep = 3; // Published

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Welcome back, {user?.name?.split(" ")[0] ?? "Seller"} 👋</h1>
          <p className="text-muted-foreground mt-1">Here is your property selling control center.</p>
        </div>
        <Link href="/listings/new">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"><PlusCircle className="w-4 h-4" />Add New Property</Button>
        </Link>
      </div>

      {/* Seller Journey Tracker */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h2 className="font-bold text-foreground font-heading mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary"/> Your Selling Journey</h2>
        <div className="relative flex justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500" style={{ width: `${(activeStep / (JOURNEY_STEPS.length - 1)) * 100}%` }} />
          
          {JOURNEY_STEPS.map((step, idx) => {
            const isActive = idx === activeStep;
            const isPast = idx < activeStep;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive ? "bg-primary border-primary text-white shadow-md ring-4 ring-primary/20" : 
                  isPast ? "bg-primary border-primary text-white" : "bg-white border-muted-foreground/30 text-muted-foreground"
                }`}>
                  {isPast ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold text-center ${isActive ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Listings" value={myListings.length} icon={Home} subtitle="All properties" color="green" trend={{ value: "+2 this month", positive: true }} />
        <DashboardCard title="Pending Review" value={pending.length} icon={Clock} subtitle="Awaiting admin" color="amber" />
        <DashboardCard title="Total Views" value={totalViews.toLocaleString()} icon={Eye} subtitle="Across all listings" color="blue" trend={{ value: "+180 this week", positive: true }} />
        <DashboardCard title="Buyer Inquiries" value={totalInquiries} icon={MessageSquare} subtitle="Total received" color="purple" trend={{ value: "+5 this week", positive: true }} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Buyer Requests & Offers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-emerald-50/30">
              <div>
                <h2 className="font-bold text-foreground font-heading">Buyer Requests & Offers</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage incoming interest for your published properties.</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {buyerRequests.length === 0 ? (
                <div className="p-8 text-center"><p className="text-muted-foreground text-sm">No requests yet. Published properties will receive offers here.</p></div>
              ) : (
                buyerRequests.map((req) => (
                  <div key={req.id} className="p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${req.type === "Offer Made" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {req.type}
                        </span>
                        <p className="font-bold text-sm text-foreground mt-1.5">{req.property}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{req.date}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{req.buyer.charAt(0)}</div>
                        <span className="text-sm font-medium text-muted-foreground">{req.buyer}</span>
                      </div>
                      {req.amount && <span className="font-bold text-primary font-heading">{req.amount}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {req.type === "Offer Made" ? (
                        <>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">Accept Offer</Button>
                          <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
                        </>
                      ) : (
                        <Button size="sm" className="bg-primary text-white flex-1">Approve Viewing</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent listings */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground font-heading">Recent Listings</h2>
              <Link href="/dashboard/seller/listings" className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">View All<ArrowRight className="w-4 h-4"/></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-bold">Property</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myListings.slice(0, 3).map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
                        <div className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">{p.title}</div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/properties/${p.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {myListings.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">No listings yet. Add your first property!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Support Services */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary to-[#0f3d2b] rounded-xl p-6 text-white shadow-md">
            <TrendingUp className="w-8 h-8 text-white/80 mb-3" />
            <h3 className="font-bold font-heading text-lg mb-2">Want to sell faster?</h3>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">Book a consultation with a certified PROPIX agent to price and market your property effectively.</p>
            <Link href="/consultation">
              <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold rounded-lg shadow-sm">Book Consultation</Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:border-primary/30 transition-all">
            <DollarSign className="w-8 h-8 text-secondary mb-3" />
            <h3 className="font-bold text-foreground font-heading text-lg mb-2">Need an Official Valuation?</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Buyers trust certified valuations. Get your property evaluated by our professionals.</p>
            <Link href="/valuation">
              <Button variant="outline" className="w-full border-2 border-secondary text-secondary hover:bg-secondary/10 font-bold rounded-lg">Get Valuation</Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:border-accent/30 transition-all">
            <ArrowRight className="w-8 h-8 text-accent mb-3" />
            <h3 className="font-bold text-foreground font-heading text-lg mb-2">Feature Your Listing</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Push your property to the top of the search results to get 3x more views.</p>
            <Link href="/payment">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold rounded-lg shadow-sm">Boost Listing</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}