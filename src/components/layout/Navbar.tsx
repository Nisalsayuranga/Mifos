"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Home, Search, Tag, BarChart2, DollarSign, Users, LogIn, UserPlus, LayoutDashboard, LogOut, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Buy",         href: "/search?type=sale",   icon: Home },
  { label: "Sell",        href: "/listings/new",       icon: Tag },
  { label: "Valuation",   href: "/valuation",          icon: BarChart2 },
  { label: "Financing",   href: "/financing",          icon: DollarSign },
  { label: "Find an Agent", href: "/agents",           icon: Users },
  { label: "Map",           href: "/map",              icon: Map },
];

import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; userType: string } | null>(null);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const role = authUser.user_metadata?.role || "buyer";
        const name = authUser.user_metadata?.full_name || "User";
        setUser({ name, userType: role });
      } else {
        setUser(null);
      }
    }
    loadUser();
  }, [pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/auth";
  };

  const isTransparent = isHomePage && !scrolled;

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isTransparent ? "bg-transparent" : "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
    )}>
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm font-heading">P</span>
          </div>
          <span className={cn("font-bold text-xl tracking-tight font-heading hidden sm:block", isTransparent ? "text-white" : "text-primary")}>
            PROPIX
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isTransparent
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : pathname.startsWith(link.href.split("?")[0]) && link.href !== "/"
                    ? "text-primary bg-primary/8 font-semibold"
                    : "text-foreground/80 hover:text-primary hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden lg:flex items-center gap-2">
              <Link href={`/dashboard/${user.userType}`}>
                <Button variant="ghost" size="sm" className={cn("gap-2", isTransparent ? "text-white hover:bg-white/10" : "")}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <div className={cn("text-sm font-medium px-3 py-1.5 rounded-lg", isTransparent ? "text-white/80" : "text-muted-foreground")}>
                {user.name.split(" ")[0]}
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className={isTransparent ? "text-white hover:bg-white/10" : ""}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/auth">
                <Button variant="ghost" size="sm" className={cn(isTransparent ? "text-white hover:bg-white/10" : "")}>
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                  <UserPlus className="w-4 h-4 mr-1.5" /> Create Account
                </Button>
              </Link>
            </div>
          )}

          {/* List CTA */}
          <Link href="/listings/new" className="hidden md:block">
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold ml-1">
              List Property
            </Button>
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className={cn("lg:hidden p-2 rounded-lg", isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted")}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-white border-t border-border shadow-xl">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted hover:text-primary transition-colors">
                <link.icon className="w-4 h-4 text-primary" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {user ? (
                <>
                  <Link href={`/dashboard/${user.userType}`} onClick={() => setOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">Dashboard</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => { logout(); setOpen(false); }}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/auth" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">Create Account</Button>
                  </Link>
                </>
              )}
              <Link href="/listings/new" onClick={() => setOpen(false)}>
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">List Your Property</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
