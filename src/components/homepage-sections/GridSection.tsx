"use client";

import React from 'react';
import { ProductCard } from '../ProductCard';
import { SectionHeader } from './SectionHeader';
import { HomepageSection } from '../../types/homepage-sections';

interface GridSectionProps {
  section: HomepageSection;
}

export const GridSection: React.FC<GridSectionProps> = ({ section }) => {
  const products = section.products || [];

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-16 px-4 md:px-8 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          eyebrow={section.collection?.name ? 'FEATURED' : undefined}
          viewAllText={section.view_all_text}
          viewAllUrl={section.view_all_url}
        />

        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-3 sm:pb-0 scroll-smooth snap-x snap-mandatory sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {products.map((prod) => (
            <div key={prod.id} className="w-[165px] sm:w-auto shrink-0 sm:shrink snap-start sm:snap-align-none">
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
