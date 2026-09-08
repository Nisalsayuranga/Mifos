"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getFeaturedProperties, VALUATION_REQUESTS, CONSULTATION_REQUESTS } from "@/lib/data";
import { PropertyCard } from "@/components/property/PropertyCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Heart, Search, Calendar, MessageSquare, DollarSign, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { createClient } from "@/lib/supabase/client";
import { adaptProperty } from "@/lib/adapters";

export default function BuyerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [viewingRequests, setViewingRequests] = useState(0);
  const [scheduledViewings, setScheduledViewings] = useState(0);
  const [activeInquiries, setActiveInquiries] = useState(0);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [financingStatus, setFinancingStatus] = useState("None");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ name: user.user_metadata?.full_name || "Buyer", email: user.email });

        // Fetch saved properties
        const { data: savedData } = await supabase
          .from("saved_properties")
          .select(`properties(*, property_images(storage_path))`)
          .eq("user_id", user.id)
          .limit(3);
        if (savedData) {
          setSaved(savedData.map((s: any) => adaptProperty(s.properties)));
        }

        // Fetch viewing requests (assuming viewing_requests table or just count inquiries as mock)
        // Wait, viewing_requests table exists. Let's count them.
        const { count: vrCount } = await supabase.from("viewing_requests").select("*", { count: "exact", head: true }).eq("buyer_id", user.id);
        setViewingRequests(vrCount || 0);

        // Fetch inquiries
        const { count: inqCount } = await supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("buyer_id", user.id);
        setActiveInquiries(inqCount || 0);

        // Fetch consultations
        const { data: consData } = await supabase
          .from("consultation_requests")
          .select("*, properties(title)")
          .eq("requested_by", user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        
        if (consData) {
          setConsultations(consData.map((c: any) => ({
            id: c.id,
            propertyTitle: c.properties?.title || "General Consultation",
            consultationType: c.consultation_type,
            requestedAt: new Date(c.created_at).toLocaleDateString(),
            scheduledDate: c.preferred_date || "",
            status: c.status
          })));
        }

        // Fetch financing status
        const { data: finData } = await supabase
          .from("financing_requests")
          .select("status")
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (finData) {
          setFinancingStatus(finData.status === "approved" ? "Approved" : finData.status === "rejected" ? "Rejected" : "Under review");
        }
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Welcome, {user?.name?.split(" ")[0] ?? "Buyer"} 👋</h1>
          <p className="text-muted-foreground mt-1">Find your dream property and track your inquiries here.</p>
        </div>
        <Link href="/search"><Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"><Search className="w-4 h-4"/>Search Properties</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Saved Properties" value={saved.length} icon={Heart} color="red" />
        <DashboardCard title="Viewing Requests" value={viewingRequests} icon={Calendar} color="blue" />
        <DashboardCard title="Active Inquiries" value={activeInquiries} icon={MessageSquare} color="green" />
        <DashboardCard title="Financing Status" value={financingStatus} icon={DollarSign} color="sand" />
      </div>

      {/* Saved Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground text-xl font-heading">Saved Properties</h2>
          <Link href="/search" className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">Browse More<ArrowRight className="w-4 h-4"/></Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {saved.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-muted-foreground bg-white rounded-xl border border-border">No saved properties yet.</div>
          ) : (
            saved.map(p => <PropertyCard key={p.id} property={p} />)
          )}
        </div>
      </div>

      {/* Consultations */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground font-heading">My Consultations</h2>
          <Link href="/consultation" className="text-sm text-primary font-semibold">Book New</Link>
        </div>
        <div className="divide-y divide-border">
          {consultations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">You have no consultation requests.</div>
          ) : (
            consultations.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                <div>
                  <p className="font-medium text-foreground text-sm">{c.propertyTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.consultationType} consultation · {c.requestedAt}</p>
                  {c.scheduledDate && <p className="text-xs text-primary mt-0.5 font-medium">Scheduled: {c.scheduledDate}</p>}
                </div>
                <StatusBadge status={c.status as any} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Search, label: "Search Properties", sub: "Browse all listings", href: "/search", color: "bg-primary/10 text-primary" },
          { icon: DollarSign, label: "Financing Options", sub: "Explore loan referrals", href: "/financing", color: "bg-secondary/20 text-secondary" },
          { icon: Calendar, label: "Book Consultation", sub: "Talk to an expert agent", href: "/consultation", color: "bg-accent/15 text-accent" },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all hover:border-primary/30 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${a.color}`}><a.icon className="w-5 h-5"/></div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}