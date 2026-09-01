import React from 'react';

const LOADER_ICONS = [
  "/loader%20icons/loader_1.png",
  "/loader%20icons/loader_2.png",
  "/loader%20icons/loader_3.png",
  "/loader%20icons/loader_4.png",
  "/loader%20icons/loader_5.png"
];

export const IconMarqueeLoader: React.FC = () => {
  const marqueeList = [...LOADER_ICONS, ...LOADER_ICONS, ...LOADER_ICONS, ...LOADER_ICONS];

  return (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden flex flex-col items-center justify-center pointer-events-none select-none px-4 bg-[#FAF7F0]/70 backdrop-blur-xl transform-gpu"
      style={{
        WebkitBackdropFilter: 'blur(24px) brightness(0.97)',
        backdropFilter: 'blur(24px) brightness(0.97)'
      }}
    >
      {/* 1. Brand Logo Above PNG Icons Track */}
      <div className="relative z-10 mb-5 sm:mb-7">
        <img
          src="/brand_logo.webp"
          alt="Shree Banarasi Sarees Logo"
          className="h-12 sm:h-16 md:h-20 w-auto object-contain"
        />
      </div>

      {/* 2. Ultra-Smooth Hardware-Accelerated Marquee Track */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-2xl md:max-w-3xl mx-auto overflow-hidden py-3 sm:py-5 transform-gpu">
        <div className="flex items-center gap-6 sm:gap-10 md:gap-14 animate-marquee-loader w-max transform-gpu">
          {marqueeList.map((src, idx) => (
            <div
              key={idx}
              className="shrink-0 flex items-center justify-center transform-gpu"
            >
              <img
                src={src}
                alt="Loader Icon"
                className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain transform-gpu"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sleek Gold Zari Thread Pulse Accent Line */}
      <div className="relative z-10 mt-3 sm:mt-4 w-36 sm:w-60 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#B08A3C]/70 to-transparent shadow-xs" />
    </div>
  );
};

export default IconMarqueeLoader;
