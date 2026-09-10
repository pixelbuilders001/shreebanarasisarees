"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Phone,
  MessageCircle,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { triggerHaptic } from "@/utils/haptics";

export const OfflineDetector: React.FC = () => {
  const { isOnline, isChecking, wasOffline, clearWasOffline, checkConnection } =
    useNetworkStatus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<"idle" | "success" | "failed">("idle");

  // Reset banner dismissal whenever state transitions from online to offline
  useEffect(() => {
    if (!isOnline) {
      setIsBannerDismissed(false);
      setRetryFeedback("idle");
    }
  }, [isOnline]);

  // Auto-dismiss "Back Online" toast after 3.5 seconds
  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        clearWasOffline();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, clearWasOffline]);

  const handleRetry = async () => {
    triggerHaptic("medium");
    setRetryFeedback("idle");
    const online = await checkConnection();
    if (online) {
      triggerHaptic("success");
      setRetryFeedback("success");
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } else {
      triggerHaptic("error");
      setRetryFeedback("failed");
    }
  };

  return (
    <>
      {/* ── 1. FLOATING OFFLINE BANNER (Top) ─────────────────────────── */}
      {!isOnline && !isBannerDismissed && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Offline status notification"
          className="fixed top-3 sm:top-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-[9990] animate-slideDown"
        >
          <div className="bg-[#52111C]/95 backdrop-blur-md text-[#FAF7F0] px-4 py-2.5 rounded-full border border-[#B08A3C]/60 shadow-2xl shadow-[#52111C]/50 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B08A3C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B08A3C]"></span>
              </span>
              <WifiOff className="w-4 h-4 text-[#D4B870] flex-shrink-0" />
              <div className="truncate">
                <span className="font-medium">No Internet Connection</span>
                <span className="hidden sm:inline text-[#FAF7F0]/70">
                  {" "}
                  • Cached mode
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsModalOpen(true);
                }}
                className="bg-[#B08A3C] hover:bg-[#8C6A23] text-[#52111C] font-semibold px-2.5 py-1 rounded-full text-[11px] sm:text-xs transition-colors shadow-sm"
              >
                Details
              </button>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isChecking}
                aria-label="Retry connection"
                className="p-1 rounded-full text-[#D4B870] hover:text-[#FAF7F0] hover:bg-white/10 transition-colors"
                title="Retry connection"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setIsBannerDismissed(true);
                }}
                aria-label="Dismiss offline banner"
                className="p-1 rounded-full text-[#FAF7F0]/60 hover:text-[#FAF7F0] hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── 2. CELEBRATORY "BACK ONLINE" TOAST ───────────────────────── */}
      {isOnline && wasOffline && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Online status notification"
          className="fixed top-3 sm:top-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-[9990] animate-slideDown"
        >
          <div className="bg-[#1B4D3E]/95 backdrop-blur-md text-[#FAF7F0] px-4 py-2.5 rounded-full border border-[#34D399]/40 shadow-2xl shadow-black/30 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[#34D399] flex-shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-white">Back Online!</span>
                <span className="text-[#FAF7F0]/80">
                  {" "}
                  Connection restored.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={clearWasOffline}
              aria-label="Dismiss back online message"
              className="p-1 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* ── 3. DETAILED OFFLINE MODAL DIALOG ─────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-[#FAF7F0] text-[#292524] w-full max-w-md rounded-2xl border border-[#B08A3C]/40 shadow-2xl overflow-hidden animate-scaleIn relative flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-modal-title"
          >
            {/* Top Decorative Header */}
            <div className="bg-gradient-to-r from-[#52111C] via-[#6B1725] to-[#52111C] px-6 pt-6 pb-5 text-center relative border-b border-[#B08A3C]/30 text-[#FAF7F0]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-[#FAF7F0]/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Brand Logo & Offline Icon Badge */}
              <div className="relative inline-block mb-2">
                <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-[#B08A3C] shadow-md mx-auto flex items-center justify-center overflow-hidden">
                  <Image
                    src="/brand_logo.webp"
                    alt="Shree Banarasi Sarees"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#8C2234] text-[#FAF7F0] p-1.5 rounded-full border-2 border-[#FAF7F0] shadow-sm">
                  <WifiOff className="w-3.5 h-3.5 text-[#D4B870]" />
                </div>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#D4B870] block">
                श्री बनारसी साड़ीज़ • Samastipur
              </span>
              <h3
                id="offline-modal-title"
                className="font-serif text-xl sm:text-2xl font-bold tracking-wide mt-1 text-[#FAF7F0]"
              >
                You are Offline
              </h3>
              <p className="text-xs text-[#FAF7F0]/80 mt-0.5">
                इंटरनेट कनेक्शन उपलब्ध नहीं है
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="bg-[#F3ECE0] rounded-xl p-3.5 border border-[#B08A3C]/25 text-xs text-[#292524]/85 leading-relaxed">
                <p>
                  We are unable to reach the internet right now. Please check
                  your Wi-Fi or mobile data network. Any items in your bag and
                  saved preferences remain intact.
                </p>
              </div>

              {/* Retry status alert if user already clicked retry */}
              {retryFeedback === "failed" && (
                <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Still offline. Please check your data connection and try again.</span>
                </div>
              )}

              {retryFeedback === "success" && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-3 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Connection restored! Refreshing data...</span>
                </div>
              )}

              {/* Troubleshooting Tips */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B1725] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B08A3C]" />
                  Quick Troubleshooting
                </h4>
                <ul className="text-xs text-[#292524]/75 space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08A3C] mt-1.5 flex-shrink-0"></span>
                    <span>Turn Airplane Mode ON for 5 seconds, then turn it OFF.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08A3C] mt-1.5 flex-shrink-0"></span>
                    <span>Verify that Wi-Fi or Cellular Data is active.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08A3C] mt-1.5 flex-shrink-0"></span>
                    <span>Check if you are signed into any public Wi-Fi portal.</span>
                  </li>
                </ul>
              </div>

              {/* Urgent Inquiries - Showroom Contact */}
              <div className="border-t border-[#B08A3C]/20 pt-4">
<p className="text-[11px] text-[#6B625D] text-center mb-2.5">
                    Need immediate bridal or saree order assistance?
                  </p>
                  <p className="text-[11px] text-[#6B625D] text-center mb-2.5">
                    Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                  <a
                    href="https://wa.me/+916203909946?text=Hello%2C%20I%20am%20shopping%20at%20Shree%20Banarasi%20Sarees%20and%20need%20assistance"
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

            {/* Modal Actions Footer */}
            <div className="bg-[#F3ECE0] px-5 py-3.5 border-t border-[#B08A3C]/30 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isChecking}
                className="w-full sm:flex-1 bg-[#6B1725] hover:bg-[#52111C] active:scale-[0.98] text-[#FAF7F0] font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`}
                />
                <span>{isChecking ? "Checking..." : "Retry Connection"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs text-[#292524]/70 hover:text-[#292524] rounded-xl hover:bg-black/5 font-medium transition-colors text-center"
              >
                Browse Loaded
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
