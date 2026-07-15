'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from './DashboardSidebar';
import { cn } from '@/lib/utils';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen relative w-full overflow-x-hidden">
      <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={cn(
        "flex-1 transition-all duration-500 min-h-screen flex flex-col",
        isCollapsed ? "ml-24" : "ml-72"
      )}>
        <div className="flex-1 p-4 md:px-6 md:py-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
