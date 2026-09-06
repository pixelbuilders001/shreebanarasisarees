"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CustomizationsSkeleton({ onBack }: { onBack?: () => void }) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/account');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans text-[#292524] pb-24">
      {/* 1. TOP HEADER (MATCHING ADDRESSES & PROFILE) */}
      <header className="bg-[#FAF8F5] border-b border-[#EAE2D2]/60 py-3.5 px-4 sticky top-0 z-30">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center gap-3.5">
          <button
            onClick={handleBack}
            className="p-1 -ml-1 text-[#292524] hover:text-[#6B1725] transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="stroke-[1.8]" />
          </button>
          <h1 className="font-serif font-normal text-[22px] text-[#1C1917] tracking-tight">
            Customizations
          </h1>
        </div>
      </header>

      {/* 2. SKELETON CARDS */}
      <main className="flex-1 max-w-md sm:max-w-xl mx-auto w-full px-4 py-4 sm:py-5 space-y-3.5 animate-pulse">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3.5"
          >
            {/* Top row: Type + Status Pill */}
            <div className="flex items-center justify-between">
              <div className="w-40 h-5 bg-stone-200/80 rounded" />
              <div className="w-20 h-5 bg-stone-200/60 rounded-md" />
            </div>

            {/* Date line */}
            <div className="w-32 h-3.5 bg-stone-200/50 rounded" />

            <div className="border-t border-[#EFEBE4]" />

            {/* 4 Attributes Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="space-y-1">
                  <div className="w-16 h-3 bg-stone-200/50 rounded" />
                  <div className="w-24 h-4 bg-stone-200/70 rounded" />
                </div>
              ))}
            </div>

            <div className="border-t border-[#EFEBE4]" />

            {/* Special Note placeholder */}
            <div className="h-12 bg-stone-200/40 rounded-lg" />

            <div className="border-t border-[#EFEBE4]" />

            {/* Footer: ID and Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="w-28 h-3.5 bg-stone-200/50 rounded" />
              <div className="w-32 h-8 bg-stone-200/70 rounded-full" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
