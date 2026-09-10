"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { HomepageSection } from '../../types/homepage-sections';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholder';

interface CategoryCardsSectionProps {
  section: HomepageSection;
}

export const CategoryCardsSection: React.FC<CategoryCardsSectionProps> = ({ section }) => {
  const products = section.products || [];

  // Group or derive distinct cards from products (by category or occasion)
  const cards = React.useMemo(() => {
    const cardMap = new Map<string, { title: string; image: string; link: string; count: number }>();

    for (const prod of products) {
      const key = prod.category || prod.occasion || 'Sarees';
      if (!cardMap.has(key)) {
        cardMap.set(key, {
          title: key,
          image: prod.images?.[0] || '/fabrics/banarasi_silk.png',
          link: `/sarees?category=${encodeURIComponent(key)}`,
          count: 1,
        });
      } else {
        const existing = cardMap.get(key)!;
        existing.count += 1;
      }
    }

    return Array.from(cardMap.values()).slice(0, 8);
  }, [products]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 px-4 md:px-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          eyebrow="EXPLORE CATEGORIES"
          viewAllText={section.view_all_text}
          viewAllUrl={section.view_all_url}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
          {cards.map((card, idx) => (
            <Link
              key={idx}
              href={card.link}
              className="group relative bg-[#292524] rounded-2xl overflow-hidden aspect-[4/5] border border-[#B08A3C]/20 hover:border-[#B08A3C]/60 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-end p-4 sm:p-6"
            >
              <Image
                src={card.image || NO_IMAGE_PLACEHOLDER}
                alt={card.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#292524]/90 via-[#292524]/30 to-transparent" />

              <span className="absolute top-3 right-3 bg-[#B08A3C] text-[#292524] text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-serif shadow-xs z-10">
                {card.count} Designs
              </span>

              <div className="relative z-10">
                <h3 className="font-serif text-lg sm:text-2xl font-bold text-[#FAF7F0] group-hover:text-[#D4B870] transition-colors leading-tight">
                  {card.title}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-serif font-bold text-[#D4B870] uppercase tracking-wider">
                  <span>Explore</span>
                  <ArrowRight size={14} className="transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
