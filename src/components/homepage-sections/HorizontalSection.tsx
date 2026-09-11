"use client";

import React, { useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SectionHeader } from './SectionHeader';
import { HomepageSection } from '../../types/homepage-sections';

interface HorizontalSectionProps {
  section: HomepageSection;
}

export const HorizontalSection: React.FC<HorizontalSectionProps> = ({ section }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const products = section.products || [];

  if (products.length === 0) {
    return null;
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
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
        />

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar pb-3 sm:pb-4 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              className="w-[165px] sm:w-[280px] lg:w-[300px] shrink-0 snap-start relative"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
