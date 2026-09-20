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

const AUTO_PLAY_INTERVAL = 3400;

export const QuickDeliverySection: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [prevStepIndex, setPrevStepIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInteractionTimer = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 4500);
  }, []);

  const triggerStepChange = useCallback((nextIdx: number, dir: 'next' | 'prev') => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    setPrevStepIndex(activeStepIndex);
    setActiveStepIndex(nextIdx);
    setDirection(dir);
    setIsTransitioning(true);

    transitionTimerRef.current = setTimeout(() => {
      setPrevStepIndex(null);
      setIsTransitioning(false);
    }, 620);
  }, [activeStepIndex]);

  const goToNext = useCallback(() => {
    const nextIdx = (activeStepIndex + 1) % DELIVERY_STEPS.length;
    triggerStepChange(nextIdx, 'next');
  }, [activeStepIndex, triggerStepChange]);

  const goToPrev = useCallback(() => {
    const nextIdx = activeStepIndex === 0 ? DELIVERY_STEPS.length - 1 : activeStepIndex - 1;
    triggerStepChange(nextIdx, 'prev');
  }, [activeStepIndex, triggerStepChange]);

  // Smooth auto-advance every 3.6s
  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      goToNext();
    }, 3600);

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

  const handleStepClick = (idx: number) => {
    if (idx === activeStepIndex) return;
    const dir = idx > activeStepIndex ? 'next' : 'prev';
    triggerStepChange(idx, dir);
    resetInteractionTimer();
  };

  return (
    <section className="py-2.5 sm:py-5 px-3 sm:px-6 lg:px-8 bg-[#FAF7F0] border-b border-[#E7DFC9]/60 select-none">
      <div className="max-w-7xl mx-auto space-y-2">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 1. MOBILE VIEW: PRECISE CONNECTED TIMELINE & SMOOTH STAGE     */}
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

          {/* B. Live Step Indicator Pill */}
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#6B1725]/6 border border-[#6B1725]/15 text-[11px] font-medium text-[#6B1725]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C2234] animate-ping" />
              <span>{DELIVERY_STEPS[activeStepIndex].badge}</span>
            </div>
          </div>

          {/* C. Silky Smooth Cross-Glide Stage (Zero Sudden Snap) */}
          <div
            className="relative w-full h-[160px] pt-1 pb-1 overflow-hidden touch-pan-y"
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
              className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/75 backdrop-blur-xs border border-[#E7DFC9] flex items-center justify-center text-[#6B1725] shadow-xs active:scale-90 transition-transform cursor-pointer"
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
              className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/75 backdrop-blur-xs border border-[#E7DFC9] flex items-center justify-center text-[#6B1725] shadow-xs active:scale-90 transition-transform cursor-pointer"
              aria-label="Next step"
            >
              <ChevronRight size={16} />
            </button>

            {/* Slide Layers */}
            {DELIVERY_STEPS.map((s, idx) => {
              const isActive = idx === activeStepIndex;
              const isExiting = idx === prevStepIndex;

              if (!isActive && !isExiting) return null;

              let animStyle = '';
              if (isTransitioning) {
                if (isActive) {
                  animStyle = direction === 'next' ? 'sbs-slide-in-right' : 'sbs-slide-in-left';
                } else if (isExiting) {
                  animStyle = direction === 'next' ? 'sbs-slide-out-left' : 'sbs-slide-out-right';
                }
              }

              return (
                <div
                  key={`${s.step}-${isActive ? 'active' : 'exit'}-${activeStepIndex}`}
                  onClick={() => openPincodeSheet()}
                  className={`absolute inset-0 flex items-center justify-center px-6 cursor-pointer will-change-transform ${animStyle}`}
                  style={{
                    transform: isActive && !isTransitioning && touchDelta !== 0
                      ? `translateX(${touchDelta}px)`
                      : undefined
                  }}
                  title="Click to check delivery pincode"
                >
                  <div className="relative w-full max-w-[310px] aspect-[700/480] max-h-[155px] flex items-center justify-center p-1">
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
                onMouseEnter={() => setActiveStepIndex(idx)}
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
