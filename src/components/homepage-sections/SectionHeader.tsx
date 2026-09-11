"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | null;
  eyebrow?: string;
  viewAllText?: string | null;
  viewAllUrl?: string | null;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  showScrollArrows?: boolean;
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  viewAllText,
  viewAllUrl,
  onScrollLeft,
  onScrollRight,
  showScrollArrows = false,
  canScrollLeft = true,
  canScrollRight = true,
  className = "mb-6 sm:mb-10",
}) => {
  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  const hasViewAll = viewAllUrl && viewAllUrl.trim().length > 0;
  const viewText = viewAllText && viewAllText.trim().length > 0 ? viewAllText : 'View All';

  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && (
          <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-0.5 sm:mb-1">
            {eyebrow}
          </span>
        )}
        <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
          {title}
        </h2>
        {hasSubtitle && (
          <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1 hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {hasViewAll && (
          <Link
            href={viewAllUrl}
            className="text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] flex items-center gap-1 group transition-colors mr-1 sm:mr-2 py-1"
          >
            <span className="hidden sm:inline">{viewText}</span>
            <span className="sm:hidden">{viewText.length > 12 ? 'View All' : viewText}</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {showScrollArrows && onScrollLeft && onScrollRight && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={onScrollLeft}
              disabled={!canScrollLeft}
              className={`p-3 rounded-full border border-[#B08A3C]/30 bg-white text-[#292524] transition-all shadow-sm active:scale-95 ${
                !canScrollLeft
                  ? 'opacity-30 cursor-not-allowed pointer-events-none'
                  : 'hover:bg-[#6B1725] hover:text-white cursor-pointer'
              }`}
              aria-label="Scroll left"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              onClick={onScrollRight}
              disabled={!canScrollRight}
              className={`p-3 rounded-full border border-[#B08A3C]/30 bg-white text-[#292524] transition-all shadow-sm active:scale-95 ${
                !canScrollRight
                  ? 'opacity-30 cursor-not-allowed pointer-events-none'
                  : 'hover:bg-[#6B1725] hover:text-white cursor-pointer'
              }`}
              aria-label="Scroll right"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
