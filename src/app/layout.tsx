import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../context/StoreContext";
import { CartDrawer } from "../components/CartDrawer";
import { WhatsAppButton } from "../components/WhatsAppButton";
import PWARegistration from "../components/PWARegistration";
import NotificationPrompt from "../components/notifications/NotificationPrompt";
import GoogleAnalytics from "../components/GoogleAnalytics";
import MicrosoftClarity from "../components/MicrosoftClarity";

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
  title: "Shree Banarasi Sarees | श्री बनारसी साड़ियाँ - Premium Indian Sarees",
  description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
  keywords: "sarees, banarasi silk, chikankari, bandhani, organza, wedding saree, bridal wear, samastipur, bihar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shree Banarasi",
  },
  openGraph: {
    title: "Shree Banarasi Sarees | श्री बनारसी साड़ियाँ",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
    url: "https://shreebanarasisarees.vercel.app",
    siteName: "Shree Banarasi Sarees",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://shreebanarasisarees.vercel.app/og_image.jpg",
        width: 1024,
        height: 537,
        alt: "Shree Banarasi Sarees Showcase",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Shree Banarasi Sarees | श्री बनारसी साड़ियाँ",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
    images: ["https://shreebanarasisarees.vercel.app/og_image.jpg"],
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
        <link rel="preconnect" href="https://vzqlsawxvvyvsstyzzff.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vzqlsawxvvyvsstyzzff.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased text-[#2D211D] bg-[#FFF9F0] min-h-screen flex flex-col justify-between">
        <GoogleAnalytics />
        <MicrosoftClarity />
        <StoreProvider>
          <PWARegistration />
          <NotificationPrompt />
          <div className="flex-grow pb-16 lg:pb-0">
            {children}
          </div>
          <CartDrawer />
          {/* <WhatsAppButton /> */}
        </StoreProvider>
      </body>
    </html>
  );
}
