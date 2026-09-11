'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
  PiggyBank,
  FileText,
  FileSpreadsheet,
  Layers,
  BarChart3,
  ArrowRightLeft,
  History,
  Camera,
  PlaySquare,
  Eye,
  Settings,
  CheckSquare,
  ShieldCheck,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
  Building2,
  Smartphone,
  Package
} from 'lucide-react';

const navGroups = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { name: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Portfolio Growth', href: '/dashboard/executive', icon: TrendingUp },
    ]
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { name: 'Customers', href: '/clients', icon: Users },
      { name: 'Pawnings', href: '/loans', icon: Wallet },
      { name: 'Journal Records', href: '/accounting/ledger?tab=journal', icon: FileText },
      { name: 'Ledger Entry', href: '/accounting/ledger?tab=entry', icon: FileSpreadsheet },
      { name: 'Branch Matrix', href: '/accounting/ledger?tab=matrix', icon: Layers },
      { name: 'Financial Statements', href: '/accounting/reports', icon: BarChart3 },
    ]
  },
  {
    label: "Stock Management",
    icon: Package,
    items: [
      { name: 'Pawn Stock', href: '/operations/eod?tab=stock', icon: Package },
    ]
  },
  {
    label: "Transactions",
    icon: ArrowRightLeft,
    items: [
      { name: 'Transaction History', href: '/transactions', icon: ArrowRightLeft },
    ]
  },
  {
    label: "CCTV",
    icon: Camera,
    items: [
      { name: 'Camera Registry', href: '/cctv/cameras', icon: Camera },
      { name: 'Evidence Playback', href: '/cctv/recordings', icon: PlaySquare },
      { name: 'Live View', href: '/cctv/live', icon: Eye },
      { name: 'CCTV Audit Logs', href: '/cctv/audit-logs', icon: FileText },
      { name: 'Settings', href: '/cctv/settings', icon: Settings, adminOnly: true },
    ]
  },
  {
    label: "Operations",
    icon: ShieldCheck,
    items: [
      { name: 'Staff Management', href: '/employees', icon: Users, adminOnly: true },
      { name: 'SMS Gateway', href: '/operations/sms-settings', icon: Smartphone, adminOnly: true },
      { name: 'Dual Approvals', href: '/operations/approvals', icon: CheckSquare },
      { name: 'End-of-Day', href: '/operations/eod', icon: ShieldCheck },
      { name: 'Audit Logs', href: '/operations/audit-logs', icon: ShieldCheck },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ]
  }
];

const auditorNavItems = [
  { name: 'Customers', href: '/clients', icon: Users },
  { name: 'Pawnings', href: '/loans', icon: Wallet },
  { name: 'Vault Stock', href: '/operations/eod?tab=stock', icon: Layers },
  { name: 'Audit Logs', href: '/operations/audit-logs', icon: ShieldCheck },
];

