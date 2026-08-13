import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#FFF9F0] z-[9999] flex flex-col items-center justify-center pointer-events-none select-none">
      {/* Brand Icon / Logo Loader with gold/maroon animation */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer glowing gold ring */}
        <div className="absolute w-24 h-24 rounded-full border border-[#C9A45C]/40 animate-ping opacity-75" />
        
        {/* Inner spinning border */}
        <div className="w-20 h-20 rounded-full border-2 border-transparent border-t-[#801F32] border-r-[#801F32] animate-spin" />
        
        {/* Center brand acronym */}
        <div className="absolute w-14 h-14 rounded-full bg-[#FFF9F0] border border-[#C9A45C]/40 flex items-center justify-center shadow-inner">
          <span className="font-serif font-extrabold text-[#801F32] text-base tracking-wider">SBS</span>
        </div>
      </div>
      
      {/* Title */}
      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2D211D] tracking-widest text-center animate-pulse">
        SHREE BANARASI SAREES
      </h2>
      
      {/* Subtitle */}
      <p className="font-serif text-[10px] text-[#C9A45C] tracking-widest uppercase mt-1.5 font-semibold">
        श्री बनारसी साड़ियाँ
      </p>
      
      {/* Premium Loading Progress Bar */}
      <div className="w-36 h-[2px] bg-[#F7EEDF] rounded-full mt-5 overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 w-full bg-[#801F32] animate-loading-progress" />
      </div>
    </div>
  );
}
