"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { DbHeroBanner } from '../data/supabase';
import { useHeroBanners } from '../hooks/useHeroBanners';

interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  mobile_image_url?: string | null;
  button_link: string;
  badge: string;
}

// High-resolution authentic Indian saree model hero images
const DEFAULT_HERO_SLIDES: SlideItem[] = [
  {
    id: "hero-slide-1",
    title: "Timeless Sarees. Rooted in Tradition.",
    subtitle: "Discover authentic handwoven Banarasi Katan silk sarees directly from master weaver looms.",
    image_url: "/hero_banner_1.png",
    mobile_image_url: null,
    button_link: "/sarees",
    badge: "HERITAGE HANDLOOM"
  },
  {
    id: "hero-slide-2",
    title: "Royal Banarasi Silk Edit",
    subtitle: "Intricate zari weaves & pure Katan silk crafted for grand bridal trousseaus.",
    image_url: "/hero_banner_2.png",
    mobile_image_url: null,
    button_link: "/sarees?category=Bridal+Collection",
    badge: "BRIDAL TROUSSEAU"
  },
  {
    id: "hero-slide-3",
    title: "Crafted for Special Celebrations",
    subtitle: "Vibrant Bandhanis, Chikankaris and opulent festive hues for every auspicious event.",
    image_url: "/hero_banner_3.png",
    mobile_image_url: null,
    button_link: "/sarees?category=Festive+Sarees",
    badge: "FESTIVE COLLECTION"
  },
  {
    id: "hero-slide-4",
    title: "Lightweight Organza & Chanderi",
    subtitle: "Ethereal sheer textures with delicate zari borders for modern day-to-night elegance.",
    image_url: "/hero_banner_4.png",
    mobile_image_url: null,
    button_link: "/sarees?category=Organza+Sarees",
    badge: "CONTEMPORARY WEAVES"
  }
];

interface HeroSectionProps {
  initialBanners?: DbHeroBanner[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ initialBanners }) => {
  const { banners: dbBanners, isLoading: loading } = useHeroBanners(initialBanners);
  const [activeIdx, setActiveIdx] = useState(0);

  const slides: SlideItem[] = dbBanners.length > 0
    ? dbBanners.map((b, i) => ({
        id: b.id || `db-banner-${i}`,
        title: b.title || `Banner ${i + 1}`,
        subtitle: DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].subtitle,
        image_url: b.image_url,
        mobile_image_url: b.mobile_image_url || null,
        button_link: b.button_link || "/sarees",
        badge: DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].badge
      }))
    : DEFAULT_HERO_SLIDES;

  // Desktop auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const prevSlide = () => {
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  // Touch swipe handling for mobile
  const minSwipeDistance = 45;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#FAF6EE] px-3 md:px-6 py-2 md:py-6">
        <div className="w-full aspect-[2/3] md:aspect-[21/8] rounded-2xl md:rounded-3xl bg-[#E5DEC9] animate-pulse max-w-7xl mx-auto" />
      </div>
    );
  }

  const currentSlide = slides[activeIdx] || slides[0];

  return (
    <>
      {/* ── 1. MOBILE HERO VIEW (FULL WIDTH - ASPECT 2/3 - NEXT/PREV INDICATORS) ── */}
      <section className="w-full bg-[#FAF6EE] py-2 px-3 select-none md:hidden">
        <div
          className="relative w-full aspect-[2/3] max-h-[78vh] rounded-2xl overflow-hidden border border-[#E5DEC9] shadow-md bg-[#292524] touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Mobile Slides with Smooth Crossfade */}
          {slides.map((slide, idx) => (
            <Link
              key={slide.id}
              href={slide.button_link}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out block ${
                idx === activeIdx ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.mobile_image_url || slide.image_url}
                alt={slide.title || "Shree Banarasi Sarees Banner"}
                fill
                priority={idx === 0}
                loading={idx === 0 ? "eager" : "lazy"}
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover object-center w-full h-full"
              />
            </Link>
          ))}

          {/* Mobile Left Arrow Indicator */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/35 hover:bg-black/55 text-white border border-white/20 backdrop-blur-sm shadow-md active:scale-90 transition-transform"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Mobile Right Arrow Indicator */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/35 hover:bg-black/55 text-white border border-white/20 backdrop-blur-sm shadow-md active:scale-90 transition-transform"
            aria-label="Next Slide"
          >
            <ChevronRight size={18} />
          </button>

          {/* Mobile Bottom Indicators & Counter */}
          <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-between px-3 pointer-events-none">
            {/* Dots */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15 pointer-events-auto">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeIdx ? 'w-5 bg-[#B08A3C]' : 'w-1.5 bg-white/45'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Counter Badge */}
            <div className="bg-black/40 backdrop-blur-md text-[11px] font-semibold text-white/90 px-2 py-0.5 rounded-full border border-white/15">
              {activeIdx + 1} / {slides.length}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. DESKTOP HERO VIEW (REDESIGNED LUXURY EXPERIENCE FOR DESKTOP/LAPTOP) ── */}
      <section className="hidden md:block w-full bg-[#FAF6EE] py-6 px-6">
        <div className="max-w-7xl mx-auto relative group">
          {/* Main Slide Card Container */}
          <div className="relative w-full aspect-[21/8] min-h-[460px] max-h-[580px] rounded-3xl overflow-hidden border border-[#B08A3C]/30 shadow-2xl bg-[#292524]">
            {/* Background Image with Smooth Crossfade */}
            {slides.map((slide, idx) => (
              <Link
                key={slide.id}
                href={slide.button_link}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out block ${
                  idx === activeIdx ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Image
                  src={slide.image_url}
                  alt={slide.title || "Shree Banarasi Sarees Banner"}
                  fill
                  priority={false}
                  loading={idx === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center w-full h-full group-hover:scale-102 transition-transform duration-700"
                />
              </Link>
            ))}

            {/* Desktop Left/Right Slide Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-[#6B1725] border border-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-[#6B1725] border border-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight size={22} />
            </button>

            {/* Desktop Pagination Indicators */}
            <div className="absolute bottom-6 right-8 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeIdx ? 'w-8 bg-[#B08A3C]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
