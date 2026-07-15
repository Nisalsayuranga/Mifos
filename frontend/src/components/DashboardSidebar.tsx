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
  TrendingUp,
  History,
  ShieldCheck,
  UserCircle,
  PiggyBank,
  CheckSquare
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
      { name: 'Records', href: '/accounting/ledger', icon: FileText },
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

export default function DashboardSidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
        isCollapsed ? "w-24" : "w-72"
      )}
    >
      {/* Branding Section */}
      <div className={cn(
        "h-28 flex items-center mb-2 relative shrink-0 transition-all duration-500",
        isCollapsed ? "justify-center" : "px-6"
      )}>
        <div className={cn(
          "flex items-center w-full",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent" />
              <span className="text-white font-black text-xl tracking-tighter relative z-10">RP</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-white font-black tracking-tighter text-2xl leading-tight">RUPASINGHE</span>
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] opacity-90">Management Hub</span>
              </div>
            )}
          </div>
          
          {/* Top Toggle Button (Only when open) */}
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all group animate-in fade-in zoom-in duration-500"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-4 space-y-10 overflow-y-auto pt-6 scrollbar-hide pb-10">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-4 text-center">
            {!isCollapsed && (
              <p className="px-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">
                {group.label}
              </p>
            )}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                if (item.adminOnly && user?.role !== 'ADMIN') return null;
                
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      "group flex items-center h-12 rounded-2xl transition-all duration-300 relative overflow-hidden",
                      isCollapsed ? "justify-center" : "px-5",
                      isActive 
                        ? "bg-primary text-white shadow-xl shadow-primary/20" 
                        : "hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 shrink-0 transition-all duration-300 group-hover:scale-110",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-primary",
                      !isCollapsed && "mr-5"
                    )} />
                    {!isCollapsed && (
                      <span className="font-bold text-[13px] tracking-tight">{item.name}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Profile & Footer */}
      <div className="p-4 border-t border-white/5 space-y-3 bg-black/20 shrink-0">
        {!isCollapsed && user && (
          <Link 
            href="/profile"
            className="flex items-center gap-4 px-5 py-4 rounded-3xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98] cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10 relative overflow-hidden">
              {user.avatar_url || user.avatarUrl ? (
                <img 
                  src={user.avatar_url || user.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-sm shadow-emerald-500/50" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-sm truncate tracking-tight group-hover:text-primary transition-colors">
                {user.firstName || user.first_name || 'User'}
              </span>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest truncate">
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
              className="flex items-center justify-center w-full h-11 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all group"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          )}
          
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full h-11 rounded-2xl transition-all group",
              isCollapsed ? "justify-center" : "px-5",
              "hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
            )}
          >
            <LogOut className={cn(
              "w-5 h-5 shrink-0 transition-transform group-hover:rotate-12",
              !isCollapsed && "mr-5"
            )} />
            {!isCollapsed && <span className="font-bold text-[13px]">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