export default function TopGlassNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Open correct group on mobile based on current path
  useEffect(() => {
    const active = navGroups.find(g => g.items.some(i => pathname === i.href || pathname.startsWith(i.href.split('?')[0])));
    if (active) setOpenMobileGroup(active.label);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href.split('?')[0]);

  return (
    <>
      {/* ─── TOP NAVBAR ─── */}
      <header className="sticky top-0 z-50 w-full">
        <div className="mx-2 mt-2 sm:mx-4 sm:mt-3">
          <nav className="bg-slate-950/95 backdrop-blur-2xl border border-amber-500/20 shadow-2xl shadow-black/40 rounded-2xl px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">

            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="h-9 w-9 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/20 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 blur-xs" />
                <span className="text-slate-950 font-black text-sm tracking-tighter relative z-10">RP</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-black tracking-tighter text-base group-hover:text-amber-400 transition-colors">
                  RUPASINGHE
                </span>
                <span className="text-amber-400 text-[8px] font-black uppercase tracking-[0.18em] mt-0.5">
                  Management Hub
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav Groups (≥ lg) ── */}
            {user?.role === 'AUDITOR' ? (
              <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
                {auditorNavItems.map((item) => {
                  const active = isActive(item.href);
                  const ItemIcon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-200",
                        active
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
                      )}>
                      <ItemIcon className={cn("w-3.5 h-3.5", active ? "text-amber-400" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
                {navGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const groupActive = group.items.some(i => isActive(i.href));
                  const isOpen = activeDropdown === group.label;

                  return (
                    <div key={group.label} className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(isOpen ? null : group.label)}
                        onMouseEnter={() => setActiveDropdown(group.label)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer outline-none select-none",
                          groupActive || isOpen
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                            : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
                        )}>
                        <GroupIcon className={cn("w-3.5 h-3.5", groupActive ? "text-amber-400" : "text-slate-400")} />
                        <span>{group.label}</span>
                        <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>

                      {isOpen && (
                        <div
                          onMouseLeave={() => setActiveDropdown(null)}
                          className="absolute top-full left-0 mt-2 w-60 bg-slate-950/98 backdrop-blur-2xl border border-amber-500/25 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-500/60 border-b border-white/5 mb-1">
                            {group.label}
                          </div>
                          {group.items.map((item) => {
                            if (item.adminOnly && user?.role !== 'ADMIN') return null;
                            const active = isActive(item.href);
                            const ItemIcon = item.icon;
                            return (
                              <Link key={item.name} href={item.href}
                                onClick={() => setActiveDropdown(null)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-150 mb-0.5",
                                  active
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                                )}>
                                <ItemIcon className={cn("w-4 h-4 shrink-0", active ? "text-amber-400" : "text-slate-400")} />
                                <span className="truncate">{item.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Right: Branch + Profile + Logout + Hamburger ── */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Branch Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono text-[10px] font-black">
                <Building2 className="w-3 h-3" />
                <span>{user?.branchId || user?.branch_id || 'HQ'}</span>
              </div>

              {/* Profile Pill */}
              <Link href="/profile"
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-200 max-w-24 truncate">
                  {user?.email ? user.email.split('@')[0] : 'User'}
                </span>
                <span className="text-[9px] font-black bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  {user?.role || 'TELLER'}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="hidden sm:flex p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>

              {/* Hamburger (mobile & tablet) */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="lg:hidden p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer border border-white/10"
                aria-label="Toggle navigation menu">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ─── MOBILE FULL-SCREEN DRAWER ─── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer Panel */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-[85vw] max-w-sm bg-slate-950 border-l border-amber-500/20 shadow-2xl lg:hidden flex flex-col transition-transform duration-300 ease-out",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-black/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-slate-950 font-black text-xs tracking-tighter">RP</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black tracking-tighter text-sm">RUPASINGHE</span>
              <span className="text-amber-400 text-[8px] font-black uppercase tracking-[0.15em] mt-0.5">Management Hub</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Banner */}
        <div className="mx-4 mt-4 mb-2 flex items-center justify-between p-3 bg-white/5 border border-white/8 rounded-2xl shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-bold truncate">
                {user?.email ? user.email.split('@')[0] : 'User'}
              </span>
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                {user?.role || 'TELLER'} · {user?.branchId || user?.branch_id || 'HQ'}
              </span>
            </div>
          </div>
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all border border-white/8">
            Profile
          </Link>
        </div>

        {/* Nav Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {user?.role === 'AUDITOR' ? (
            <>
              <div className="text-[9px] font-black text-amber-400/70 uppercase tracking-widest px-1 pt-2 pb-1">
                Auditor Navigation
              </div>
              {auditorNavItems.map((item) => {
                const active = isActive(item.href);
                const ItemIcon = item.icon;
                return (
                  <Link key={item.name} href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[52px]",
                      active
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-slate-300 hover:bg-white/8 hover:text-white border border-transparent"
                    )}>
                    <ItemIcon className={cn("w-5 h-5 shrink-0", active ? "text-amber-400" : "text-slate-500")} />
                    <span>{item.name}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </Link>
                );
              })}
            </>
          ) : (
            navGroups.map((group) => {
              const GroupIcon = group.icon;
              const groupActive = group.items.some(i => isActive(i.href));
              const isOpen = openMobileGroup === group.label;

              return (
                <div key={group.label}>
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => setOpenMobileGroup(isOpen ? null : group.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer",
                      groupActive
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "hover:bg-white/5 border border-transparent"
                    )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        groupActive ? "bg-amber-500/20" : "bg-white/5"
                      )}>
                        <GroupIcon className={cn("w-4 h-4", groupActive ? "text-amber-400" : "text-slate-400")} />
                      </div>
                      <span className={cn(
                        "text-sm font-bold",
                        groupActive ? "text-amber-300" : "text-slate-300"
                      )}>
                        {group.label}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-slate-500 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )} />
                  </button>

                  {/* Sub-items */}
                  <div className={cn(
                    "grid transition-all duration-300 ease-in-out overflow-hidden",
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-1 mb-2" : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden space-y-0.5 pl-4 border-l-2 border-amber-500/20 ml-8">
                      {group.items.map((item) => {
                        if (item.adminOnly && user?.role !== 'ADMIN') return null;
                        const active = isActive(item.href);
                        const ItemIcon = item.icon;
                        return (
                          <Link key={item.name} href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px]",
                              active
                                ? "bg-amber-500/20 text-amber-300"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}>
                            <ItemIcon className={cn("w-4 h-4 shrink-0", active ? "text-amber-400" : "text-slate-500")} />
                            <span>{item.name}</span>
                            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer: Logout */}
        <div className="shrink-0 p-4 border-t border-white/8 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer font-bold text-sm">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
