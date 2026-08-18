"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { fetchActiveHeroBanners, DbHeroBanner } from '../data/supabase';

// ─── Fallback hero shown when no active banners are available ─────────────────
function FallbackHero() {
  return (
    <div className="w-full px-3.5 pt-3.5 pb-1 md:px-0 md:py-0">
      <div className="relative w-full aspect-[16/9] md:aspect-[7/3] rounded-2xl md:rounded-none overflow-hidden bg-dark-brown shadow-md md:shadow-none flex items-center justify-center">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-brown via-maroon/80 to-dark-brown" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10 text-center px-6 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-gold" />
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-gold uppercase font-serif">
              Shree Banarasi Sarees
            </span>
            <Sparkles size={16} className="text-gold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-ivory leading-tight">
            Timeless Elegance,<br />
            <span className="text-gold">Woven with Tradition</span>
          </h2>
          <p className="text-xs sm:text-sm text-ivory/75 font-light max-w-md mx-auto leading-relaxed">
            Discover our exclusive collection of Banarasi, Organza, and handloom sarees — crafted for every occasion.
          </p>
          <Link
            href="/sarees"
            className="inline-block mt-2 py-2.5 px-7 bg-gold text-dark-brown rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-gold/90 hover:scale-105 active:scale-95 transition-all shadow"
          >
            Explore Collection →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="w-full px-3.5 pt-3.5 pb-1 md:px-0 md:py-0">
      <div className="relative w-full aspect-[16/9] md:aspect-[7/3] rounded-2xl md:rounded-none overflow-hidden bg-dark-brown/20 animate-pulse shadow-md md:shadow-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
    </div>
  );
}

// ─── Main carousel ────────────────────────────────────────────────────────────
// `initialBanners` (server-provided) lets the first hero image ship in the
// initial HTML instead of waiting on a client fetch — the key LCP win.
interface HeroSectionProps {
  initialBanners?: DbHeroBanner[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ initialBanners }) => {
  const [banners, setBanners] = useState<DbHeroBanner[]>(initialBanners ?? []);
  const [loading, setLoading] = useState(initialBanners === undefined);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState<number[]>([0]);
  const [isPaused, setIsPaused] = useState(false);

  // Touch/swipe tracking
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef(false);

  // ── Fetch banners on mount (only when not server-provided) ─────────────────
  useEffect(() => {
    if (initialBanners !== undefined) return;
    let cancelled = false;
    fetchActiveHeroBanners().then(data => {
      if (!cancelled) {
        setBanners(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [initialBanners]);

  // ── Slide navigation ────────────────────────────────────────────────────────
  const goTo = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  // ── Pre-load adjacent slides ────────────────────────────────────────────────
  useEffect(() => {
    if (banners.length === 0) return;
    const next = (currentSlide + 1) % banners.length;
    setVisitedSlides(prev => {
      const updated = [...prev];
      if (!updated.includes(currentSlide)) updated.push(currentSlide);
      if (!updated.includes(next)) updated.push(next);
      return updated;
    });
  }, [currentSlide, banners.length]);

  // ── Auto-slide every 4.5 s ──────────────────────────────────────────────────
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrev, handleNext]);

  // ── Touch / swipe handlers ──────────────────────────────────────────────────
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

  // ── Render states ───────────────────────────────────────────────────────────
  if (loading) return <HeroSkeleton />;
  if (banners.length === 0) return <FallbackHero />;

  const banner = banners[currentSlide];
  const hasText = banner.eyebrow || banner.title || banner.subtitle || banner.button_text;

  return (
    <div className="w-full px-3.5 pt-3.5 pb-1 md:px-0 md:py-0">
      <div
        className="relative w-full aspect-[16/9] md:aspect-[7/3] rounded-2xl md:rounded-none overflow-hidden bg-dark-brown shadow-md md:shadow-none select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Slides ────────────────────────────────────────────────────── */}
        {banners.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Image */}
            {visitedSlides.includes(index) ? (
              index === 0 ? (
                <Image
                  src={slide.image_url}
                  alt={slide.title || slide.eyebrow || `Hero banner ${index + 1}`}
                  fill
                  priority
                  sizes="100vw"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={slide.image_url}
                  alt={slide.title || slide.eyebrow || `Hero banner ${index + 1}`}
                  fill
                  sizes="100vw"
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-dark-brown" />
            )}

            {/* Text overlay — only if CTA link exists (whole slide is clickable) or we show the overlay */}
            {hasText && index === currentSlide && (
              <>
                {/* Gradient scrim for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent pointer-events-none" />

                {/* Text content */}
                <div className="absolute inset-0 z-10 flex items-center">
                  <div className="px-5 sm:px-10 md:px-16 max-w-lg space-y-2 sm:space-y-3">
                    {banner.eyebrow && (
                      <p className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-widest text-gold uppercase font-serif animate-fade-in">
                        —— {banner.eyebrow} ——
                      </p>
                    )}
                    {banner.title && (
                      <h2 className="font-serif text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide text-ivory leading-tight animate-fade-in drop-shadow-md">
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p className="text-[10px] sm:text-sm text-ivory/80 font-light leading-relaxed animate-fade-in line-clamp-2 max-w-xs sm:max-w-sm">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.button_text && banner.button_link && (
                      <div className="pt-1 sm:pt-2 animate-fade-in">
                        <Link
                          href={banner.button_link}
                          className="inline-block py-2 px-5 sm:py-2.5 sm:px-7 bg-gold text-dark-brown rounded font-serif font-bold text-[10px] sm:text-xs tracking-wider uppercase hover:bg-gold/90 hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                          {banner.button_text}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* If no text overlay but has button_link, make whole slide a link */}
            {!hasText && slide.button_link && (
              <Link
                href={slide.button_link}
                className="absolute inset-0 z-10"
                aria-label={`Hero banner ${index + 1}`}
              />
            )}
          </div>
        ))}

        {/* ── Prev / Next arrows (desktop only) ─────────────────────────── */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="hidden sm:flex absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-dark-brown/40 text-white hover:bg-maroon hover:text-white transition-all shadow-md items-center justify-center"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-dark-brown/40 text-white hover:bg-maroon hover:text-white transition-all shadow-md items-center justify-center"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* ── Slide indicators ──────────────────────────────────────────── */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gold w-6 sm:w-7'
                    : 'bg-white/50 w-2 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Auto-slide progress bar ────────────────────────────────────── */}
        {banners.length > 1 && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-transparent overflow-hidden">
            <div
              key={`progress-${currentSlide}`}
              className="h-full bg-gold/60"
              style={{ animation: 'heroProgress 4.5s linear forwards' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
