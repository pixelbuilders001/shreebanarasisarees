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
  title: "SHREE Banarasi Sarees | श्री बनारसी साड़ियाँ - Premium Indian Sarees",
  description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at SHREE Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
  keywords: "sarees, banarasi silk, chikankari, bandhani, organza, wedding saree, bridal wear, samastipur, bihar",
  openGraph: {
    title: "SHREE Banarasi Sarees | श्री बनारसी साड़ियाँ",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at SHREE Banarasi Sarees. Premium Indian ethnic fashion at accessible prices.",
    locale: "en_IN",
    type: "website",
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
