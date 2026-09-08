import type { Metadata } from "next";
import { Inter, Poppins, Manrope } from "next/font/google";
import "./globals.css";
import { ChatBot } from "@/components/shared/ChatBot";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PROPIX | Find the Right Property. Make the Right Move.",
  description: "Sri Lanka's most trusted digital real estate platform. Discover verified properties, connect with expert agents, and make confident property decisions.",
  keywords: ["real estate", "Sri Lanka", "property", "buy property", "rent property", "Colombo", "PROPIX"],
  openGraph: {
    title: "PROPIX — Sri Lanka Real Estate",
    description: "Find the Right Property. Make the Right Move.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
