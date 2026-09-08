"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Home, PlusCircle, BarChart2, Users, MessageSquare,
  CreditCard, User, ShieldCheck, FileText, Building, Menu, X, LogOut, Bell, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const SELLER_NAV = [
  { label: "DASHBOARD",       href: "/dashboard/seller",          icon: LayoutDashboard },
  { label: "My Listings",     href: "/dashboard/seller/listings", icon: Home },
  { label: "Add Property",    href: "/listings/new",              icon: PlusCircle },
  { label: "Valuations",      href: "/valuation",                 icon: BarChart2 },
  { label: "Consultations",   href: "/consultation",              icon: Users },
  { label: "Payments",        href: "/payment",                   icon: CreditCard },
];
const BUYER_NAV = [
  { label: "Overview",        href: "/dashboard/buyer",  icon: LayoutDashboard },
  { label: "Saved Properties",href: "/search",            icon: Home },
  { label: "Viewing Requests",href: "/dashboard/buyer/viewings",  icon: MessageSquare },
  { label: "Consultations",   href: "/consultation",     icon: Users },
  { label: "Financing",       href: "/financing",        icon: CreditCard },
  { label: "Find Property",   href: "/search",           icon: Building },
  { label: "Profile",         href: "/dashboard/buyer/profile",  icon: User },
];
const ADMIN_NAV = [
  { label: "Overview",        href: "/dashboard/admin",                    icon: LayoutDashboard },
  { label: "Verifications",   href: "/dashboard/admin/verifications",      icon: ShieldCheck },
  { label: "Properties",      href: "/dashboard/admin/properties",         icon: Building },
  { label: "Users",           href: "/dashboard/admin/users",              icon: Users },
  { label: "Valuation Reqs",  href: "/valuation",                          icon: BarChart2 },
  { label: "Buyer Requests",  href: "/dashboard/admin",                    icon: MessageSquare },
  { label: "Payments",        href: "/payment",                            icon: CreditCard },
  { label: "Reports",         href: "/dashboard/admin",                    icon: FileText },
];
const AGENT_NAV = [
  { label: "Overview",        href: "/dashboard/agent",  icon: LayoutDashboard },
  { label: "My Clients",      href: "/dashboard/agent",  icon: Users },
  { label: "Consultations",   href: "/consultation",     icon: MessageSquare },
  { label: "Properties",      href: "/search",           icon: Building },
  { label: "Profile",         href: "/dashboard/agent",  icon: User },
];

const NAV_MAP: Record<string, typeof SELLER_NAV> = {
  seller: SELLER_NAV, buyer: BUYER_NAV, admin: ADMIN_NAV, agent: AGENT_NAV,
};
const ROLE_LABEL: Record<string, string> = {
  seller: "Seller", buyer: "Buyer", admin: "Admin", agent: "Agent",
};

import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; userType: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const role = authUser.user_metadata?.role || "buyer";
        const name = authUser.user_metadata?.full_name || "User";
        setUser({ name, email: authUser.email || "", userType: role });
      } else {
        router.push("/auth");
      }
    }
    loadUser();
  }, [router]);

  const role = user?.userType ?? "buyer";
  const nav = NAV_MAP[role] ?? BUYER_NAV;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><span className="text-white font-bold font-heading">P</span></div>
          <span className="font-bold text-xl text-primary font-heading">PROPIX</span>
        </Link>
        {user && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{user.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full">{ROLE_LABEL[role]}</span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active ? "bg-primary text-white shadow-sm" : "text-foreground hover:bg-muted hover:text-primary"
              )}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push("/auth");
        }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors w-full">
          <LogOut className="w-4 h-4" /><span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border fixed top-0 left-0 h-full z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-2xl flex flex-col"><SidebarContent /></aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-border sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted"><Menu className="w-5 h-5" /></button>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-foreground capitalize">{ROLE_LABEL[role]} Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors">View Site</Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}