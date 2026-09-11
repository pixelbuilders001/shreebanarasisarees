"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ProductCard } from '../ProductCard';
import { SectionHeader } from './SectionHeader';
import { HomepageSection } from '../../types/homepage-sections';

interface CarouselSectionProps {
  section: HomepageSection;
}

export const CarouselSection: React.FC<CarouselSectionProps> = ({ section }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const products = section.products || [];

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Account for slight sub-pixel rounding
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollPosition();
    const el = scrollRef.current;
    if (!el) return;

    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [checkScrollPosition, products.length]);

  if (products.length === 0) {
    return null;
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      // Smoothly move by approximately 1 to 2 cards
      const scrollAmount = Math.max(scrollRef.current.clientWidth * 0.75, 280);
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = Math.max(scrollRef.current.clientWidth * 0.75, 280);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-[#FAF4E8] via-[#F5EAD4] to-[#EFE0C5] border-b border-[#B08A3C]/20 relative overflow-hidden">
      {/* Luxury ambient glow accents matching royal Banarasi heritage aesthetic */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#B08A3C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#6B1725]/[0.06] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          eyebrow={section.collection?.name ? 'CURATED COLLECTION' : undefined}
          viewAllText={section.view_all_text}
          viewAllUrl={section.view_all_url}
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
          showScrollArrows={products.length > 3}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
        />

        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-3.5 sm:gap-4 lg:gap-6 overflow-x-auto no-scrollbar pb-3 sm:pb-4 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              className="w-[58%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-18px)] shrink-0 snap-start relative flex flex-col"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
