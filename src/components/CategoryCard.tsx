'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../context/StoreContext';

interface CategoryItem {
  name: string;
  image: string;
  link: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    name: "Banarasi Sarees",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/banarasi"
  },
  {
    name: "Chikankari Sarees",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/chikankari"
  },
  {
    name: "Bandhani Sarees",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/bandhani"
  },
  {
    name: "Organza Sarees",
    image: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/organza"
  },
  {
    name: "Chanderi Silk",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/chanderi"
  },
  {
    name: "Georgette Sarees",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/georgette"
  },
  {
    name: "Silk Sarees",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/silk"
  },
  {
    name: "Bridal Wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
    link: "/sarees/bridal"
  }
];

export const CategoryCard: React.FC = () => {
  const { categories } = useStore();

  const displayCategories = categories && categories.length > 0
    ? categories.map(c => ({
      name: c.name,
      image: c.image_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
      link: `/sarees/${c.slug.toLowerCase()}`
    }))
    : CATEGORIES;

  return (
    <section className="pt-10 pb-16 border-b border-cream">
      {/* Section Header */}
      <div className="text-center mb-8 md:mb-10 px-4">
        <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
          Shop by Category
        </h2>
        <div className="w-16 h-0.5 bg-maroon mx-auto mt-3 mb-3" />
        <p className="text-sm text-dark-brown/60 font-light">
          Explore our beautiful collections
        </p>
      </div>

      {/*
        ── Layout strategy ──────────────────────────────────────────────────
        Mobile  : horizontal snap-scroll carousel, cards ~160px wide, full-bleed
        Desktop : max-w-7xl container, 4-column grid, each card ~aspect-[3/4]
        ─────────────────────────────────────────────────────────────────── */}

      {/* Mobile carousel (hidden md+) */}
      <div className="md:hidden flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4">
        {displayCategories.map((category, idx) => (
          <CategoryTile key={idx} category={category} className="w-[160px] flex-shrink-0 snap-start" />
        ))}
        {/* Trailing spacer so the last card has breathing room */}
        <div className="w-4 flex-shrink-0" aria-hidden="true" />
      </div>

      {/* Desktop grid (hidden below md) */}
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-4">
        {displayCategories.slice(0, 8).map((category, idx) => (
          <CategoryTile key={idx} category={category} className="" />
        ))}
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   CategoryTile — shared card used by both mobile carousel and desktop grid
   ────────────────────────────────────────────────────────────────────────── */

interface CategoryTileProps {
  category: CategoryItem;
  className?: string;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ category, className = '' }) => (
  <Link
    href={category.link}
    className={`group relative block rounded-2xl overflow-hidden aspect-[3/4] bg-dark-brown
      shadow-md hover:shadow-[0_12px_32px_rgba(45,33,29,0.22)]
      transition-shadow duration-400 ${className}`}
  >
    {/* Background image with zoom on hover */}
    <Image
      src={category.image}
      alt={category.name}
      fill
      sizes="(max-width: 768px) 160px, 300px"
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
    />

    {/* Static gradient scrim — always visible for legibility */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#2D211D]/80 via-[#2D211D]/15 to-transparent" />

    {/* Hover shimmer overlay */}
    <div className="absolute inset-0 bg-maroon/20 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

    {/* Top-right gold dot accent */}
    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-gold opacity-70 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

    {/* Bottom text layer */}
    <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-8">
      {/* Category name */}
      <p className="font-serif font-bold text-ivory text-sm sm:text-base leading-tight tracking-wide line-clamp-1">
        {category.name}
      </p>

      {/* Explore CTA — slides up on hover */}
      <div className="flex items-center gap-1 mt-1.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
        <span className="text-gold text-[11px] font-bold font-serif uppercase tracking-widest">
          Explore
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 text-gold group-hover:translate-x-0.5 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>

    {/* Thin gold border on hover */}
    <div className="absolute inset-0 rounded-2xl border border-gold/0 group-hover:border-gold/30 transition-all duration-400 pointer-events-none" />
  </Link>
);
