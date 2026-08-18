"use client";

import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative bg-[#FFF9F0]/65 border border-gold/15 rounded-xl overflow-hidden flex flex-col"
        >
          {/* Image placeholder */}
          <div className="w-full aspect-[3/4] bg-cream animate-pulse" />
          {/* Info area placeholders */}
          <div className="p-2 space-y-2 flex-grow flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-2 w-16 bg-cream animate-pulse rounded" />
              <div className="h-3 w-full bg-cream animate-pulse rounded" />
              <div className="h-2 w-20 bg-cream animate-pulse rounded" />
            </div>
            <div className="h-7 w-full bg-cream animate-pulse rounded" />
          </div>
        </div>
      ))}
    </>
  );
};