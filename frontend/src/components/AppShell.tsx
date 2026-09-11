'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from './DashboardSidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Auto-collapse on tablet (md = 768px), expand on desktop (lg = 1024px)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  // Detect screen size on mount and set initial collapsed state
  useEffect(() => {
    const checkSize = () => {
      // Tablet: md (768px) to lg (1024px) → auto-collapse sidebar
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen relative w-full overflow-x-hidden bg-[#f8f9fa]">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <DashboardSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col w-full overflow-x-hidden",
        isCollapsed ? "md:ml-24" : "md:ml-24 lg:ml-72",
        "ml-0"
      )}>
        {/* Mobile/Tablet Navbar Header */}
        <header className="h-14 border-b border-white/10 bg-[#202020] text-white flex items-center px-4 justify-between sticky top-0 z-30 md:hidden shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-tight text-lg">RUPASINGHE</span>
              <span className="text-[#ffd100] text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#ffd100]/10 rounded border border-[#ffd100]/20">MIFOS</span>
            </div>
          </div>
          <div className="h-9 w-9 bg-[#ffd100] text-[#202020] rounded-xl flex items-center justify-center font-black text-sm shadow-md">
            RP
          </div>
        </header>

        <div className="flex-1 p-3 md:p-4 lg:px-6 lg:py-8 w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
