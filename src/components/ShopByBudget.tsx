"use client";

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Tag, ChevronRight } from 'lucide-react';
import { Product } from '../data/products';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

export interface BudgetTier {
  id: string;
  label: string;
  badge: string;
  minPrice?: number;
  maxPrice?: number;
  href: string;
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    id: 'under-2k',
    label: 'Under ₹1,999',
    badge: 'Pocket Friendly',
    minPrice: 0,
    maxPrice: 1999,
    href: '/sarees?minPrice=0&maxPrice=1999',
  },
  {
    id: '2k-4k',
    label: '₹2,000 – ₹3,999',
    badge: 'Popular Choice',
    minPrice: 2000,
    maxPrice: 3999,
    href: '/sarees?minPrice=2000&maxPrice=3999',
  },
  {
    id: '4k-7k',
    label: '₹4,000 – ₹6,999',
    badge: 'Premium Picks',
    minPrice: 4000,
    maxPrice: 6999,
    href: '/sarees?minPrice=4000&maxPrice=6999',
  },
  {
    id: 'above-7k',
    label: '₹7,000 & Above',
    badge: 'Royal Heritage',
    minPrice: 7000,
    maxPrice: undefined,
    href: '/sarees?minPrice=7000',
  },
];

interface ShopByBudgetProps {
  initialProducts?: Product[];
}

export const ShopByBudget: React.FC<ShopByBudgetProps> = ({ initialProducts = [] }) => {
  const { products: storeProducts } = useStore();
  const [selectedTierId, setSelectedTierId] = useState<string>(BUDGET_TIERS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pool of products: prioritize live products from StoreContext, fallback to initialProducts
  const productsPool = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) return storeProducts;
    return initialProducts;
  }, [storeProducts, initialProducts]);

  // Dynamic helper: check if product belongs to tier based strictly on effective selling price
  const isProductInTier = (product: Product, tier: BudgetTier): boolean => {
    const finalPrice = product.salePrice != null && product.salePrice > 0 
      ? product.salePrice 
      : product.price;

    if (tier.minPrice !== undefined && finalPrice < tier.minPrice) return false;
    if (tier.maxPrice !== undefined && finalPrice > tier.maxPrice) return false;
    return true;
  };

  // Current active tier
  const activeTier = useMemo(() => {
    return BUDGET_TIERS.find((t) => t.id === selectedTierId) || BUDGET_TIERS[0];
  }, [selectedTierId]);

  // Filter products for the active tier dynamically
  const activeProducts = useMemo(() => {
    return productsPool
      .filter((p) => isProductInTier(p, activeTier))
      .slice(0, 10); // Show top 10 in the homepage showcase
  }, [productsPool, activeTier]);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-2 pb-6 sm:pt-4 sm:pb-8 px-4 md:px-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15 relative overflow-hidden">
      {/* Luxury ambient glow accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#B08A3C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6B1725]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Budget Tiers: Compact Single-Row Horizontal Scroll on Mobile, 4-Col Grid on Desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth snap-x snap-mandatory mb-3 sm:mb-4">
          {BUDGET_TIERS.map((tier) => {
            const isSelected = tier.id === selectedTierId;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTierId(tier.id)}
                className={`relative shrink-0 snap-start w-[142px] xs:w-[155px] md:w-auto text-left p-3 md:p-5 rounded-xl md:rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer shadow-xs md:shadow-none ${
                  isSelected
                    ? 'bg-[#6B1725] text-white shadow-lg shadow-[#6B1725]/20 ring-1.5 md:ring-2 ring-[#B08A3C] transform -translate-y-0.5 md:-translate-y-1'
                    : 'bg-[#FFFFFF] text-[#292524] border border-[#B08A3C]/20 hover:border-[#B08A3C]/60 hover:shadow-md'
                }`}
              >
                {/* Decorative background watermark */}
                <div
                  className={`absolute -right-3 -bottom-3 md:-right-4 md:-bottom-4 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none ${
                    isSelected ? 'text-white' : 'text-[#6B1725]'
                  }`}
                >
                  <Tag className="w-12 h-12 md:w-20 md:h-20" />
                </div>

                {/* Card Top: Badge */}
                <div className="flex items-center justify-between gap-1 mb-1.5 md:mb-2">
                  <span
                    className={`text-[8.5px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-serif ${
                      isSelected
                        ? 'bg-[#B08A3C] text-[#292524]'
                        : 'bg-[#FAF7F0] text-[#B08A3C] border border-[#B08A3C]/20'
                    }`}
                  >
                    {tier.badge}
                  </span>
                </div>

                {/* Card Middle: Price */}
                <div className="my-0.5 md:my-2">
                  <h3
                    className={`font-serif text-sm md:text-2xl font-bold tracking-tight ${
                      isSelected ? 'text-[#FAF7F0]' : 'text-[#292524] group-hover:text-[#6B1725]'
                    }`}
                  >
                    {tier.label}
                  </h3>
                </div>

                {/* Card Bottom: Interactive indicator */}
                <div className="mt-1.5 md:mt-3 pt-1.5 md:pt-2.5 border-t border-current/10 flex items-center justify-between text-[10px] md:text-xs font-medium">
                  <span className={isSelected ? 'text-[#D4B870] font-bold' : 'text-[#B08A3C]'}>
                    Shop
                  </span>
                  <ChevronRight
                    size={13}
                    className={`transform transition-transform ${
                      isSelected
                        ? 'translate-x-0.5 text-[#D4B870]'
                        : 'text-[#B08A3C] group-hover:translate-x-1'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Product Carousel / Loading state */}
        {productsPool.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            <ProductCardSkeleton count={4} />
          </div>
        ) : activeProducts.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar pb-1.5 sm:pb-2 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {activeProducts.map((prod) => (
              <div
                key={prod.id}
                className="w-[165px] sm:w-[260px] lg:w-[280px] shrink-0 snap-start relative"
              >
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-[#B08A3C]/30">
            <p className="font-serif text-sm sm:text-base text-[#6B625D]">
              No sarees found in this specific budget range right now.
            </p>
            <Link
              href="/sarees"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-[#6B1725] text-white text-xs font-serif font-bold rounded-lg hover:bg-[#52111C] transition-colors"
            >
              <span>Explore All Sarees</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Bottom Banner CTA & Carousel Navigation */}
        <div className="mt-3 sm:mt-4 flex items-center justify-center relative">
          <Link
            href={activeTier.href}
            className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white border border-[#B08A3C]/40 text-[#6B1725] hover:bg-[#6B1725] hover:text-white text-xs font-serif font-bold uppercase tracking-wider transition-all duration-300 shadow-xs"
          >
            <span>Explore All {activeTier.label}</span>
            <ArrowRight size={13} />
          </Link>

          {/* Desktop Next & Prev Arrow Navigation situated below cards */}
          {activeProducts.length > 4 && (
            <div className="hidden md:flex items-center gap-1.5 absolute right-0">
              <button
                type="button"
                onClick={scrollLeft}
                className="p-2 rounded-full border border-[#B08A3C]/30 hover:border-[#6B1725] text-[#292524] hover:text-[#6B1725] bg-white transition-colors cursor-pointer shadow-xs"
                aria-label="Previous products"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="p-2 rounded-full border border-[#B08A3C]/30 hover:border-[#6B1725] text-[#292524] hover:text-[#6B1725] bg-white transition-colors cursor-pointer shadow-xs"
                aria-label="Next products"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
