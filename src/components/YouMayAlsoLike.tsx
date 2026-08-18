"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Product } from '../data/products';
import { fetchSimilarProducts } from '../data/supabase';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YouMayAlsoLikeProps {
  currentProduct: Product;
}

export function YouMayAlsoLike({ currentProduct }: YouMayAlsoLikeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSimilarProducts(
      {
        id: currentProduct.id,
        category: currentProduct.category,
        fabric: currentProduct.fabric,
        color: currentProduct.color,
        price: currentProduct.price,
      },
      4
    ).then((results) => {
      if (!cancelled) {
        setProducts(results);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentProduct.id]);

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.72; // ~72vw per card
    scrollRef.current.scrollBy({
      left: dir === 'right' ? cardWidth : -cardWidth,
      behavior: 'smooth',
    });
  };

  // Don't render section at all while loading or if no results
  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-16 mb-8" aria-labelledby="you-may-also-like-heading">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold font-serif mb-1">
            Curated For You
          </p>
          <h2
            id="you-may-also-like-heading"
            className="font-serif text-xl sm:text-2xl font-extrabold text-dark-brown tracking-wide"
          >
            You May Also Like
          </h2>
        </div>

        {/* Mobile scroll arrows */}
        {!loading && products.length > 1 && (
          <div className="flex gap-2 md:hidden">
            <button
              onClick={() => scrollCarousel('left')}
              aria-label="Scroll left"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gold/30 bg-[#FFF9F0] text-dark-brown hover:border-maroon hover:text-maroon transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              aria-label="Scroll right"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gold/30 bg-[#FFF9F0] text-dark-brown hover:border-maroon hover:text-maroon transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
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
          <div className="md:hidden relative">
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
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gold/30"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: 4-column grid */}
          <div className="hidden md:grid grid-cols-4 gap-4 lg:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
