'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      if (pathname === '/login') {
        router.push('/');
      }
    } else {
      setIsAuthenticated(false);
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl animate-spin shadow-xl shadow-primary/20" />
          <p className="text-xl font-black text-primary animate-pulse tracking-tighter uppercase">Initializing Session...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return <>{children}</>;
}
