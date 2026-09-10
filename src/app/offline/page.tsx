"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  WifiOff,
  RefreshCw,
  Home,
  ShoppingBag,
  MapPin,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { triggerHaptic } from "@/utils/haptics";

export default function OfflinePage() {
  const { isOnline, isChecking, checkConnection } = useNetworkStatus();
  const [retryResult, setRetryResult] = useState<"idle" | "success" | "failed">("idle");

  const handleManualRetry = async () => {
    triggerHaptic("medium");
    setRetryResult("idle");
    const online = await checkConnection();
    if (online) {
      triggerHaptic("success");
      setRetryResult("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } else {
      triggerHaptic("error");
      setRetryResult("failed");
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-[75vh] bg-[#FAF7F0] flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="max-w-xl w-full">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-[#B08A3C]/35 shadow-xl shadow-[#292524]/5 overflow-hidden text-center relative">
            {/* Top Royal Band */}
            <div className="bg-gradient-to-r from-[#52111C] via-[#6B1725] to-[#52111C] py-8 px-6 text-[#FAF7F0] relative">
              <div className="relative inline-block mb-3">
                <div className="w-20 h-20 rounded-full bg-white p-1 border-2 border-[#B08A3C] shadow-lg mx-auto flex items-center justify-center">
                  <Image
                    src="/brand_logo.webp"
                    alt="Shree Banarasi Sarees Logo"
                    width={72}
                    height={72}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#8C2234] text-[#D4B870] p-1.5 rounded-full border-2 border-white shadow-md">
                  <WifiOff className="w-4 h-4" />
                </div>
              </div>

              <span className="text-[10px] sm:text-xs text-[#D4B870] uppercase font-bold tracking-[0.25em] block">
                Heritage Handlooms • Shree Banarasi Sarees
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#FAF7F0] mt-1.5 tracking-wide">
                No Internet Connection
              </h1>
              <p className="text-xs sm:text-sm text-[#FAF7F0]/80 mt-1 font-light">
                इंटरनेट कनेक्शन उपलब्ध नहीं है
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-xs sm:text-sm text-[#6B625D] leading-relaxed max-w-md mx-auto font-light">
                It appears your device is currently offline. Please check your Wi-Fi or mobile cellular network. Any items added to your cart remain preserved.
              </p>

              {/* Status Alert */}
              {retryResult === "failed" && (
                <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 max-w-md mx-auto animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Still offline. Please verify your connection and try again.</span>
                </div>
              )}

              {retryResult === "success" && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 max-w-md mx-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Connection restored! Redirecting to home...</span>
                </div>
              )}

              {/* Primary Action: Retry */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleManualRetry}
                  disabled={isChecking}
                  className="w-full sm:w-auto min-w-[200px] bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.98] text-[#FAF7F0] font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#6B1725]/20 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#D4B870] ${
                      isChecking ? "animate-spin" : ""
                    }`}
                  />
                  <span>{isChecking ? "Checking Connection..." : "Retry Connection"}</span>
                </button>

                <Link
                  href="/"
                  className="w-full sm:w-auto bg-[#F3ECE0] hover:bg-[#EBE2D3] text-[#6B1725] font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-[#B08A3C]/30 transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Home</span>
                </Link>
              </div>

              {/* Decorative Divider */}
              <div className="flex items-center justify-center gap-3 my-4">
                <div className="h-px bg-[#B08A3C]/25 w-16"></div>
                <Sparkles className="w-3.5 h-3.5 text-[#B08A3C]" />
                <div className="h-px bg-[#B08A3C]/25 w-16"></div>
              </div>

              {/* Samastipur Showroom Direct Support */}
              <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#B08A3C]/20 text-left">
                <div className="flex items-center gap-2 mb-2 text-[#6B1725] font-serif font-bold text-sm">
                  <MapPin className="w-4 h-4 text-[#B08A3C]" />
                  <span>Visit Our Samastipur Showroom</span>
                </div>
                <p className="text-xs text-[#6B625D] leading-relaxed mb-3">
                  Rudauli Chowk, Harpur Aloth, Samastipur, Bihar - 848103. Open all 7 days for authentic silk saree shopping.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="https://wa.me/+916203909946?text=Hello%2C%20I%20am%20shopping%20on%20Shree%20Banarasi%20Sarees"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-semibold text-xs rounded-xl border border-[#25D366]/30 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="tel:+916203909946"
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-[#6B1725]/10 hover:bg-[#6B1725]/20 text-[#6B1725] font-semibold text-xs rounded-xl border border-[#6B1725]/30 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#6B1725]" />
                    <span>Call Store</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
