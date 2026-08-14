import React from 'react';
import Link from 'next/link';

import { useStore } from '../context/StoreContext';

interface CategoryItem {
  name: string;
  image: string;
  link: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    name: "Banarasi Sarees",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/banarasi"
  },
  {
    name: "Chikankari Sarees",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/chikankari"
  },
  {
    name: "Bandhani Sarees",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/bandhani"
  },
  {
    name: "Organza Sarees",
    image: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/organza"
  },
  {
    name: "Chanderi Silk",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/chanderi"
  },
  {
    name: "Georgette Sarees",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/georgette"
  },
  {
    name: "Silk Sarees",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/silk"
  },
  {
    name: "Bridal Wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400&h=500",
    link: "/sarees/bridal"
  }
];

export const CategoryCard: React.FC = () => {
  const { categories } = useStore();

  const displayCategories = categories && categories.length > 0
    ? categories.map(c => ({
      name: c.name,
      image: c.image_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400&h=500",
      link: `/sarees/${c.slug.toLowerCase()}`
    }))
    : CATEGORIES;

  return (
    <section className="pt-4 pb-2 md:pt-6 md:pb-8 px-4 max-w-7xl mx-auto">
      {/* Header Container */}
      <div className="text-center mb-6 md:mb-10">
        <div className="flex items-center justify-center gap-3 mb-1.5">
          <div className="w-8 h-px bg-gold/50"></div>
          <span className="text-[10px] sm:text-xs text-gold uppercase tracking-[0.2em] font-bold block">
            Trending on Shree
          </span>
          <div className="w-8 h-px bg-gold/50"></div>
        </div>
        <h2 className="font-serif text-xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
          Shop By Category
        </h2>
        <div className="w-12 md:w-16 h-0.5 bg-maroon mx-auto my-2 md:my-3"></div>
        <p className="text-xs sm:text-sm text-dark-brown/65 max-w-lg mx-auto leading-relaxed hidden sm:block">
          Choose from our wide range of traditional and modern handwoven sarees.
        </p>
      </div>

      {/* Categories container - Scrollable on mobile/tablet, Grid on desktop */}
      <div className="flex overflow-x-auto no-scrollbar gap-x-4 pb-4 px-4 -mx-4 md:mx-0 md:px-0 md:grid md:grid-cols-8 md:gap-x-3 md:gap-y-6 sm:gap-6 md:gap-4 md:overflow-x-visible snap-x snap-mandatory">
        {displayCategories.map((category, idx) => (
          <Link
            key={idx}
            href={category.link}
            className="group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 flex-shrink-0 w-28 min-[375px]:w-32 sm:w-36 md:w-full snap-start"
          >
            {/* Image Container with Luxury Double Gold Frame */}
            <div className="relative w-full aspect-[4/5] rounded-xl p-[2px] bg-gradient-to-b from-gold/45 via-gold-light/10 to-gold/35 group-hover:from-maroon/65 group-hover:via-maroon-light/20 group-hover:to-maroon/55 transition-all duration-500 shadow-[0_4px_12px_rgba(45,33,29,0.04)] group-hover:shadow-[0_8px_20px_rgba(212,175,55,0.18)] flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-[10px] p-[2px] bg-[#FFF9F0] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-lg overflow-hidden relative border border-gold/10">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Subtle rich overlay on hover */}
                  <div className="absolute inset-0 bg-maroon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Luxury Inner Accent Border */}
                  <div className="absolute inset-1.5 border border-gold/15 pointer-events-none rounded-[6px] transition-all duration-500 group-hover:border-maroon/20" />
                </div>
              </div>
            </div>

            {/* Category Name */}
            <span className="mt-3 font-serif text-[10px] min-[375px]:text-xs md:text-sm font-bold text-dark-brown group-hover:text-maroon transition-colors duration-300 tracking-wider uppercase line-clamp-1 leading-snug">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

