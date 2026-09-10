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
    <section className="py-12 sm:py-16 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#B08A3C]/15">
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
    </section>
  );
};
