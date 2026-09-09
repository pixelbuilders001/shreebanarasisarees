import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Home,
  ShoppingBag,
  Sparkles,
  Search,
  MessageCircle,
  ArrowRight,
  Compass,
  ShieldCheck,
  Truck,
  HeartHandshake,
} from "lucide-react";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Shree Banarasi Sarees",
  description:
    "The page you are looking for might have been moved, renamed, or is no longer available. Explore authentic Banarasi silk, Chikankari, and wedding sarees at Shree Banarasi Sarees.",
  robots: {
    index: false,
    follow: true,
  },
};

const POPULAR_COLLECTIONS = [
  {
    name: "Banarasi Silk",
    hindi: "बनारसी सिल्क",
    href: "/sarees?fabric=Banarasi+Silk",
    desc: "Zari brocades & royal heritage",
  },
  {
    name: "Lucknowi Chikankari",
    hindi: "चिकनकारी",
    href: "/sarees?fabric=Chikankari",
    desc: "Intricate artisanal needlework",
  },
  {
    name: "Gujarati Bandhani",
    hindi: "बांधनी सिल्क",
    href: "/sarees?fabric=Bandhani",
    desc: "Traditional tie & dye marvels",
  },
  {
    name: "Pure Organza",
    hindi: "ऑर्गेंजा सिल्क",
    href: "/sarees?fabric=Organza",
    desc: "Featherlight modern grace",
  },
  {
    name: "Bridal Heritage",
    hindi: "दुल्हन कलेक्शन",
    href: "/sarees?occasion=Bridal",
    desc: "Timeless wedding drapes",
  },
  {
    name: "All Sarees",
    hindi: "सभी साड़ियाँ",
    href: "/sarees",
    desc: "Explore full handloom catalog",
  },
];

export default function NotFound() {
  return (
    <>
      <Header />

      <main className="bg-[#FAF7F0] min-h-[80vh] flex flex-col justify-center py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto w-full text-center">
          {/* Subtle Decorative Monogram */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1.5 border border-[#B08A3C]/40 shadow-md">
              <Image
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees"
                width={72}
                height={72}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="absolute -top-1 -right-2 bg-[#6B1725] text-[#D4B870] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#B08A3C]/50 shadow-sm uppercase tracking-widest font-serif">
              404
            </span>
          </div>

          {/* Large Hero 404 Headline */}
          <div className="relative mb-2">
            <h1 className="font-serif text-7xl sm:text-9xl font-black text-[#52111C] tracking-tight select-none opacity-90 leading-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs sm:text-sm font-serif font-bold uppercase tracking-[0.35em] text-[#B08A3C] bg-[#FAF7F0] px-4 py-1 border-y border-[#B08A3C]/30 shadow-sm">
                Page Not Found
              </span>
            </div>
          </div>

          {/* Poetic Title */}
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide mt-3 mb-2">
            Lost in the Weaves of Banaras
          </h2>
          <p className="text-sm sm:text-base text-[#6B1725] font-serif font-semibold italic">
            बनारसी धागों में यह पन्ना कहीं खो गया है
          </p>

          {/* Decorative Gold Accent Bar */}
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="h-0.5 bg-[#B08A3C] w-12 rounded-full"></div>
            <Sparkles className="w-4 h-4 text-[#B08A3C]" />
            <div className="h-0.5 bg-[#B08A3C] w-12 rounded-full"></div>
          </div>

          <p className="text-xs sm:text-sm text-[#6B625D] max-w-lg mx-auto leading-relaxed font-light mb-8">
            The page or saree collection you are looking for might have been moved, renamed, or is temporarily unavailable. Let us guide you back to our finest handcrafted weaves.
          </p>

          {/* Instant Search Bar */}
          <div className="max-w-md mx-auto mb-10">
            <form
              action="/sarees"
              method="GET"
              className="flex items-center bg-white border border-[#B08A3C]/50 rounded-2xl shadow-md p-1.5 focus-within:border-[#6B1725] focus-within:ring-2 focus-within:ring-[#6B1725]/15 transition-all"
            >
              <div className="pl-3 text-[#B08A3C]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="Search for Banarasi, Katan, Bandhani..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#292524] placeholder:text-[#6B625D]/60 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.98] text-[#FAF7F0] font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-[#6B1725]/20 transition-all"
            >
              <Home className="w-4 h-4 text-[#D4B870]" />
              <span>Return to Home</span>
            </Link>

            <Link
              href="/sarees"
              className="inline-flex items-center gap-2 bg-[#F3ECE0] hover:bg-[#EBE2D3] text-[#6B1725] font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl border border-[#B08A3C]/40 shadow-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-[#B08A3C]" />
              <span>Explore All Sarees</span>
            </Link>

            <a
              href="https://wa.me/919155111777?text=Hello%2C%20I%20am%20looking%20for%20a%20saree%20on%20Shree%20Banarasi%20Sarees"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-3.5 rounded-xl border border-[#25D366]/35 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Styling Help</span>
            </a>
          </div>

          {/* Popular Collections Grid */}
          <div className="bg-white rounded-3xl border border-[#B08A3C]/25 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-[#B08A3C]" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
                Popular Handloom Weaves
              </h3>
            </div>
            <p className="text-xs text-[#6B625D] font-light mb-6">
              Hand-picked selections from our Samastipur showroom
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {POPULAR_COLLECTIONS.map((col) => (
                <Link
                  key={col.name}
                  href={col.href}
                  className="group bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#B08A3C]/20 hover:border-[#B08A3C]/50 rounded-2xl p-4 text-left transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] text-[#B08A3C] font-semibold block uppercase tracking-wider">
                      {col.hindi}
                    </span>
                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#6B1725] group-hover:text-[#52111C] transition-colors mt-0.5">
                      {col.name}
                    </h4>
                    <p className="text-[11px] text-[#6B625D] font-light mt-1 line-clamp-1">
                      {col.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#B08A3C] mt-3 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#B08A3C]/20 text-xs text-[#6B625D]">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B08A3C]" />
              <span>100% Certified Authentic Silks</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Truck className="w-4 h-4 text-[#B08A3C]" />
              <span>Free Express Delivery Across India</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#B08A3C]" />
              <span>Samastipur Showroom Heritage</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
