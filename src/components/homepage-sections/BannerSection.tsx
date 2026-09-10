"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductCard } from '../ProductCard';
import { HomepageSection } from '../../types/homepage-sections';

interface BannerSectionProps {
  section: HomepageSection;
}

export const BannerSection: React.FC<BannerSectionProps> = ({ section }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const products = section.products || [];
  const subtitle = section.subtitle || section.collection?.description;
  const viewUrl = section.view_all_url || (section.collection?.slug ? `/collections/${section.collection.slug}` : undefined);
  const viewText = section.view_all_text || 'Explore Collection';

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6 sm:py-10 px-4 md:px-8 bg-gradient-to-b from-[#FAF7F0] via-[#F4EFE6] to-[#FAF7F0] border-b border-[#B08A3C]/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Banner Showcase Image Strip with Title & Content Inside on Left */}
        {section.image_url ? (
          <div className="mb-3 sm:mb-4">
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#B08A3C]/25 hover:border-[#B08A3C]/60 shadow-md hover:shadow-xl transition-all duration-300 min-h-[140px] sm:min-h-[180px] md:min-h-[210px] flex items-center">
              {/* Background Banner Image */}
              <img
                src={section.image_url}
                alt={section.title || "Banner Showcase"}
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />

              {/* Scrim Gradient Overlay on Left Side for Text Contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1c1917]/90 via-[#1c1917]/65 to-transparent w-full sm:w-4/5 md:w-3/5" />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />

              {/* Text & Content Positioned on Left Side Inside Banner */}
              <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-lg space-y-1.5 sm:space-y-2 text-[#FAF7F0]">
                <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-extrabold tracking-wide leading-tight text-white drop-shadow-sm">
                  {section.title}
                </h2>

                {subtitle && subtitle.trim().length > 0 && (
                  <p className="text-[11px] sm:text-xs md:text-sm text-[#FAF7F0]/90 font-light leading-snug line-clamp-2 max-w-md drop-shadow-xs">
                    {subtitle}
                  </p>
                )}

                {viewUrl && (
                  <div className="pt-1 sm:pt-2">
                    <Link
                      href={viewUrl}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3.5 sm:py-2 sm:px-5 bg-[#B08A3C] hover:bg-[#D4B870] text-[#292524] rounded-lg font-serif font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span>{viewText}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Sleek & Thin Luxury Gradient Banner Strip Fallback */
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-[#52111C] via-[#6B1725] to-[#52111C] text-[#FAF7F0] py-3.5 px-5 sm:py-4 sm:px-8 border border-[#B08A3C]/35 shadow-md mb-3 sm:mb-4">
            {/* Subtle Background Glow Elements */}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#B08A3C]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/25 rounded-full blur-xl pointer-events-none" />

            {section.collection?.banner_url && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url(${section.collection.banner_url})` }}
              />
            )}

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
              <div className="max-w-2xl space-y-1">
                <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-extrabold tracking-wide leading-tight">
                  {section.title}
                </h2>

                {subtitle && subtitle.trim().length > 0 && (
                  <p className="text-[11px] sm:text-xs md:text-sm text-[#FAF7F0]/85 font-light leading-snug line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>

              {viewUrl && (
                <div className="shrink-0 pt-1 sm:pt-0">
                  <Link
                    href={viewUrl}
                    className="inline-flex items-center gap-1.5 py-2 px-4 sm:py-2.5 sm:px-6 bg-[#B08A3C] hover:bg-[#D4B870] text-[#292524] rounded-lg font-serif font-bold text-[11px] sm:text-xs tracking-wider uppercase transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{viewText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Showcase Products (Carousel tightly paired with banner) */}
        {products.length > 0 && (
          <div className="relative group/carousel">
            {products.length > 3 && (
              <>
                <button
                  type="button"
                  onClick={scrollLeft}
                  className="hidden sm:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full border border-[#B08A3C]/35 bg-white/95 hover:bg-[#6B1725] hover:text-white text-[#292524] transition-all shadow-md active:scale-95 cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={scrollRight}
                  className="hidden sm:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full border border-[#B08A3C]/35 bg-white/95 hover:bg-[#6B1725] hover:text-white text-[#292524] transition-all shadow-md active:scale-95 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ArrowRight size={16} />
                </button>
              </>
            )}

            <div
              ref={scrollRef}
              className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar pb-2 scroll-smooth snap-x snap-mandatory"
            >
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="w-[165px] sm:w-[270px] lg:w-[290px] shrink-0 snap-start relative"
                >
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
