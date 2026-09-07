import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col items-center justify-center pointer-events-none select-none px-4 bg-[#FAF7F0]/90">
      {/* Brand Logo */}
      <div className="relative mb-5">
        <img
          src="/brand_logo.webp"
          alt="Shree Banarasi Sarees Logo"
          className="h-12 sm:h-16 w-auto object-contain"
        />
      </div>

      {/* Elegant Gold Spinner */}
      <div className="w-8 h-8 rounded-full border-2 border-[#E5DEC9] border-t-[#B08A3C] animate-spin mb-3" />

      {/* Sleek Gold Accent Thread */}
      <div className="w-28 sm:w-36 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-[#B08A3C]/60 to-transparent" />
    </div>
  );
}

