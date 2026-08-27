import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#FFF9F0]/80 backdrop-blur-md z-[99999] flex flex-col items-center justify-center pointer-events-none select-none animate-fadeIn">
      {/* Brand Icon / Logo Loader with gold & maroon animation */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Outer glowing gold ring */}
        <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-[#C9A45C]/40 animate-ping opacity-75" />

        {/* Inner spinning border */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-transparent border-t-[#801F32] border-r-[#C9A45C] animate-spin" />

        {/* Center brand logo */}
        <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFF9F0] border-2 border-[#C9A45C]/40 flex items-center justify-center shadow-lg overflow-hidden p-1">
          <img
            src="/brand_logo.webp"
            alt="Shree Banarasi Sarees Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>

      {/* Title */}
      {/* <h2 className="font-serif text-lg sm:text-xl font-extrabold text-[#801F32] tracking-widest text-center animate-pulse">
        SHREE BANARASI SAREES
      </h2>

      {/* Subtitle */}
      {/* <p className="font-serif text-[11px] text-[#C9A45C] tracking-[0.2em] uppercase mt-1 font-semibold">
        श्री बनारसी साड़ियाँ
      </p> */}

      {/* Premium Loading Progress Bar */}
      {/* <div className="w-36 sm:w-44 h-[2.5px] bg-[#F7EEDF] rounded-full mt-5 overflow-hidden relative shadow-inner">
        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-[#801F32] via-[#C9A45C] to-[#801F32] animate-loading-progress" />
      </div> */}
    </div>
  );
}
