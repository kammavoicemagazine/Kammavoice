import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Providers from "@/components/providers/Providers";
import CapacitorProvider from "@/components/CapacitorProvider";
import BottomNavigation from "@/components/layout/BottomNavigation";
import DynamicIsland from "@/components/layout/DynamicIsland";
import PageAnimatePresence from "@/components/providers/PageAnimatePresence";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  title: {
    default: "Kamma Voice | కమ్మ వాయిస్ — Telugu Digital Media",
    template: "%s | Kamma Voice",
  },
  description:
    "Kamma Voice is a premium Telugu digital media platform delivering news, culture, community stories, and more. కమ్మ వాయిస్ — మీ తెలుగు డిజిటల్ మీడియా.",
  keywords: [
    "Kamma Voice", "కమ్మ వాయిస్", "Telugu news", "Telugu media",
    "Andhra Pradesh", "Telangana", "community news", "Telugu magazine",
  ],
  openGraph: {
    type: "website",
    locale: "te_IN",
    siteName: "Kamma Voice",
    title: "Kamma Voice | కమ్మ వాయిస్",
    description: "Premium Telugu digital media platform",
    url: "https://www.kammavoice.com",
    images: [
      {
        url: "/og-image.jpg", // Placeholder for actual OG image
        width: 1200,
        height: 630,
        alt: "Kamma Voice Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamma Voice | కమ్మ వాయిస్",
    description: "Premium Telugu digital media platform",
    images: ["/og-image.jpg"], // Placeholder
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://www.kammavoice.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="te"
      className={`${inter.variable} ${playfair.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA] antialiased">
        <Providers>
          <CapacitorProvider>
            <DynamicIsland />
            <div className="flex-1 pb-24 lg:pb-0 flex flex-col">
              <PullToRefresh>
                <PageAnimatePresence>{children}</PageAnimatePresence>
              </PullToRefresh>
            </div>
            <BottomNavigation />
          </CapacitorProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
