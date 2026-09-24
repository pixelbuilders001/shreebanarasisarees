"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { openPincodeSheet } from './DeliveryPincodeBar';

const DELIVERY_STEPS = [
  {
    step: '01',
    label: 'Order',
    badge: 'Step 1 • Instant Confirmation',
    image: '/quick-delivery/quick_delivery_01.webp',
    fallbackImage: '/quick%20deivery/quick_delivery_01.webp',
    alt: 'Step 1: Order Online - Choose your favorite saree from our website'
  },
  {
    step: '02',
    label: '20m Ride',
    badge: 'Step 2 • Express Rider Dispatched',
    image: '/quick-delivery/quick_delivery_02.webp',
    fallbackImage: '/quick%20deivery/quick_delivery_02.webp',
    alt: 'Step 2: We Deliver - Delivery partner picks up order with a 20-min timer'
  },
  {
    step: '03',
    label: 'Doorstep',
    badge: 'Step 3 • Luxury Box Handover',
    image: '/quick-delivery/quick_delivery_03.webp',
    fallbackImage: '/quick%20deivery/quick_delivery_03.webp',
    alt: 'Step 3: At Your Doorstep - Delivery partner arrives in luxury packaging'
  },
  {
    step: '04',
    label: 'Unbox',
    badge: 'Step 4 • Delivered in 20 Minutes!',
    image: '/quick-delivery/quick_delivery_04.webp',
    fallbackImage: '/quick%20deivery/quick_delivery_04.webp',
    alt: 'Step 4: In Just 20 Minutes - Unbox your authentic Banarasi saree'
  }
];

const EXTENDED_STEPS = [
  { ...DELIVERY_STEPS[2], origIdx: 2 }, // 0: Step 3 (clone)
  { ...DELIVERY_STEPS[3], origIdx: 3 }, // 1: Step 4 (clone)
  { ...DELIVERY_STEPS[0], origIdx: 0 }, // 2: Step 1 (real)
  { ...DELIVERY_STEPS[1], origIdx: 1 }, // 3: Step 2 (real)
  { ...DELIVERY_STEPS[2], origIdx: 2 }, // 4: Step 3 (real)
  { ...DELIVERY_STEPS[3], origIdx: 3 }, // 5: Step 4 (real)
  { ...DELIVERY_STEPS[0], origIdx: 0 }, // 6: Step 1 (clone)
  { ...DELIVERY_STEPS[1], origIdx: 1 }, // 7: Step 2 (clone)
];

const AUTO_PLAY_INTERVAL = 3600;

