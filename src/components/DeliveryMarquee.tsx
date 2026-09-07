"use client";

import React from 'react';
import { Zap, ShieldCheck, Truck, Sparkles } from 'lucide-react';

export const DeliveryMarquee: React.FC = () => {
  const deliveryItems = [
    {
      icon: Zap,
      title: "20-Min Delivery in Samastipur",
      subtitle: "Order delivered in 20 mins",
    },
    {
      icon: ShieldCheck,
      title: "100% Quality Checked",
      subtitle: "Hand-inspected sarees & authentic weaves",
    },
    {
      icon: Truck,
      title: "3–5 Days Express Pan-India",
      subtitle: "COD Available · Free shipping above ₹1,999",
    },
  ];

  const renderItemSet = (setKey: string) => (
    <div key={setKey} className="flex items-center shrink-0">
      {deliveryItems.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <div key={idx} className="flex items-center shrink-0">
            <div className="flex items-center gap-3 px-4 sm:px-6">
              {/* Luxury Badge Container */}
              <div className="inline-flex items-center gap-2.5 sm:gap-3 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-[#B08A3C]/25 shadow-xs hover:border-[#6B1725]/40 transition-all">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#6B1725] to-[#420E17] text-[#D4B870] flex items-center justify-center shrink-0 shadow-xs">
                  <IconComponent size={13} className="text-[#D4B870]" />
                </div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="font-serif font-bold text-xs sm:text-sm text-[#292524] tracking-wide whitespace-nowrap">
                    {item.title}
                  </span>
                  <span className="text-[#B08A3C]/60 text-xs hidden sm:inline">•</span>
                  <span className="text-[10px] sm:text-xs font-sans font-medium text-[#6B625D] bg-[#6B1725]/6 px-2 py-0.5 rounded-full border border-[#6B1725]/10 whitespace-nowrap">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Heritage Sparkle Separator */}
            <div className="flex items-center justify-center mx-1.5 text-[#B08A3C]/50 shrink-0">
              <Sparkles size={11} className="text-[#B08A3C]/70" />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="w-full bg-gradient-to-r from-[#FAF7F0] via-[#F5EFE4] to-[#FAF7F0] text-[#292524] border-y border-[#B08A3C]/25 py-2.5 sm:py-3 overflow-hidden select-none relative group shadow-xs cursor-default"
    >
      {/* Left Fade Gradient */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FAF7F0] to-transparent z-10" />

      {/* Right Fade Gradient */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FAF7F0] to-transparent z-10" />

      {/* Pure CSS GPU Compositor Marquee (zero JS main-thread load) */}
      <div
        className="flex w-max items-center animate-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused]"
      >
        {renderItemSet("set-1")}
        {renderItemSet("set-2")}
      </div>
    </div>
  );
};
