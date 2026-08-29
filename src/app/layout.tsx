import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../context/StoreContext";
import { CartDrawer } from "../components/CartDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { WhatsAppButton } from "../components/WhatsAppButton";
import PWARegistration from "../components/PWARegistration";
import NotificationPrompt from "../components/notifications/NotificationPrompt";
import React, { Suspense } from "react";
import GoogleAnalytics from "../components/GoogleAnalytics";
import MicrosoftClarity from "../components/MicrosoftClarity";
import RouteTransitionLoader from "../components/RouteTransitionLoader";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#801F32",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
};

export const metadata: Metadata = {
  metadataBase: new URL("https://shreebanarasisarees.in"),
  title: {
    default: "Shree Banarasi Sarees | श्री बनारसी साड़ीज़ - Premium Indian Sarees",
    template: "%s | Shree Banarasi Sarees",
  },
  description: "Discover authentic Banarasi silk, Lucknowi Chikankari, Gujarati Bandhani, Organza, and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic wear showroom in Samastipur, Bihar with free express shipping across India.",
  keywords: [
    "sarees",
    "banarasi silk saree",
    "pure silk sarees",
    "chikankari sarees",
    "bandhani silk",
    "organza sarees",
    "chanderi sarees",
    "wedding sarees",
    "bridal saree collection",
    "saree shop in samastipur",
    "bihar saree showroom",
    "handloom sarees online"
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shree Banarasi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: "https://shreebanarasisarees.in",
  },
  openGraph: {
    title: "Shree Banarasi Sarees | श्री बनारसी साड़ीज़ - Handloom Sarees",
    description: "Discover authentic Banarasi silk, Lucknowi Chikankari, Gujarati Bandhani, Organza, and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic wear showroom in Samastipur, Bihar.",
    url: "https://shreebanarasisarees.in",
    siteName: "Shree Banarasi Sarees",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://shreebanarasisarees.in/og_image.jpg",
        width: 1024,
        height: 537,
        alt: "Shree Banarasi Sarees Showcase",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Shree Banarasi Sarees | श्री बनारसी साड़ीज़",
    description: "Discover authentic Banarasi silk, Lucknowi Chikankari, Gujarati Bandhani, Organza, and Chanderi sarees at Shree Banarasi Sarees.",
    images: ["https://shreebanarasisarees.in/og_image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192x192.png",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vzqlsawxvvyvsstyzzff.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vzqlsawxvvyvsstyzzff.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased text-[#292524] bg-[#FAF7F0] min-h-screen flex flex-col justify-between">
        <GoogleAnalytics />
        <MicrosoftClarity />
        <StoreProvider>
          <PWARegistration />
          <NotificationPrompt />
          <Suspense fallback={null}>
            <RouteTransitionLoader />
          </Suspense>
          <div className="flex-grow pb-16 lg:pb-0">
            {children}
          </div>
          <CartDrawer />
          <MobileBottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
