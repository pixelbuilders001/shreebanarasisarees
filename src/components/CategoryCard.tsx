import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useStore } from '../context/StoreContext';

interface CategoryItem {
  name: string;
  image: string;
  link: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    name: "Banarasi Sarees",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/banarasi"
  },
  {
    name: "Chikankari Sarees",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/chikankari"
  },
  {
    name: "Bandhani Sarees",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/bandhani"
  },
  {
    name: "Organza Sarees",
    image: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/organza"
  },
  {
    name: "Chanderi Silk",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/chanderi"
  },
  {
    name: "Georgette Sarees",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/georgette"
  },
  {
    name: "Silk Sarees",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/silk"
  },
  {
    name: "Bridal Wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    link: "/sarees/bridal"
  }
];

export const CategoryCard: React.FC = () => {
  const { categories } = useStore();

  const displayCategories = categories && categories.length > 0
    ? categories.map(c => ({
        name: c.name,
        image: c.image_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
        link: `/sarees/${c.slug.toLowerCase()}`
      }))
    : CATEGORIES;

  return (
    <section className="pt-4 pb-8 md:py-12 px-4 max-w-7xl mx-auto">
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

      {/* Categories Grid (4 columns on mobile/tablet, 8 columns on desktop) */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-x-2 gap-y-5 sm:gap-6 md:gap-4">
        {displayCategories.map((category, idx) => (
          <Link
            key={idx}
            href={category.link}
            className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1 w-full"
          >
            {/* Image Container with Luxury Double Ring */}
            <div className="relative w-14 h-14 min-[375px]:w-16 min-[375px]:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full p-[3px] border border-gold/30 group-hover:border-maroon/80 transition-all duration-300 bg-white/50 shadow-sm group-hover:shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden relative border border-cream/50">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  loading="lazy"
                />
                {/* Subtle rich overlay on hover */}
                <div className="absolute inset-0 bg-maroon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Category Name */}
            <span className="mt-2 font-serif text-[10px] min-[375px]:text-xs md:text-sm font-bold text-dark-brown group-hover:text-maroon transition-colors duration-300 tracking-wide line-clamp-2 max-w-[70px] min-[375px]:max-w-[85px] md:max-w-none leading-tight">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

