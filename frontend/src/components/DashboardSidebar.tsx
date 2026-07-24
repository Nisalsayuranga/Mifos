'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Wallet, 
  ArrowRightLeft, 
  FileText, 
  Settings, 
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  History,
  ShieldCheck,
  UserCircle,
  PiggyBank,
  CheckSquare,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Growth', href: '/dashboard/executive', icon: TrendingUp },
    ]
  },
  {
    label: "Finance",
    items: [
      { name: 'Customers', href: '/clients', icon: Users },
      { name: 'Pawnes', href: '/loans', icon: Wallet },
      { name: 'Accounts', href: '/savings', icon: PiggyBank },
      { name: 'Records', href: '/accounting/ledger?tab=journal', icon: FileText },
      { name: 'Ledger Entry', href: '/accounting/ledger?tab=entry', icon: FileSpreadsheet },
      { name: 'Ledger Matrix', href: '/accounting/ledger?tab=matrix', icon: Layers },
    ]
  },
  {
    label: "Transactions",
    items: [
      { name: 'Transaction History', href: '/transactions', icon: ArrowRightLeft },
      { name: 'Money Transfers', href: '/transactions/transfers', icon: History },
    ]
  },
  {
    label: "Operations",
    items: [
      { name: 'Approvals', href: '/operations/approvals', icon: CheckSquare },
      { name: 'End-of-Day', href: '/operations/eod', icon: ShieldCheck },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Staff', href: '/employees', icon: Users, adminOnly: true },
    ]
  }
];

export default function DashboardSidebar({ 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: { 
  isCollapsed: boolean, 
  setIsCollapsed: (v: boolean) => void,
  isMobileOpen?: boolean,
  setIsMobileOpen?: (v: boolean) => void
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const groupIcons: { [key: string]: any } = {
    "Overview": LayoutDashboard,
    "Finance": Wallet,
    "Transactions": ArrowRightLeft,
    "Operations": ShieldCheck
  };

  useEffect(() => {
    const active = navGroups.find(group => 
      group.items.some(item => pathname === item.href)
    );
    if (active) {
      setOpenGroup(active.label);
    }
  }, [pathname]);

  const handleGroupClick = (label: string) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    
    syncUser();
    
    // Listen for storage changes from other components (like ProfilePage)
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-950 text-slate-300 transition-all duration-500 ease-in-out z-50 flex flex-col shadow-2xl overflow-hidden border-r border-white/5 font-sans",
        isCollapsed ? "md:w-24" : "md:w-72",
        isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Branding Section */}
      <div className={cn(
        "h-20 flex items-center mb-1 relative shrink-0 transition-all duration-500",
        isCollapsed ? "justify-center" : "px-6"
      )}>
        <div className={cn(
          "flex items-center w-full",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/30 ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent" />
              <span className="text-white font-black text-sm tracking-tighter relative z-10">RP</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-white font-black tracking-tighter text-lg leading-none">RUPASINGHE</span>
                <span className="text-primary text-[8px] font-black uppercase tracking-[0.2em] opacity-90 mt-0.5">Management Hub</span>
              </div>
            )}
          </div>
          
          {/* Top Toggle Button (Desktop only) */}
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all group animate-in fade-in zoom-in duration-500 hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Close button (Mobile only) */}
          <button 
            onClick={() => setIsMobileOpen?.(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all group md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto pt-4 scrollbar-hide pb-6">
        {navGroups.map((group) => {
          const GroupIcon = groupIcons[group.label] || LayoutDashboard;
          const isGroupActive = group.items.some(item => pathname === item.href);
          const isOpen = openGroup === group.label;

          return (
            <div 
              key={group.label} 
              className="space-y-1"
            >
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => handleGroupClick(group.label)}
                className={cn(
                  "w-full flex items-center h-9.5 rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer",
                  isCollapsed ? "justify-center" : "px-4 justify-between",
                  isGroupActive 
                    ? "bg-white/10 text-white font-bold border border-white/5" 
                    : "hover:bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                <div className="flex items-center">
                  <GroupIcon className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-300",
                    isGroupActive ? "text-primary" : "text-slate-500",
                    !isCollapsed && "mr-3.5"
                  )} />
                  {!isCollapsed && (
                    <span className="font-bold text-[12.5px] tracking-tight">{group.label}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <ChevronRight className={cn(
                    "w-3.5 h-3.5 text-slate-500 transition-transform duration-300",
                    isOpen && "rotate-90"
                  )} />
                )}
              </button>

              {/* Sub-items sliding container */}
              <div className={cn(
                "grid transition-all duration-300 ease-in-out overflow-hidden",
                isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              )}>
                <div className="overflow-hidden space-y-1 pl-3 border-l border-white/5 ml-5">
                  {group.items.map((item) => {
                    if (item.adminOnly && user?.role !== 'ADMIN') return null;
                    const isActive = pathname === item.href;
                    const SubIcon = item.icon;
                    
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => {
                          if (window.innerWidth < 768 && setIsMobileOpen) {
                            setIsMobileOpen(false);
                          }
                        }}
                        className={cn(
                          "group flex items-center h-8.5 rounded-lg transition-all duration-300 relative overflow-hidden",
                          isCollapsed ? "justify-center" : "px-3",
                          isActive 
                            ? "bg-primary text-white shadow-xs" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <SubIcon className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-all duration-300 group-hover:scale-105",
                          isActive ? "text-white" : "text-slate-500 group-hover:text-primary",
                          !isCollapsed && "mr-3"
                        )} />
                        {!isCollapsed && (
                          <span className="font-bold text-[12px] tracking-tight">{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile & Footer */}
      <div className="p-3 border-t border-white/5 space-y-2 bg-black/20 shrink-0">
        {!isCollapsed && user && (
          <Link 
            href="/profile"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
              {user.avatar_url || user.avatarUrl ? (
                <img 
                  src={user.avatar_url || user.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              )}
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-950 shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-xs truncate tracking-tight group-hover:text-primary transition-colors">
                {user.firstName || user.first_name || 'User'}
              </span>
              <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest truncate">
                {user.role || 'Staff'}
              </span>
            </div>
          </Link>
        )}

        <div className="flex flex-col gap-1">
          {/* Bottom Toggle Button (Only when closed) */}
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="flex items-center justify-center w-full h-9 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all group"
            >
              <ChevronRight className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
          )}
          
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full h-9 rounded-xl transition-all group",
              isCollapsed ? "justify-center" : "px-4",
              "hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
            )}
          >
            <LogOut className={cn(
              "w-4 h-4 shrink-0 transition-transform group-hover:rotate-12",
              !isCollapsed && "mr-3.5"
            )} />
            {!isCollapsed && <span className="font-bold text-[12.5px]">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
