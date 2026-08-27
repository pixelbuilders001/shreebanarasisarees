"use client";

import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#52111C] text-[#FAF7F0] text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 sm:gap-4 border-b border-[#B08A3C]/25 select-none z-50 relative">
      <span>✨ Pan-India Delivery</span>
      <span className="w-1.5 h-1.5 rounded-full bg-[#B08A3C]" />
      <span>Secure Payments</span>
      <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#B08A3C]" />
      <span className="hidden sm:inline-block text-[#D4B870] font-semibold">COD Available 🇮🇳</span>
    </div>
  );
};


