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

  // Inactivity auto-logout monitor (10 minutes) - Excludes ADMIN
  useEffect(() => {
    if (!isAuthenticated || pathname === '/login') return;

    // Check if the current user is an Admin
    const storedUser = localStorage.getItem('user');
    let isUserAdmin = false;
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        isUserAdmin = u.role === 'ADMIN';
      } catch (e) {}
    }

    // Admins do not have session timeouts
    if (isUserAdmin) return;

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in ms

    // Initialize last activity time if not set
    if (!localStorage.getItem('last_activity')) {
      localStorage.setItem('last_activity', Date.now().toString());
    }

    const resetActivity = () => {
      localStorage.setItem('last_activity', Date.now().toString());
    };

    // Attach event listeners for activity tracking
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetActivity);
    });

    // Check interval to verify inactivity
    const interval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('last_activity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        // Session expired!
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_activity');
        setIsAuthenticated(false);
        router.push('/login?expired=true');
      }
    }, 5000); // Check every 5 seconds

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, pathname, router]);

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
