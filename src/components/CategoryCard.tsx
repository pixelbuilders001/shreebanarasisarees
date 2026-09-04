'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Plus } from 'lucide-react';

export const CategoryCard: React.FC = () => {
  const { categories, isCategoriesLoading, products } = useStore();

  // Dynamically derive category cards using ONLY real API data (category image_url or product images)
  const weaves = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => {
        // Find matching API product image if c.image_url is not set in DB
        const matchedProduct = products?.find(
          (p) =>
            p.category.toLowerCase() === c.name.toLowerCase() ||
            p.fabric.toLowerCase().includes(c.name.toLowerCase()) ||
            p.name.toLowerCase().includes(c.name.toLowerCase())
        );

        const imageUrl = c.image_url || matchedProduct?.images?.[0] || '';

        return {
          id: c.id,
          name: c.name,
          image: imageUrl,
          query: c.slug || c.name,
        };
      });
    }

    // Fallback: Group categories dynamically from loaded API products
    if (products && products.length > 0) {
      const uniqueCatNames = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
      return uniqueCatNames.map((catName) => {
        const prod = products.find((p) => p.category === catName);
        return {
          id: catName,
          name: catName,
          image: prod?.images?.[0] || '',
          query: catName,
        };
      });
    }

    return [];
  }, [categories, products]);

  if (isCategoriesLoading) {
    return (
      <section className="py-4 md:py-12 px-4 md:px-6 bg-[#FAF6EE] border-b border-[#B08A3C]/15 animate-pulse">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-[#E5DEC9] rounded-md" />
              <div className="h-7 w-48 bg-[#E5DEC9] rounded-md" />
            </div>
            <div className="h-9 w-32 bg-[#E5DEC9] rounded-xl hidden md:block" />
          </div>

          {/* Circles Skeleton Grid */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 text-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-full bg-[#E5DEC9]" />
                <div className="w-14 h-3 bg-[#E5DEC9] rounded mt-1" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (weaves.length === 0) return null;

  return (
    <>
      {/* ── 1. MOBILE VIEW ── */}
      <section className="py-4 px-4 bg-[#FAF6EE] md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292524] tracking-wide">
            Shop by weave
          </h2>
          <Link
            href="/sarees"
            className="text-xs font-sans font-semibold text-[#B08A3C] hover:text-[#6B1725] flex items-center gap-1 transition-colors"
          >
            <span>All {weaves.length}</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {weaves.slice(0, 7).map((weave) => (
            <Link
              key={weave.id}
              href={`/sarees?category=${encodeURIComponent(weave.query)}`}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-[#D5CBB3] p-0.5 group-hover:border-[#6B1725] transition-colors shadow-2xs bg-white">
                {weave.image ? (
                  <Image
                    src={weave.image}
                    alt={weave.name}
                    fill
                    sizes="80px"
                    className="object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#E5DEC9] animate-pulse" />
                )}
              </div>
              <span className="text-xs font-sans font-medium text-[#292524] group-hover:text-[#6B1725] transition-colors text-center truncate w-full">
                {weave.name}
              </span>
            </Link>
          ))}

          <Link
            href="/sarees"
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-1.5 border-dashed border-[#B08A3C]/70 flex items-center justify-center bg-[#FAF6EE] group-hover:bg-[#6B1725] group-hover:border-[#6B1725] transition-colors">
              <Plus size={18} className="text-[#B08A3C] group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-sans font-medium text-[#B08A3C] group-hover:text-[#6B1725] transition-colors">
              All
            </span>
          </Link>
        </div>
      </section>

      {/* ── 2. DESKTOP VIEW ── */}
      <section className="hidden md:block py-12 px-6 bg-[#FAF6EE] border-b border-[#B08A3C]/15">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                HERITAGE WEAVE CATALOGUE
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-extrabold text-[#292524] tracking-wide">
                Shop by Weave &amp; Material
              </h2>
              <p className="text-sm text-[#6B625D] font-light mt-1">
                Explore handloom sarees curated by master weaver craftsmanship across Banaras, Rajasthan, and Chanderi.
              </p>
            </div>
            <Link
              href="/sarees"
              className="py-2.5 px-5 bg-white border border-[#B08A3C]/30 hover:border-[#6B1725] text-[#6B1725] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#6B1725] hover:text-white flex items-center gap-2 transition-all shadow-2xs group"
            >
              <span>Explore All Weaves</span>
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Desktop Responsive Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-5 lg:gap-7">
            {weaves.slice(0, 7).map((weave) => (
              <Link
                key={weave.id}
                href={`/sarees?category=${encodeURIComponent(weave.query)}`}
                className="flex flex-col items-center gap-3 group text-center cursor-pointer"
              >
                <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 border-[#D4B870] p-1 group-hover:border-[#6B1725] group-hover:scale-108 transition-all duration-500 shadow-md group-hover:shadow-xl bg-white">
                  {weave.image ? (
                    <Image
                      src={weave.image}
                      alt={weave.name}
                      fill
                      sizes="120px"
                      className="object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#E5DEC9] animate-pulse" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-serif font-bold text-[#292524] group-hover:text-[#6B1725] transition-colors leading-tight">
                    {weave.name}
                  </h3>
                  <span className="text-[10px] font-sans font-medium text-[#B08A3C] uppercase tracking-wider block">
                    Authentic
                  </span>
                </div>
              </Link>
            ))}

            {/* "+ Explore All" Desktop Card */}
            <Link
              href="/sarees"
              className="flex flex-col items-center gap-3 group text-center cursor-pointer"
            >
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border-2 border-dashed border-[#B08A3C] flex flex-col items-center justify-center bg-white group-hover:bg-[#6B1725] group-hover:border-[#6B1725] group-hover:scale-108 transition-all duration-500 shadow-md group-hover:shadow-xl">
                <Plus size={24} className="text-[#B08A3C] group-hover:text-white transition-colors" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-serif font-bold text-[#B08A3C] group-hover:text-[#6B1725] transition-colors leading-tight">
                  View All
                </h3>
                <span className="text-[10px] font-sans font-medium text-[#6B625D] uppercase tracking-wider block">
                  All Collections
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
