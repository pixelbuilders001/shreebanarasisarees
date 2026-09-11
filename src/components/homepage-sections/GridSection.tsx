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
    <section className="py-12 sm:py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-[#FAF7F0] via-[#FCF9F4] to-[#F7EFE3] border-b border-[#B08A3C]/20 relative overflow-hidden">
      {/* Luxury ambient glow accents matching royal Banarasi heritage aesthetic */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#B08A3C]/[0.08] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#6B1725]/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          eyebrow={section.collection?.name ? 'FEATURED' : undefined}
          viewAllText={section.view_all_text}
          viewAllUrl={section.view_all_url}
        />

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </section>
  );
};
