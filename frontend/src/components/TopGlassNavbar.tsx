'use client';

import { useState, useEffect, useRef } from 'react';
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
  Menu,
  X,
  User,
  Building2,
  Smartphone
} from 'lucide-react';

const navGroups = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Executive Growth', href: '/dashboard/executive', icon: TrendingUp },
    ]
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { name: 'Customers KYC', href: '/clients', icon: Users },
      { name: 'Pawns & Loans', href: '/loans', icon: Wallet },
      { name: 'Savings & Accounts', href: '/savings', icon: PiggyBank },
      { name: 'Journal Records', href: '/accounting/ledger?tab=journal', icon: FileText },
      { name: 'Ledger Entry', href: '/accounting/ledger?tab=entry', icon: FileSpreadsheet },
      { name: '11-Branch Matrix', href: '/accounting/ledger?tab=matrix', icon: Layers },
      { name: 'Financial Statements', href: '/accounting/reports', icon: BarChart3 },
    ]
  },
  {
    label: "Transactions",
    icon: ArrowRightLeft,
    items: [
      { name: 'Transaction History', href: '/transactions', icon: ArrowRightLeft },
      { name: 'Money Transfers', href: '/transactions/transfers', icon: History },
    ]
  },
  {
    label: "CCTV Surveillance",
    icon: Camera,
    items: [
      { name: 'Camera Registry', href: '/cctv/cameras', icon: Camera },
      { name: 'Evidence Playback', href: '/cctv/recordings', icon: PlaySquare },
      { name: 'Live View & PTZ', href: '/cctv/live', icon: Eye },
      { name: 'CCTV Audit Logs', href: '/cctv/audit-logs', icon: FileText },
      { name: 'CCTV Settings', href: '/cctv/settings', icon: Settings, adminOnly: true },
    ]
  },
  {
    label: "Operations",
    icon: ShieldCheck,
    items: [
      { name: 'User & Staff Management', href: '/employees', icon: Users, adminOnly: true },
      { name: 'Free SMS Gateway', href: '/operations/sms-settings', icon: Smartphone, adminOnly: true },
      { name: 'Approvals', href: '/operations/approvals', icon: CheckSquare },
      { name: 'End-of-Day (EOD)', href: '/operations/eod', icon: ShieldCheck },
      { name: 'Security Audit Logs', href: '/operations/audit-logs', icon: ShieldCheck },
      { name: 'Portfolio Reports', href: '/reports', icon: BarChart3 },
    ]
  }
];

export default function TopGlassNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) { console.error('Failed to parse user session', e); }
      }
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <header className="sticky top-3 z-50 mx-3 md:mx-6 my-2">
      {/* Glassmorphic Navbar Container */}
      <nav className="glass-dark bg-slate-950/90 backdrop-blur-2xl border border-amber-500/20 shadow-2xl rounded-2xl md:rounded-3xl px-4 md:px-6 py-2.5 flex items-center justify-between transition-all duration-300">
        
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/30 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 blur-xs" />
            <span className="text-slate-950 font-black text-sm tracking-tighter relative z-10">RP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black tracking-tighter text-base md:text-lg leading-none group-hover:text-amber-400 transition-colors">
              RUPASINGHE
            </span>
            <span className="text-amber-400 text-[8px] font-black uppercase tracking-[0.2em] opacity-90 mt-0.5">
              Management Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Group Dropdowns */}
        <div className="hidden lg:flex items-center gap-1.5" ref={dropdownRef}>
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupActive = group.items.some(item => pathname === item.href);
            const isOpen = activeDropdown === group.label;

            return (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(isOpen ? null : group.label)}
                  onMouseEnter={() => setActiveDropdown(group.label)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer outline-none",
                    isGroupActive || isOpen
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
                  )}
                >
                  <GroupIcon className={cn("w-4 h-4", isGroupActive ? "text-amber-400" : "text-slate-400")} />
                  <span>{group.label}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu Popup */}
                {isOpen && (
                  <div 
                    onMouseLeave={() => setActiveDropdown(null)}
                    className="absolute top-full left-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-2xl border border-amber-500/25 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 mb-1">
                      {group.label} Menu
                    </div>
                    {group.items.map((item) => {
                      if (item.adminOnly && user?.role !== 'ADMIN') return null;
                      const isItemActive = pathname === item.href;
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 mb-0.5",
                            isItemActive
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <ItemIcon className={cn("w-4 h-4 shrink-0", isItemActive ? "text-amber-400" : "text-slate-400")} />
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

        {/* Right Section: Branch Badge, Profile & Logout */}
        <div className="flex items-center gap-3">
          
          {/* Active Branch Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono text-xs font-black">
            <Building2 className="w-3.5 h-3.5" />
            <span>{user?.branchId || user?.branch_id || 'HQ'}</span>
          </div>

          {/* User Profile Pill */}
          <Link 
            href="/profile"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-200 max-w-28 truncate">
              {user?.email ? user.email.split('@')[0] : 'User'}
            </span>
            <span className="text-[9px] font-black bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              {user?.role || 'TELLER'}
            </span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="p-2.5 rounded-xl bg-white/10 text-white lg:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-3 top-20 z-50 bg-slate-950/95 backdrop-blur-2xl border border-amber-500/25 rounded-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto space-y-5 animate-in slide-in-from-top-4 duration-200">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-1">
                {group.label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.items.map((item) => {
                  if (item.adminOnly && user?.role !== 'ADMIN') return null;
                  const isItemActive = pathname === item.href;
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                        isItemActive
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <ItemIcon className={cn("w-4 h-4 shrink-0", isItemActive ? "text-amber-400" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
