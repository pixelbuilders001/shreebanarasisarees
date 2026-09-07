"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Sparkles,
  Scissors,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

export default function OurStoreClient() {
  const router = useRouter();

  const mapQuery = "Shree Banarasi Sarees, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar 848103";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;
  const whatsappUrl = "https://wa.me/+916203909946?text=Namaste!%20I%20am%20planning%20to%20visit%20your%20Samastipur%20showroom.";

  // Dynamic Open / Closed calculation according to IST (UTC+5:30)
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; text: string }>({
    isOpen: true,
    text: 'Open now'
  });

  useEffect(() => {
    const computeStatus = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + 3600000 * 5.5);
      const minutes = ist.getHours() * 60 + ist.getMinutes();
      const openTime = 10 * 60; // 10:00 AM
      const closeTime = 20 * 60 + 30; // 8:30 PM

      if (minutes >= openTime && minutes < closeTime) {
        setStoreStatus({ isOpen: true, text: 'Open now' });
      } else {
        setStoreStatus({ isOpen: false, text: 'Closed · Opens at 10 am' });
      }
    };

    computeStatus();
    const interval = setInterval(computeStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="bg-[#FAF7F0] min-h-screen text-[#292524] font-sans pb-20 lg:pb-12">
      {/* ── MOBILE TOP NAVIGATION BAR (< Our store) ── */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E5DEC9] px-3 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="p-1 -ml-1 text-[#292524] hover:text-[#6B1725] active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-serif text-lg text-[#292524] tracking-tight">
          Our store
        </h1>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* ── HERO BANNER ── */}
        <div className="w-full sm:pt-4 sm:px-4 lg:px-6">
          <div className="relative w-full aspect-[399/262] sm:aspect-[21/9] sm:rounded-2xl overflow-hidden bg-[#EAE2D2] shadow-xs border-b sm:border border-[#E5DEC9]">
            <img
              src="/our_store_banner.png"
              alt="Shree Banarasi Sarees - Timeliness Tradition"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER ── */}
        <div className="px-4 py-5 sm:px-6 lg:px-8 space-y-6">

          {/* ── STORE TITLE & STORY BLURB ── */}
          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#292524] font-normal tracking-tight">
              Shree Banarasi Sarees, Samastipur
            </h2>
            <p className="text-sm sm:text-base text-[#6B625D] leading-relaxed font-normal max-w-3xl">
              Three generations of sourcing straight from Varanasi looms. Everything on this app is on our shelves — if you&apos;re in town, come see the zari in daylight before you decide.
            </p>
          </div>

          {/* ── STORE DETAILS CARD (Matches Mockup) ── */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DEC9] shadow-xs space-y-3.5">
            {/* Address Row */}
            <div className="flex items-start gap-3">
              <MapPin size={19} className="text-[#B08A3C] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#292524] leading-snug">
                <p className="font-medium">Rudauli Chowk, Harpur Aloth,</p>
                <p className="text-[#6B625D]">Samastipur, Bihar 848103</p>
              </div>
            </div>

            {/* Timings Row */}
            <div className="flex items-start gap-3">
              <Clock size={19} className="text-[#B08A3C] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-snug">
                <p className="text-[#292524] font-medium">10 am – 8 pm, all days</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${storeStatus.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={`text-[11px] font-semibold ${storeStatus.isOpen ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {storeStatus.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Phone Row */}
            <div className="flex items-center gap-3">
              <Phone size={19} className="text-[#B08A3C] shrink-0" />
              <a
                href="tel:+916203909946"
                className="text-xs sm:text-sm font-medium text-[#292524] hover:text-[#6B1725] transition-colors"
              >
                +91 62039 09946
              </a>
            </div>
          </div>

          {/* ── ACTION CTAs: DIRECTIONS & WHATSAPP US (Matches Mockup) ── */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-3 sm:px-5 rounded-full border border-[#6B1725] bg-transparent hover:bg-[#6B1725]/5 text-[#6B1725] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <MapPin size={16} className="text-[#6B1725]" />
              <span>Directions</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-3 sm:px-5 rounded-full bg-[#6B1725] hover:bg-[#53121D] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle size={16} className="text-white fill-white/20" />
              <span>WhatsApp us</span>
            </a>
          </div>

          {/* ── IN-STORE SERVICES (Dashed Accent Card Matching Mockup) ── */}
          <div className="rounded-2xl border border-dashed border-[#B08A3C]/40 bg-white/70 backdrop-blur-xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-2.5">
              <span className="text-[11px] font-bold text-[#B08A3C] uppercase tracking-wider">
                Showroom Services
              </span>
              <span className="text-[11px] text-[#7A6E65]">
                Complimentary In-Store
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Service 1 */}
              <div className="p-3 bg-white rounded-xl border border-[#F0EAE1] space-y-1">
                <div className="flex items-center gap-2 text-[#6B1725]">
                  <Sparkles size={16} />
                  <h3 className="font-serif text-xs font-bold text-[#292524]">
                    Bridal Styling
                  </h3>
                </div>
                <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                  Personal drape assistance and trousseau color-matching with our saree stylists.
                </p>
              </div>

              {/* Service 2 */}
              <div className="p-3 bg-white rounded-xl border border-[#F0EAE1] space-y-1">
                <div className="flex items-center gap-2 text-[#6B1725]">
                  <Scissors size={16} />
                  <h3 className="font-serif text-xs font-bold text-[#292524]">
                    Custom Weaves
                  </h3>
                </div>
                <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                  Bespoke dye orders, custom border zari weaves, and blouse tailoring on request.
                </p>
              </div>

              {/* Service 3 */}
              <div className="p-3 bg-white rounded-xl border border-[#F0EAE1] space-y-1">
                <div className="flex items-center gap-2 text-[#6B1725]">
                  <ShoppingBag size={16} />
                  <h3 className="font-serif text-xs font-bold text-[#292524]">
                    Pickup &amp; Returns
                  </h3>
                </div>
                <p className="text-[11px] text-[#7A6E65] leading-relaxed">
                  Shop on the app and pick up ready-to-wear at the counter, or exchange in person.
                </p>
              </div>
            </div>
          </div>

          {/* ── INTERACTIVE GOOGLE MAP EMBED ── */}
          <div className="rounded-2xl overflow-hidden border border-[#E5DEC9] shadow-xs bg-white space-y-2 p-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[#292524]">
                Location Map
              </span>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-[#6B1725] hover:underline flex items-center gap-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="relative w-full h-56 sm:h-72 rounded-xl overflow-hidden border border-[#F3ECE0] bg-[#EAE2D2]">
              <iframe
                src={mapEmbedUrl}
                title="Shree Banarasi Sarees Showroom Location - Rudauli Chowk, Samastipur"
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full border-0"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
