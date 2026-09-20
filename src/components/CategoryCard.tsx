'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../context/StoreContext';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { DbCategory } from '../data/supabase';

interface CategoryCardProps {
  initialCategories?: DbCategory[];
}

interface WeaveItem {
  id: string;
  name: string;
  image: string;
  query: string;
  count: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ initialCategories }) => {
  const { categories: storeCategories, isCategoriesLoading: storeLoading, products } = useStore();

  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
  const [individualLoadedMap, setIndividualLoadedMap] = useState<Record<string, boolean>>({});

  const categories = (storeCategories && storeCategories.length > 0)
    ? storeCategories
    : (initialCategories && initialCategories.length > 0)
      ? initialCategories
      : [];

  const isCategoriesLoading = storeLoading && categories.length === 0;

  // Dynamically derive category cards using ONLY real API data
  const weaves: WeaveItem[] = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => {
        const matchingProducts = products?.filter(
          (p) =>
            p.category?.toLowerCase() === c.name.toLowerCase() ||
            p.fabric?.toLowerCase().includes(c.name.toLowerCase()) ||
            p.name?.toLowerCase().includes(c.name.toLowerCase())
        ) || [];

        const matchedProduct = matchingProducts[0];
        const imageUrl = c.image_url || matchedProduct?.images?.[0] || '';

        return {
          id: c.id,
          name: c.name,
          image: imageUrl,
          query: c.slug || c.name,
          count: matchingProducts.length,
        };
      });
    }

    // Fallback: Group categories dynamically from loaded API products
    if (products && products.length > 0) {
      const uniqueCatNames = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
      return uniqueCatNames.map((catName) => {
        const matchingProducts = products.filter((p) => p.category === catName);
        const prod = matchingProducts[0];

        return {
          id: catName,
          name: catName,
          image: prod?.images?.[0] || '',
          query: catName,
          count: matchingProducts.length,
        };
      });
    }

    return [];
  }, [categories, products]);

  // Preload category images for zero-flicker presentation
  useEffect(() => {
    if (weaves.length === 0) return;

    const imageUrls = weaves
      .slice(0, 5)
      .map((w) => w.image)
      .filter(Boolean);

    if (imageUrls.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let isMounted = true;
    let loadedCount = 0;
    const total = imageUrls.length;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= total && isMounted) {
        setImagesLoaded(true);
      }
    };

    imageUrls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      if (img.complete) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [weaves]);

  const showSkeleton = isCategoriesLoading || !imagesLoaded || weaves.length === 0;

  // ── SKELETON PLACEHOLDER ──
  if (showSkeleton) {
    return (
      <section className="py-6 md:py-10 px-4 md:px-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
        <div className="max-w-7xl mx-auto">
          {/* Pills Skeleton */}
          <div className="flex gap-2 overflow-hidden mb-4">
            <div className="h-8 w-24 bg-[#EBE4D2] rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-28 bg-[#EBE4D2] rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-24 bg-[#EBE4D2] rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-32 bg-[#EBE4D2] rounded-full animate-pulse shrink-0" />
          </div>

          {/* Unified Bento Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            <div className="col-span-2 md:col-span-2 md:row-span-2 min-h-[260px] sm:min-h-[320px] md:min-h-[480px] rounded-2xl bg-[#EBE4D2] animate-pulse" />
            <div className="col-span-1 min-h-[190px] sm:min-h-[220px] md:min-h-[230px] rounded-2xl bg-[#EBE4D2] animate-pulse" />
            <div className="col-span-1 min-h-[190px] sm:min-h-[220px] md:min-h-[230px] rounded-2xl bg-[#EBE4D2] animate-pulse" />
            <div className="col-span-1 min-h-[190px] sm:min-h-[220px] md:min-h-[230px] rounded-2xl bg-[#EBE4D2] animate-pulse" />
            <div className="col-span-1 min-h-[190px] sm:min-h-[220px] md:min-h-[230px] rounded-2xl bg-[#EBE4D2] animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  const heroWeave = weaves[0];
  const secondaryWeaves = weaves.slice(1, 4);

  return (
    <section className="py-6 sm:py-10 px-4 md:px-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ── QUICK FILTER PILLS ── */}
        {weaves.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {weaves.map((w) => (
              <Link
                key={w.id}
                href={`/sarees/${encodeURIComponent(w.query.toLowerCase().trim().replace(/\s+/g, '-'))}`}
                className="shrink-0 text-xs font-sans font-medium px-3.5 py-1.5 rounded-full border border-[#D5CBB3] bg-[#FAF6EE]/90 text-[#292524] hover:bg-[#6B1725] hover:text-white hover:border-[#6B1725] transition-all shadow-2xs"
              >
                {w.name}
                {w.count > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">({w.count})</span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* ── UNIFIED BENTO GRID (Same look & feel on Mobile & Desktop) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {/* TILE 1: Hero Card (Spans 2 cols on mobile, 2 cols & 2 rows on desktop) */}
          {heroWeave && (
            <Link
              href={`/sarees/${encodeURIComponent(heroWeave.query.toLowerCase().trim().replace(/\s+/g, '-'))}`}
              className="group relative col-span-2 md:col-span-2 md:row-span-2 min-h-[260px] sm:min-h-[320px] md:min-h-[480px] rounded-2xl overflow-hidden border border-[#B08A3C]/30 hover:border-[#B08A3C] shadow-md hover:shadow-2xl transition-all duration-500 bg-[#1F1917] flex flex-col justify-between p-5 sm:p-6 lg:p-7"
            >
              {heroWeave.image && (
                <Image
                  src={heroWeave.image}
                  alt={heroWeave.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 640px"
                  priority
                  onLoad={() => setIndividualLoadedMap((prev) => ({ ...prev, [heroWeave.id]: true }))}
                  className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                    individualLoadedMap[heroWeave.id] ? 'opacity-90' : 'opacity-0'
                  }`}
                />
              )}

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412] via-[#1A1412]/40 to-transparent pointer-events-none" />

              {/* Top Row */}
              <div className="relative z-10 flex items-center justify-end">
                {heroWeave.count > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-[#FAF7F0] bg-[#6B1725]/90 backdrop-blur-sm px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#D4B870]/30 shadow-xs">
                    {heroWeave.count} Sarees
                  </span>
                )}
              </div>

              {/* Bottom Row */}
              <div className="relative z-10 space-y-1.5 sm:space-y-2">
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FAF7F0] group-hover:text-[#D4B870] transition-colors leading-tight">
                  {heroWeave.name}
                </h3>

                <div className="pt-1 flex items-center gap-1.5 text-xs font-serif font-bold text-[#D4B870] uppercase tracking-wider group-hover:text-white transition-colors">
                  <span>Shop Now</span>
                  <ArrowRight size={14} className="transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* TILES 2, 3, 4: Secondary Weaves (1 col each) */}
          {secondaryWeaves.map((weave) => (
            <Link
              key={weave.id}
              href={`/sarees/${encodeURIComponent(weave.query.toLowerCase().trim().replace(/\s+/g, '-'))}`}
              className="group relative col-span-1 min-h-[190px] sm:min-h-[220px] md:min-h-[230px] rounded-2xl overflow-hidden border border-[#B08A3C]/25 hover:border-[#B08A3C]/70 shadow-sm hover:shadow-xl transition-all duration-500 bg-[#1F1917] flex flex-col justify-between p-3.5 sm:p-4 lg:p-5"
            >
              {weave.image && (
                <Image
                  src={weave.image}
                  alt={weave.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 320px"
                  onLoad={() => setIndividualLoadedMap((prev) => ({ ...prev, [weave.id]: true }))}
                  className={`object-cover transition-transform duration-700 ease-out group-hover:scale-108 ${
                    individualLoadedMap[weave.id] ? 'opacity-85' : 'opacity-0'
                  }`}
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412]/95 via-[#1A1412]/40 to-transparent pointer-events-none" />

              {/* Top Row */}
              <div className="relative z-10 flex items-center justify-end">
                {weave.count > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-sans font-medium text-[#FAF7F0]/90 bg-[#292524]/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-[#D4B870]/25">
                    {weave.count} Sarees
                  </span>
                )}
              </div>

              {/* Bottom Row */}
              <div className="relative z-10">
                <h3 className="font-serif text-base sm:text-lg lg:text-xl font-bold text-[#FAF7F0] group-hover:text-[#D4B870] transition-colors leading-tight">
                  {weave.name}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-serif font-bold text-[#D4B870] uppercase tracking-wider group-hover:text-white transition-colors">
                  <span>Shop</span>
                  <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}

          {/* TILE 5: View All Card (1 col) */}
          <Link
            href="/sarees"
            className="group relative col-span-1 min-h-[190px] sm:min-h-[220px] md:min-h-[230px] rounded-2xl overflow-hidden border border-[#D4B870]/40 hover:border-[#D4B870] shadow-sm hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-[#6B1725] via-[#50101B] to-[#3B0A13] flex flex-col justify-center items-center p-4 sm:p-5 text-center"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#D4B870]/50 flex items-center justify-center bg-[#6B1725] shadow-xs mb-2.5 sm:mb-3 group-hover:scale-110 transition-transform">
              <LayoutGrid size={18} className="text-[#D4B870]" />
            </div>

            <h3 className="font-serif text-base sm:text-xl font-extrabold text-[#FAF7F0] leading-snug">
              All Categories
            </h3>

            <div className="mt-2.5 sm:mt-4">
              <span className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl bg-[#FAF7F0] text-[#6B1725] group-hover:bg-[#D4B870] group-hover:text-[#292524] font-serif font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all shadow-sm">
                <span>View All</span>
                <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
