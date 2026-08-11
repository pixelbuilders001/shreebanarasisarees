import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../context/StoreContext";
import { CartDrawer } from "../components/CartDrawer";
import { WhatsAppButton } from "../components/WhatsAppButton";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shree Banarasi Sarees | श्री बनारसी साड़ियाँ - Premium Indian Sarees",
  description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
  keywords: "sarees, banarasi silk, chikankari, bandhani, organza, wedding saree, bridal wear, samastipur, bihar",
  openGraph: {
    title: "Shree Banarasi Sarees | श्री बनारसी साड़ियाँ",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
    url: "https://shreebanarasisarees.vercel.app",
    siteName: "Shree Banarasi Sarees",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://shreebanarasisarees.vercel.app/brand_logo.png",
        width: 500,
        height: 500,
        alt: "Shree Banarasi Sarees Logo",
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Shree Banarasi Sarees | श्री बनारसी साड़ियाँ",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
    images: ["https://shreebanarasisarees.vercel.app/brand_logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased text-[#2D211D] bg-[#FFF9F0] min-h-screen flex flex-col justify-between">
        <StoreProvider>
          <div className="flex-grow pb-16 lg:pb-0">
            {children}
          </div>
          <CartDrawer />
          <WhatsAppButton />
        </StoreProvider>
      </body>
    </html>
  );
}
