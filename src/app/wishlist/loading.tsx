import React from 'react';
import { ProductCardSkeleton } from '../../components/ProductCardSkeleton';

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-grow font-sans">
      {/* Header Skeleton */}
      <div className="border-b border-cream pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <div className="h-6 w-36 bg-cream rounded animate-pulse" />
          <div className="h-3 w-16 bg-cream/70 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-10 bg-cream rounded animate-pulse" />
          <span className="text-cream">/</span>
          <div className="h-3 w-14 bg-cream rounded animate-pulse" />
        </div>
      </div>

      {/* Banner Skeleton */}
      <div className="mb-4 w-full aspect-[2111/649] md:aspect-[2121/261] rounded-xl sm:rounded-2xl bg-cream/70 animate-pulse border border-cream/80" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <ProductCardSkeleton count={8} />
      </div>
    </main>
  );
}

