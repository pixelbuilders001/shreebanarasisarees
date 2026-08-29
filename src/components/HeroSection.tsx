"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { fetchActiveHeroBanners, DbHeroBanner } from '../data/supabase';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholder';

// High-resolution authentic Indian saree model hero images
const DEFAULT_HERO_SLIDES = [
  {
    id: "hero-slide-1",
    title: "Timeless Sarees. Rooted in Tradition.",
    subtitle: "Discover elegant Banarasi, silk and handcrafted sarees for weddings, festivities and every beautiful occasion.",
    eyebrow: "HERITAGE WEAVES FROM SAMASTIPUR",
    image_url: "/hero_banner_1.png",
    button_text: "SHOP SAREES",
    button_link: "/sarees",
    secondary_text: "EXPLORE BANARASI",
    secondary_link: "/sarees?category=Banarasi+Sarees"
  },
  {
    id: "hero-slide-2",
    title: "Royal Banarasi Silk Edit",
    subtitle: "Intricate gold zari jaals, rich Katan silk drapes, and heirloom designs woven with master craftsmanship.",
    eyebrow: "BRIDAL & FESTIVE SPECIALS",
    image_url: "/hero_banner_2.png",
    button_text: "EXPLORE BRIDAL COLLECTION",
    button_link: "/sarees?category=Bridal+Collection",
    secondary_text: "VIEW ALL SILKS",
    secondary_link: "/sarees?category=Silk+Sarees"
  },
  {
    id: "hero-slide-3",
    title: "Crafted for Special Celebrations",
    subtitle: "Magnificent bridal weaves and opulent grand drapes handcrafted for lifetime memories.",
    eyebrow: "HERITAGE LEHENGA & SILKS",
    image_url: "/hero_banner_3.png",
    button_text: "SHOP CELEBRATION WEAVES",
    button_link: "/sarees?category=Festive+Sarees",
    secondary_text: "EXPLORE KATAN SILK",
    secondary_link: "/sarees?category=Katan+Silk"
  },
  {
    id: "hero-slide-4",
    title: "Lightweight Organza & Chanderi",
    subtitle: "Breathable, ethereal drapes with subtle metallic borders — ideal for day functions, summer weddings & gifting.",
    eyebrow: "CONTEMPORARY ELEGANCE",
    image_url: "/hero_banner_4.png",
    button_text: "SHOP ORGANZA & CHANDERI",
    button_link: "/sarees?category=Organza+Sarees",
    secondary_text: "SHOP UNDER ₹1,999",
    secondary_link: "/sarees?maxPrice=1999"
  }
];

interface HeroSectionProps {
  initialBanners?: DbHeroBanner[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ initialBanners }) => {
  const [dbBanners, setDbBanners] = useState<DbHeroBanner[]>(initialBanners ?? []);
  const [loading, setLoading] = useState(initialBanners === undefined);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch/swipe tracking
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef(false);

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

  // Combined banners: if DB has banners, map them; otherwise use rich default slides
  const slides = dbBanners.length > 0
    ? dbBanners.map((b, i) => ({
      id: b.id || `db-banner-${i}`,
      title: b.title || DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].title,
      subtitle: b.subtitle || DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].subtitle,
      eyebrow: b.eyebrow || "SHREE BANARASI SAREES",
      image_url: b.image_url,
      button_text: b.button_text || "SHOP SAREES",
      button_link: b.button_link || "/sarees",
      secondary_text: i === 0 ? "EXPLORE BANARASI" : undefined,
      secondary_link: i === 0 ? "/sarees?category=Banarasi+Sarees" : undefined,
    }))
    : DEFAULT_HERO_SLIDES;

  const handlePrev = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 5) isDragging.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (!isDragging.current) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) handleNext();
    else if (delta > 40) handlePrev();
    isDragging.current = false;
  };

  if (loading) {
    return (
      <div className="w-full bg-[#292524] aspect-[4/3] sm:aspect-[16/9] md:aspect-[2.2/1] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#292524] select-none">
      <div
        className="relative w-full aspect-[2.1/1] sm:aspect-[16/9] md:aspect-[2.1/1] lg:aspect-[2.4/1] sm:min-h-[420px] md:min-h-[500px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <Link
              key={slide.id}
              href={slide.button_link || "/sarees"}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
            >
              {/* Full Width Hero Image with baked-in banner visuals */}
              <Image
                src={slide.image_url}
                alt={slide.title || "Shree Banarasi Sarees Banner"}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center w-full h-full transform scale-[1.01] transition-transform duration-7000 ease-linear"
              />
            </Link>
          );
        })}

        {/* Prev / Next controls */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#292524]/50 hover:bg-[#6B1725] text-white border border-[#B08A3C]/30 backdrop-blur-sm items-center justify-center transition-all shadow-lg hover:scale-105"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#292524]/50 hover:bg-[#6B1725] text-white border border-[#B08A3C]/30 backdrop-blur-sm items-center justify-center transition-all shadow-lg hover:scale-105"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-400 ${idx === currentSlide
                  ? 'w-8 bg-[#B08A3C]'
                  : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
