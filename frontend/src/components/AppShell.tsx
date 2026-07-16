'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from './DashboardSidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isLoginPage = pathname === '/login';

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
    <div className="flex min-h-screen relative w-full overflow-x-hidden bg-slate-50">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
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
        "flex-1 transition-all duration-300 min-h-screen flex flex-col w-full",
        isCollapsed ? "md:ml-24" : "md:ml-72",
        "ml-0"
      )}>
        {/* Mobile Navbar Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4 justify-between sticky top-0 z-30 md:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-black text-slate-800 tracking-tight text-lg">RUPASINGHE</span>
          </div>
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
            RP
          </div>
        </header>

        <div className="flex-1 p-4 md:px-6 md:py-10 w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
