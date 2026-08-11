"use client";

import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-maroon-dark text-ivory text-xs sm:text-sm py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 border-b border-gold/20 select-none">
      <span>✨ Festive Collection Now Available | Starting ₹999</span>
      <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-gold"></span>
      <span className="hidden sm:inline-block text-gold-light">Free Shipping Across India 🇮🇳</span>
    </div>
  );
};