export const QuickDeliverySection: React.FC = () => {
  const [extendedIndex, setExtendedIndex] = useState(2);
  const [enableTransition, setEnableTransition] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeStepIndex = EXTENDED_STEPS[extendedIndex]?.origIdx ?? 0;

  const resetInteractionTimer = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 4500);
  }, []);

  const goToNext = useCallback(() => {
    setEnableTransition(true);
    setExtendedIndex(prev => prev + 1);
  }, []);

  const goToPrev = useCallback(() => {
    setEnableTransition(true);
    setExtendedIndex(prev => prev - 1);
  }, []);

  const handleTransitionEnd = () => {
    if (extendedIndex >= 6) {
      setEnableTransition(false);
      setExtendedIndex(extendedIndex - 4);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
    } else if (extendedIndex <= 1) {
      setEnableTransition(false);
      setExtendedIndex(extendedIndex + 4);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
    }
  };

  // Smooth auto-advance every 3.6s
  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      goToNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [isInteracting, goToNext]);

  // Touch handlers for fluid swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    resetInteractionTimer();
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStart;
    setTouchDelta(diff);
  };

  const handleTouchEnd = () => {
    if (touchDelta < -40) {
      goToNext();
    } else if (touchDelta > 40) {
      goToPrev();
    }
    setTouchStart(null);
    setTouchDelta(0);
    resetInteractionTimer();
  };

  const handleStepClick = (targetOrigIdx: number) => {
    if (targetOrigIdx === activeStepIndex) return;
    setEnableTransition(true);

    const currentOrig = EXTENDED_STEPS[extendedIndex]?.origIdx ?? 0;
    if (currentOrig === 3 && targetOrigIdx === 0) {
      setExtendedIndex(6);
    } else if (currentOrig === 0 && targetOrigIdx === 3) {
      setExtendedIndex(1);
    } else {
      setExtendedIndex(targetOrigIdx + 2);
    }
    resetInteractionTimer();
  };

  // 58% width for center slide, leaves 21% (~82px) prominent preview on each side
  const ITEM_RATIO = 0.58;
  const TOTAL_ITEMS = EXTENDED_STEPS.length;
  const TRACK_RATIO = TOTAL_ITEMS * ITEM_RATIO;
  const slideTrackPercent = (1 / TOTAL_ITEMS) * 100;
  const centerOffsetTrackPercent = (0.5 / TRACK_RATIO) * 100;
  const targetTrackX = centerOffsetTrackPercent - (extendedIndex + 0.5) * slideTrackPercent;

  return (
    <section className="py-2.5 sm:py-5 px-3 sm:px-6 lg:px-8 bg-[#FAF7F0] border-b border-[#E7DFC9]/60 select-none">
      <div className="max-w-7xl mx-auto space-y-2">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 1. MOBILE VIEW: PRECISE CONNECTED TIMELINE & 3-SLIDE STAGE    */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="block md:hidden overflow-hidden">
          
          {/* A. Perfectly Aligned Connected Waypoints */}
          <div className="px-2 pt-1 pb-1">
            <div className="flex items-center justify-between">
              {DELIVERY_STEPS.map((s, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;

                return (
                  <React.Fragment key={s.step}>
                    {/* Waypoint Station */}
                    <button
                      onClick={() => handleStepClick(idx)}
                      className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-hidden"
                      aria-label={`Go to step ${idx + 1}: ${s.label}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-400 ease-out ${
                          isActive
                            ? 'bg-[#6B1725] text-[#FAF7F0] shadow-md shadow-[#6B1725]/30 ring-3 ring-[#6B1725]/20 scale-110'
                            : isPassed
                            ? 'bg-[#8C2234] text-[#F3EAD8]'
                            : 'bg-[#EFE8D6] text-[#8C7A6B] border border-[#DDD3BC]'
                        }`}
                      >
                        {isPassed ? '✓' : s.step}
                      </div>

                      <span
                        className={`mt-1 text-[10px] font-medium tracking-tight transition-colors duration-300 ${
                          isActive
                            ? 'text-[#6B1725] font-bold'
                            : isPassed
                            ? 'text-[#443831]'
                            : 'text-[#9E9081]'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>

                    {/* Connecting Segment between adjacent stations */}
                    {idx < DELIVERY_STEPS.length - 1 && (
                      <div className="flex-1 h-[2.5px] mx-1.5 -mt-4 bg-[#E8DEC7] relative rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8C2234] to-[#6B1725] rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: idx < activeStepIndex ? '100%' : '0%'
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>


          {/* C. 3-Slide Coverflow Stage (Center Sharp + Left/Right Blurred Peeks) */}
          <div
            className="relative h-[165px] pt-1 pb-1 overflow-hidden touch-pan-y -mx-3 w-[calc(100%+1.5rem)]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ambient Radial Golden Halo */}
            <div
              className="absolute inset-0 pointer-events-none opacity-45 blur-xl"
              style={{
                background: 'radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.22), transparent 70%)'
              }}
            />

            {/* Nav Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
                resetInteractionTimer();
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-[#E7DFC9] flex items-center justify-center text-[#6B1725] shadow-md active:scale-90 transition-transform cursor-pointer"
              aria-label="Previous step"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
                resetInteractionTimer();
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-[#E7DFC9] flex items-center justify-center text-[#6B1725] shadow-md active:scale-90 transition-transform cursor-pointer"
              aria-label="Next step"
            >
              <ChevronRight size={16} />
            </button>

            {/* Multi-Slide Carousel Track */}
            <div
              className="flex items-center h-full will-change-transform"
              style={{
                width: `${TRACK_RATIO * 100}%`,
                transform: touchDelta !== 0
                  ? `translateX(calc(${targetTrackX}% + ${touchDelta}px))`
                  : `translateX(${targetTrackX}%)`,
                transition: touchStart !== null || !enableTransition
                  ? 'none'
                  : 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {EXTENDED_STEPS.map((s, idx) => {
                const isCenter = idx === extendedIndex;

                return (
                  <div
                    key={`${s.step}-${idx}`}
                    onClick={() => {
                      if (isCenter) {
                        openPincodeSheet();
                      } else if (idx < extendedIndex) {
                        goToPrev();
                        resetInteractionTimer();
                      } else {
                        goToNext();
                        resetInteractionTimer();
                      }
                    }}
                    style={{
                      width: `${slideTrackPercent}%`,
                      filter: isCenter ? 'none' : 'blur(1.5px)',
                      opacity: isCenter ? 1 : 0.65,
                      transform: isCenter ? 'scale(1)' : 'scale(0.85)',
                      transition: 'transform 500ms ease-out, opacity 500ms ease-out, filter 500ms ease-out',
                    }}
                    className={`shrink-0 flex items-center justify-center py-1 select-none cursor-pointer ${
                      isCenter ? 'z-10' : 'z-0'
                    }`}
                    title={isCenter ? "Click to check delivery pincode" : `Go to Step ${s.step}: ${s.label}`}
                  >
                    <div className="relative w-full aspect-[700/480] max-h-[150px] flex items-center justify-center px-1">
                      <img
                        src={s.image}
                        alt={s.alt}
                        className="w-full h-full object-contain block drop-shadow-md"
                        loading="eager"
                        onError={(e) => {
                          if (s.fallbackImage && e.currentTarget.src !== s.fallbackImage) {
                            e.currentTarget.src = s.fallbackImage;
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 2. DESKTOP VIEW: 4 TRANSPARENT GRAPHICS FLOATING IN A ROW     */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-4 gap-3.5">
          {DELIVERY_STEPS.map((s, idx) => {
            const isActive = activeStepIndex === idx;

            return (
              <div
                key={s.step}
                onClick={() => openPincodeSheet()}
                onMouseEnter={() => handleStepClick(idx)}
                className={`group relative transition-all duration-500 cursor-pointer ${
                  isActive ? '-translate-y-1' : 'hover:-translate-y-0.5'
                }`}
                title="Click to check 20-min delivery in your area"
              >
                <div className="relative w-full aspect-[700/480] max-h-[155px] flex items-center justify-center p-1">
                  <img
                    src={s.image}
                    alt={s.alt}
                    className={`w-full h-full object-contain transition-all duration-500 ${
                      isActive
                        ? 'scale-[1.04] drop-shadow-md'
                        : 'group-hover:scale-[1.02] drop-shadow-xs'
                    }`}
                    loading="eager"
                    onError={(e) => {
                      if (s.fallbackImage && e.currentTarget.src !== s.fallbackImage) {
                        e.currentTarget.src = s.fallbackImage;
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. SLEEK REASSURANCE STRIP & PINCODE CHECKER                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="pt-0.5 flex items-center justify-between text-[11px] text-[#78716C] font-sans">
          <span className="truncate">
            ⚡ <strong>20-Min Hand Delivery in Samastipur</strong> • 🚚 3–5 Days Express Pan-India
          </span>
          <button
            onClick={() => openPincodeSheet()}
            className="text-[#6B1725] font-semibold hover:underline flex items-center gap-1 shrink-0 cursor-pointer ml-2"
          >
            <span>Check Pincode</span>
            <ArrowRight size={11} />
          </button>
        </div>

      </div>
    </section>
  );
};
