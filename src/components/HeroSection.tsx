"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { fetchActiveHeroBanners, DbHeroBanner } from '../data/supabase';

// High-resolution authentic Indian saree model hero images
const DEFAULT_HERO_SLIDES = [
  {
    id: "hero-slide-1",
    title: "Timeless Sarees. Rooted in Tradition.",
    subtitle: "Discover authentic handwoven Banarasi Katan silk sarees directly from master weaver looms.",
    image_url: "/hero_banner_1.png",
    button_link: "/sarees",
    badge: "HERITAGE HANDLOOM"
  },
  {
    id: "hero-slide-2",
    title: "Royal Banarasi Silk Edit",
    subtitle: "Intricate zari weaves & pure Katan silk crafted for grand bridal trousseaus.",
    image_url: "/hero_banner_2.png",
    button_link: "/sarees?category=Bridal+Collection",
    badge: "BRIDAL TROUSSEAU"
  },
  {
    id: "hero-slide-3",
    title: "Crafted for Special Celebrations",
    subtitle: "Vibrant Bandhanis, Chikankaris and opulent festive hues for every auspicious event.",
    image_url: "/hero_banner_3.png",
    button_link: "/sarees?category=Festive+Sarees",
    badge: "FESTIVE COLLECTION"
  },
  {
    id: "hero-slide-4",
    title: "Lightweight Organza & Chanderi",
    subtitle: "Ethereal sheer textures with delicate zari borders for modern day-to-night elegance.",
    image_url: "/hero_banner_4.png",
    button_link: "/sarees?category=Organza+Sarees",
    badge: "CONTEMPORARY WEAVES"
  }
];

interface HeroSectionProps {
  initialBanners?: DbHeroBanner[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ initialBanners }) => {
  const [dbBanners, setDbBanners] = useState<DbHeroBanner[]>(initialBanners ?? []);
  const [loading, setLoading] = useState(initialBanners === undefined);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialBanners !== undefined) return;
    let cancelled = false;
    fetchActiveHeroBanners().then(data => {
      if (!cancelled) {
        setDbBanners(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [initialBanners]);

  const slides = dbBanners.length > 0
    ? dbBanners.map((b, i) => ({
        id: b.id || `db-banner-${i}`,
        title: b.title || `Banner ${i + 1}`,
        subtitle: DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].subtitle,
        image_url: b.image_url,
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

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / (width * 0.85));
      setActiveIdx(Math.min(Math.max(index, 0), slides.length - 1));
    }
  };

  const prevDesktopSlide = () => {
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextDesktopSlide = () => {
    setActiveIdx((prev) => (prev + 1) % slides.length);
  };

  if (loading) {
    return (
      <div className="w-full bg-[#FAF6EE] px-4 py-3">
        <div className="w-[85vw] md:w-full aspect-[1.8/1] md:aspect-[21/8] rounded-2xl bg-[#E5DEC9] animate-pulse max-w-7xl mx-auto" />
      </div>
    );
  }

  const currentSlide = slides[activeIdx] || slides[0];

  return (
    <>
      {/* ── 1. MOBILE HERO VIEW (PRESERVED 100% UNTOUCHED FOR MOBILE) ── */}
      <section className="w-full bg-[#FAF6EE] py-3 select-none md:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 no-scrollbar scroll-smooth"
        >
          {slides.map((slide) => (
            <Link
              key={slide.id}
              href={slide.button_link}
              className="shrink-0 w-[86vw] sm:w-[90vw] snap-center relative aspect-[1.85/1] sm:aspect-[2.4/1] rounded-2xl overflow-hidden border border-[#E5DEC9] shadow-2xs group block"
            >
              <Image
                src={slide.image_url}
                alt={slide.title || "Shree Banarasi Sarees Banner"}
                fill
                unoptimized
                priority
                className="object-cover object-center w-full h-full group-hover:scale-102 transition-transform duration-500"
              />
            </Link>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="flex justify-center items-center pt-2.5">
            <div className="w-20 h-1 bg-[#E5DEC9] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-[#B08A3C] rounded-full transition-all duration-300"
                style={{
                  width: `${100 / slides.length}%`,
                  transform: `translateX(${activeIdx * 100}%)`,
                }}
              />
            </div>
          </div>
        )}
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
                  unoptimized
                  priority={idx === 0}
                  className="object-cover object-center w-full h-full group-hover:scale-102 transition-transform duration-700"
                />
              </Link>
            ))}

            {/* Desktop Left/Right Slide Arrows */}
            <button
              onClick={prevDesktopSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-[#6B1725] border border-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={nextDesktopSlide}
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
