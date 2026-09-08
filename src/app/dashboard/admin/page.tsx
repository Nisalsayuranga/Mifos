"use client";
import Link from "next/link";
import { PROPERTIES } from "@/lib/data";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Building, ShieldCheck, Users, Clock, DollarSign, TrendingUp, ArrowRight, Eye } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { adaptProperty } from "@/lib/adapters";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [totalProperties, setTotalProperties] = useState(0);
  const [pending, setPending] = useState<any[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingVal, setPendingVal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Total properties
      const { count: tProps } = await supabase.from("properties").select("*", { count: "exact", head: true });
      setTotalProperties(tProps || 0);

      // Approved properties
      const { count: aProps } = await supabase.from("properties").select("*", { count: "exact", head: true }).in("status", ["approved", "published"]);
      setApprovedCount(aProps || 0);

      // Pending properties
      const { data: pProps } = await supabase.from("properties").select("*, property_images(storage_path)").eq("status", "submitted");
      if (pProps) setPending(pProps.map(p => adaptProperty(p)));

      // Total users
      const { count: uCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setTotalUsers(uCount || 0);

      // Pending valuations
      const { count: vCount } = await supabase.from("valuation_requests").select("*", { count: "exact", head: true }).eq("status", "submitted");
      setPendingVal(vCount || 0);

      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and pending actions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DashboardCard title="Total Properties" value={totalProperties} icon={Building} color="green" />
        <DashboardCard title="Pending Reviews" value={pending.length} icon={Clock} color="amber" subtitle="Needs action" />
        <DashboardCard title="Approved Listings" value={approvedCount} icon={ShieldCheck} color="green" />
        <DashboardCard title="Total Users" value={totalUsers} icon={Users} color="blue" />
        <DashboardCard title="Valuation Reqs" value={pendingVal} icon={TrendingUp} color="purple" />
        <DashboardCard title="Revenue (Demo)" value="LKR 1.2M" icon={DollarSign} color="sand" />
      </div>

      {/* Pending Verifications — Priority Section */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
              <h2 className="font-bold text-amber-900 font-heading">Pending Verifications ({pending.length})</h2>
            </div>
            <Link href="/dashboard/admin/verifications" className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">Review All<ArrowRight className="w-4 h-4"/></Link>
          </div>
          <div className="divide-y divide-amber-100">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-amber-100/50 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0 border border-amber-200" style={{ backgroundImage: `url(${p.images[0]})` }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.location} · {p.priceLabel}</p>
                  <p className="text-xs text-muted-foreground">Submitted: {p.createdAt}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status="pending" />
                  <Link href="/dashboard/admin/verifications">
                    <button className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                      <Eye className="w-3 h-3"/>Review
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Properties */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground font-heading">All Properties</h2>
          <Link href="/dashboard/admin/properties" className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">Manage<ArrowRight className="w-4 h-4"/></Link>
        </div>
        <div className="divide-y divide-border">
          {PROPERTIES.slice(0, 6).map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="w-12 h-10 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.location} · {p.priceLabel}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={p.status} />
                <Link href={`/properties/${p.id}`} className="text-xs text-primary hover:underline">View</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}