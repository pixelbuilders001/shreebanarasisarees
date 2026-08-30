"use client";

import React, { useRef, useEffect, useState } from 'react';

export const DeliveryAnimationSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (videoRef.current) {
            videoRef.current.play().catch(() => {
              // Autoplay policy fallback
            });
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Cycle active highlight through 3 steps smoothly matching video progress
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 5200);
    return () => clearInterval(interval);
  }, [isVisible]);

  const steps = [
    {
      step: "01",
      title: "ORDER 🛍️",
      desc: "Choose saree & order",
      delay: "delay-100"
    },
    {
      step: "02",
      title: "CONFIRM ✓",
      desc: "We pack & prepare",
      delay: "delay-300"
    },
    {
      step: "03",
      title: "DELIVER 🛵",
      desc: "Doorstep in 20 mins",
      delay: "delay-500"
    }
  ];

  return (
    <section
      ref={sectionRef}
      aria-label="How 20-Minute Delivery Works"
      className="relative w-full bg-[#FAF7F0] overflow-hidden py-4 md:hidden"
    >
      <div className="w-full max-w-5xl mx-auto px-0">
        
        {/* 3 Step Pills appearing one by one smoothly */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5 max-w-4xl mx-auto px-2">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className={`px-1.5 py-2 rounded-none border text-center transition-all duration-700 ease-out transform ${item.delay} ${
                isVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-5 scale-95'
              } ${
                activeStep === idx
                  ? 'bg-[#F5EFE4] text-[#6B1725] border-[#6B1725] shadow-xs'
                  : 'bg-white text-[#292524] border-[#B08A3C]/35 shadow-xs'
              }`}
            >
              <span className={`font-sans font-bold text-[10px] uppercase tracking-wider block transition-colors ${
                activeStep === idx ? 'text-[#6B1725]' : 'text-[#6B1725]'
              }`}>
                <span className={activeStep === idx ? 'text-[#B08A3C]' : 'text-[#B08A3C]'}>{item.step}.</span> {item.title}
              </span>
              <span className={`text-[9px] font-light block leading-tight mt-0.5 transition-colors ${
                activeStep === idx ? 'text-[#6B1725]/90 font-medium' : 'text-[#6B625D]'
              }`}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Video Animation Container Directly Below Steps */}
        <div className={`rounded-none overflow-hidden shadow-xs border-y border-[#B08A3C]/20 bg-[#FAF7F0] transition-all duration-1000 delay-500 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/how-it-works-poster.webp"
            onLoadedData={() => setIsVideoLoaded(true)}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full h-auto max-h-[380px] object-cover mx-auto block pointer-events-none select-none transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-90'}`}
          >
            <source src="/how-it-works.webm" type="video/webm" />
            <source src="/how-it-works.mp4" type="video/mp4" />
          </video>
        </div>

      </div>
    </section>
  );
};
