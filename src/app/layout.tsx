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
  title: "RUPASINGHE REALTY | Find the Right Property. Make the Right Move.",
  description: "Sri Lanka's premier digital real estate platform. Discover verified luxury properties, connect with expert agents, and make confident property decisions with Rupasinghe Realty.",
  keywords: ["real estate", "Sri Lanka", "property", "buy property", "rent property", "Colombo", "Rupasinghe Realty", "RUPASINGHE REALTY"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/icon.png" }
    ],
  },
  openGraph: {
    title: "RUPASINGHE REALTY — Sri Lanka Real Estate",
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
