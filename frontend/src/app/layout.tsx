import type { Metadata } from 'next';
import './globals.css';
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';

const interFont = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

export const metadata: Metadata = {
  title: 'Rupasinghe Pawning | Branch Intelligence',
  description: 'Core pawning and branch transaction platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: interFont }} className="bg-background text-foreground dashboard-shell antialiased" suppressHydrationWarning>
        <AuthGuard>
          <AppShell>
            {children}
          </AppShell>
        </AuthGuard>
      </body>
    </html>
  );
}
