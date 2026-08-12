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

const HARDCODED_IMAGES: Record<string, string> = {
  banarasi: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
  chikankari: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
  bandhani: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
  organza: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=600",
  chanderi: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600",
  georgette: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
  silk: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600",
  bridal: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
};

export const CategoryCard: React.FC = () => {
  const { categories } = useStore();

  const displayCategories = categories && categories.length > 0
    ? categories.map(c => ({
        name: c.name,
        image: HARDCODED_IMAGES[c.slug.toLowerCase()] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
        link: `/sarees/${c.slug.toLowerCase()}`
      }))
    : CATEGORIES;

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-8 h-px bg-gold/50"></div>
          <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
            Trending on Shree
          </span>
          <div className="w-8 h-px bg-gold/50"></div>
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-wide text-dark-brown">
          Shop By Category
        </h2>
        <div className="w-16 h-0.5 bg-maroon mx-auto my-4"></div>
        <p className="text-sm text-dark-brown/65 max-w-lg mx-auto leading-relaxed">
          Choose from our wide range of traditional and modern handwoven sarees.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {displayCategories.map((category, idx) => (
          <Link
            key={idx}
            href={category.link}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-cream shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-end p-4 sm:p-5 bg-dark-brown"
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-brown via-dark-brown/30 to-transparent z-10 opacity-70 group-hover:opacity-80 transition-opacity duration-300" />
            <img
              src={category.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />

            {/* Content Overlays */}
            <div className="relative z-20 text-white space-y-1">
              <h3 className="font-serif text-sm sm:text-base font-extrabold tracking-wide drop-shadow">
                {category.name}
              </h3>
              <span className="text-[10px] sm:text-xs font-sans font-bold text-gold-light flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-all">
                Browse Collection
                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

          </Link>
        ))}
      </div>
    </section>
  );
};
