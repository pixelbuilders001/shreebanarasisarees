import React from 'react';
import { ProductCardSkeleton } from '../../components/ProductCardSkeleton';

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow font-sans">
      {/* Header Skeleton */}
      <div className="border-b border-[#E5DEC9] pb-6 mb-6 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-10 bg-stone-200 rounded animate-pulse" />
          <span className="text-stone-300">/</span>
          <div className="h-3 w-14 bg-stone-200 rounded animate-pulse" />
        </div>
        <div className="h-8 w-44 bg-stone-200 rounded-md animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <ProductCardSkeleton count={8} />
      </div>
    </main>
  );
}

