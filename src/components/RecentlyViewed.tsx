"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Product } from '../data/products';
import { fetchProductsByIds } from '../data/supabase';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface RecentlyViewedProps {
  /** The IDs to display — most recently viewed first. Caller supplies these from useRecentlyViewed. */
  viewedIds: string[];
  /** Optional: exclude this product ID (e.g. the currently viewed product). */
  excludeId?: string;
}

export function RecentlyViewed({ viewedIds, excludeId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  // Track whether we've completed at least one fetch for the current effectiveIds
  const hasFetchedRef = React.useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute the effective list of IDs to show
  const effectiveIds = excludeId
    ? viewedIds.filter((id) => id !== excludeId)
    : viewedIds;

  const effectiveKey = effectiveIds.join(',');

  useEffect(() => {
    if (effectiveIds.length === 0) {
      setProducts([]);
      setLoading(false);
      hasFetchedRef.current = false;
      return;
    }

    let cancelled = false;
    hasFetchedRef.current = false;
    setLoading(true);

    fetchProductsByIds(effectiveIds).then((results) => {
      if (!cancelled) {
        setProducts(results);
        setLoading(false);
        hasFetchedRef.current = true;
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKey, excludeId]);

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 260;
    scrollRef.current.scrollBy({
      left: dir === 'right' ? cardWidth : -cardWidth,
      behavior: 'smooth',
    });
  };

  // No IDs → nothing to show
  if (effectiveIds.length === 0) return null;
  // Fetched and found nothing (all products deleted/inactive)
  if (hasFetchedRef.current && products.length === 0) return null;

  return (
    <section
      className="py-6 sm:py-8 pb-32 md:pb-12 px-4 border-b border-cream bg-gradient-to-b from-[#FFF9F0] to-white"
      aria-labelledby="recently-viewed-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold font-serif mb-1 flex items-center gap-1.5">
              <Clock size={11} className="opacity-70" />
              Your History
            </p>
            <h2
              id="recently-viewed-heading"
              className="font-serif text-xl sm:text-2xl font-extrabold text-dark-brown tracking-wide"
            >
              Recently Viewed
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sarees"
              className="text-xs font-bold font-serif text-maroon hover:underline underline-offset-2 transition-colors whitespace-nowrap mr-1 flex items-center gap-1"
            >
              <span>View All</span>
              <span className="sm:inline"> →</span>
            </Link>
            {/* Scroll arrows — visible on all sizes for carousel UX */}
            <button
              onClick={() => scrollCarousel('left')}
              aria-label="Scroll recently viewed left"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gold/30 bg-[#FFF9F0] text-dark-brown hover:border-maroon hover:text-maroon transition-all md:hidden"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              aria-label="Scroll recently viewed right"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gold/30 bg-[#FFF9F0] text-dark-brown hover:border-maroon hover:text-maroon transition-all md:hidden"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <span className="text-gold/50 text-xs">✦</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {loading ? (
          /* Skeleton loaders */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-gold/10 bg-[#FFF9F0]/40 animate-pulse"
              >
                <div className="aspect-[3/4] bg-cream/50" />
                <div className="p-2 space-y-2">
                  <div className="h-2 bg-cream/70 rounded w-2/3" />
                  <div className="h-3 bg-cream/70 rounded w-full" />
                  <div className="h-3 bg-cream/70 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: horizontal swipe carousel */}
            <div className="md:hidden">
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-none"
                style={{ scrollPaddingLeft: '1rem' }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 snap-start"
                    style={{ width: 'calc(72vw - 0.75rem)', maxWidth: '260px' }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Scroll progress dots */}
              {products.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {products.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold/30" />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: 4-column grid (max 4 shown) */}
            <div className="hidden md:grid grid-cols-4 gap-4 lg:gap-5">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
