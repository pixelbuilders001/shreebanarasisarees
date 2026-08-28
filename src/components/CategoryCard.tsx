'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../context/StoreContext';
import { ArrowRight } from 'lucide-react';

interface CategoryItem {
  name: string;
  subtitle: string;
  image: string;
  link: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    name: "Banarasi Silk",
    subtitle: "Pure Katan & Zari Jaals",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees?category=Banarasi+Sarees"
  },
  {
    name: "Chikankari",
    subtitle: "Lucknowi Hand Embroidery",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees?category=Chikankari+Sarees"
  },
  {
    name: "Bandhani",
    subtitle: "Kutch Tie & Dye Crafts",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees?category=Bandhani+Sarees"
  },
  {
    name: "Organza",
    subtitle: "Ethereal Glass Weaves",
    image: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees?category=Organza+Sarees"
  },
  {
    name: "Chanderi",
    subtitle: "Lightweight Cotton Silk",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees?category=Chanderi+Sarees"
  },
  {
    name: "Bridal Wear",
    subtitle: "Grand Wedding Trousseau",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees?category=Bridal+Collection"
  }
];

export const CategoryCard: React.FC = () => {
  const { categories } = useStore();

  const displayCategories = categories && categories.length > 0
    ? categories.map(c => ({
        name: c.name,
        subtitle: "Handcrafted Heritage",
        image: c.image_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
        link: `/sarees?category=${encodeURIComponent(c.name)}`
      }))
    : DEFAULT_CATEGORIES;

  return (
    <section className="pt-10 pb-6 sm:pt-14 sm:pb-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
              CURATED COLLECTIONS
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/sarees"
            className="mt-2 sm:mt-0 text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] flex items-center gap-1 group transition-colors"
          >
            <span>Explore All Categories</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile Horizontal Carousel */}
        <div className="md:hidden flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
          {displayCategories.map((category, idx) => (
            <CategoryTile key={idx} category={category} className="w-[170px] flex-shrink-0 snap-start" />
          ))}
        </div>

        {/* Desktop 6-Column Grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {displayCategories.slice(0, 6).map((category, idx) => (
            <CategoryTile key={idx} category={category} className="w-full" />
          ))}
        </div>
      </div>
    </section>
  );
};

interface CategoryTileProps {
  category: CategoryItem;
  className?: string;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ category, className = '' }) => (
  <Link
    href={category.link}
    className={`group relative block rounded-2xl overflow-hidden aspect-[3/4] bg-[#292524]
      border border-[#B08A3C]/20 hover:border-[#B08A3C]/60
      shadow-sm hover:shadow-[0_12px_28px_rgba(107,23,37,0.15)]
      transition-all duration-500 hover:-translate-y-1 ${className}`}
  >
    {/* Category Image */}
    <Image
      src={category.image}
      alt={category.name}
      fill
      sizes="(max-width: 768px) 170px, 240px"
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
    />

    {/* Gradient Scrim for Legibility */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#292524]/90 via-[#292524]/20 to-transparent" />

    {/* Subtle Wine Hover Highlight */}
    <div className="absolute inset-0 bg-[#6B1725]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

    {/* Text Layer */}
    <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 text-center sm:text-left">
      <h3 className="font-serif font-bold text-[#FAF7F0] text-base sm:text-lg leading-tight tracking-wide group-hover:text-[#D4B870] transition-colors">
        {category.name}
      </h3>
      <p className="text-[10px] sm:text-xs text-[#FAF7F0]/75 font-light mt-0.5 line-clamp-1">
        {category.subtitle}
      </p>

      {/* Explore indicator */}
      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#B08A3C] uppercase tracking-wider opacity-90 group-hover:translate-x-0.5 transition-transform">
        <span>Shop Now</span>
        <ArrowRight size={10} />
      </div>
    </div>
  </Link>
);
