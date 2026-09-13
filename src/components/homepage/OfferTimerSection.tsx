"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { HomepageSection } from '../../types/homepage-sections';

interface OfferTimerSectionProps {
  section: HomepageSection;
}

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  totalMs: number;
}

function calculateTimeLeft(targetIso?: string | null): TimeLeft | null {
  if (!targetIso) return null;

  const targetDate = new Date(targetIso).getTime();
  if (isNaN(targetDate)) return null;

  const now = Date.now();
  const diff = targetDate - now;

  if (diff <= 0) {
    return {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
      totalMs: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days: String(Math.max(0, days)).padStart(2, '0'),
    hours: String(Math.max(0, hours)).padStart(2, '0'),
    minutes: String(Math.max(0, minutes)).padStart(2, '0'),
    seconds: String(Math.max(0, seconds)).padStart(2, '0'),
    totalMs: diff,
  };
}

export const OfferTimerSection: React.FC<OfferTimerSectionProps> = ({ section }) => {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(section.end_at));

  // Determine start status
  const startTimestamp = useMemo(() => {
    if (!section.start_at) return null;
    const t = new Date(section.start_at).getTime();
    return isNaN(t) ? null : t;
  }, [section.start_at]);

  const endTimestamp = useMemo(() => {
    if (!section.end_at) return null;
    const t = new Date(section.end_at).getTime();
    return isNaN(t) ? null : t;
  }, [section.end_at]);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    setTimeLeft(calculateTimeLeft(section.end_at));

    if (!section.end_at) return;

    // Single interval for updating countdown every second
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      const updated = calculateTimeLeft(section.end_at);
      setTimeLeft(updated);

      // Halt interval once offer ends
      if (updated && updated.totalMs <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [section.end_at]);

  const isComingSoon = startTimestamp !== null && now < startTimestamp;
  const isEnded = endTimestamp !== null && now >= endTimestamp;
  const hasTimer = Boolean(section.end_at && !isComingSoon);

  const title = section.title;
  const subtitle = section.subtitle && section.subtitle.trim().length > 0 ? section.subtitle.trim() : null;
  const ctaUrl = section.view_all_url?.trim() || null;
  const ctaText = section.view_all_text?.trim() || 'Shop Now';

  // Format start date for coming soon state
  const formattedStartDate = useMemo(() => {
    if (!section.start_at) return null;
    try {
      const d = new Date(section.start_at);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [section.start_at]);

  // --------------------------------------------------------------------------
  // RENDER: Premium Promotional Strip (Rich Deep Maroon & High Contrast Typography)
  // --------------------------------------------------------------------------
  return (
    <div className="py-4 sm:py-6 md:py-8 lg:py-10">
      <section
        aria-label={title || "Promotional Offer"}
        className="relative w-full overflow-hidden bg-gradient-to-r from-[#240308] via-[#3B0711] to-[#240308] text-[#FAF7F0] border-y border-[#B08A3C]/50 shadow-lg"
      >
      {/* 1. Background Image: Subtle Watermark Overlay (Only 15% opacity so Deep Maroon color dominates) */}
      {section.image_url ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={section.image_url}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-15 mix-blend-luminosity"
          />
          {/* Heavy Deep Maroon Gradient Scrim to ensure the background color is 100% prominent */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#240308]/95 via-[#3B0711]/90 to-[#240308]/95" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        /* Subtle Traditional Banarasi Zari Jaali Motif Pattern Fallback */
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4B870' stroke-width='0.75'%3E%3Cpath d='M20 0 L40 20 L20 40 L0 20 Z'/%3E%3Ccircle cx='20' cy='20' r='4'/%3E%3Ccircle cx='0' cy='0' r='2'/%3E%3Ccircle cx='40' cy='0' r='2'/%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3Ccircle cx='0' cy='40' r='2'/%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* 2. Delicate Antique Gold Accent Lines */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4B870]/70 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4B870]/70 to-transparent pointer-events-none" />

      {/* 3. Ambient Gold Warmth Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-28 bg-[#B08A3C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 4. Promotional Strip Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 min-h-[140px] sm:min-h-[120px] md:min-h-[130px] flex items-center">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3.5 sm:gap-4 md:gap-8">
          
          {/* ================= LEFT / TEXT COLUMN ================= */}
          <div className="text-center md:text-left flex-1 min-w-0 max-w-xl space-y-1 sm:space-y-1.5">
            {/* High-Contrast Gold Eyebrow */}
            <div className="inline-flex items-center justify-center md:justify-start gap-1.5 text-[10px] sm:text-[11px] font-sans font-bold text-[#E5C16C] uppercase tracking-[0.25em] drop-shadow-sm">
              <span className="text-xs leading-none">✦</span>
              <span>
                {isComingSoon
                  ? 'COMING SOON'
                  : isEnded
                  ? 'OFFER ENDED'
                  : 'LIMITED TIME OFFER'}
              </span>
            </div>

            {/* Crisp High-Contrast Primary Title */}
            <h2 className="font-serif font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#FFFFFF] tracking-wide leading-tight line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {title}
            </h2>

            {/* High-Contrast Supporting Subtitle */}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#F3ECE0] font-normal leading-snug line-clamp-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {subtitle}
              </p>
            )}
          </div>

          {/* ================= RIGHT / COUNTDOWN & CTA COLUMN ================= */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3 sm:gap-4 md:gap-5 shrink-0 w-full md:w-auto">
            
            {/* COMING SOON STATE */}
            {isComingSoon && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#190206]/80 border border-[#D4B870]/40 text-[#E5C16C] text-xs sm:text-sm font-serif font-medium tracking-wider shadow-sm">
                <Clock size={15} className="shrink-0 text-[#E5C16C]" />
                <span>Special offer starts {formattedStartDate ? `on ${formattedStartDate}` : 'soon'}</span>
              </div>
            )}

            {/* OFFER ENDED STATE */}
            {!isComingSoon && isEnded && hasTimer && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#190206]/80 border border-[#D4B870]/40 text-[#FAF7F0] text-xs sm:text-sm font-serif font-bold tracking-widest uppercase shadow-sm">
                <Clock size={15} className="shrink-0 text-[#E5C16C]" />
                <span>OFFER ENDED</span>
              </div>
            )}

            {/* ACTIVE COUNTDOWN STATE */}
            {!isComingSoon && !isEnded && hasTimer && timeLeft && (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="hidden lg:inline-block text-[10px] sm:text-[11px] uppercase tracking-widest text-[#E5C16C] font-sans font-bold whitespace-nowrap drop-shadow-sm">
                  Offer ends in
                </span>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {[
                    { label: 'DAYS', value: mounted ? timeLeft.days : '00' },
                    { label: 'HRS', value: mounted ? timeLeft.hours : '00' },
                    { label: 'MIN', value: mounted ? timeLeft.minutes : '00' },
                    { label: 'SEC', value: mounted ? timeLeft.seconds : '00' },
                  ].map((unit, idx) => (
                    <div
                      key={idx}
                      className="w-11 h-12 sm:w-12 sm:h-13 md:w-13 md:h-13.5 rounded-lg border border-[#D4B870]/50 bg-[#160205]/95 backdrop-blur-sm flex flex-col items-center justify-center shadow-md px-1"
                    >
                      <span className="font-sans font-extrabold text-base sm:text-lg md:text-xl text-[#FFFFFF] tabular-nums leading-none drop-shadow-xs">
                        {unit.value}
                      </span>
                      <span className="text-[7.5px] sm:text-[8.5px] font-sans font-bold uppercase tracking-wider text-[#E5C16C] mt-0.5 sm:mt-1 leading-none">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HIGH CONTRAST CTA BUTTON */}
            {ctaUrl && (
              <Link
                href={ctaUrl}
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#C59B3F] hover:bg-[#D4B870] text-[#160205] font-serif font-extrabold text-xs sm:text-xs md:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group shrink-0"
              >
                <span>{ctaText}</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            )}

          </div>

        </div>
      </div>
    </section>
  </div>
);
};
