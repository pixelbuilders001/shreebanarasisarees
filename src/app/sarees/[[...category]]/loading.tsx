import React from 'react';
import { ProductCardSkeleton } from '../../../components/ProductCardSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] font-sans pb-24 lg:pb-16">
      {/* Category header placeholder */}
      <div className="bg-white border-b border-[#E5DEC9] py-4 px-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-12 bg-stone-200 rounded animate-pulse" />
            <span className="text-stone-300">/</span>
            <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="h-7 w-48 bg-stone-200 rounded-md animate-pulse" />
          <div className="h-3.5 w-3/4 max-w-lg bg-stone-200/80 rounded animate-pulse" />
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="bg-[#FAF7F0] border-b border-[#E5DEC9] py-3 px-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-full bg-stone-200/80 shrink-0 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <ProductCardSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}

