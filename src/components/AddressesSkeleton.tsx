"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AddressesSkeleton({ onBack }: { onBack?: () => void }) {
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
      {/* 1. TOP HEADER */}
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
            Addresses
          </h1>
        </div>
      </header>

      {/* 2. SKELETON ADDRESS CARDS */}
      <main className="flex-1 max-w-md sm:max-w-xl mx-auto w-full px-4 py-4 sm:py-5">
        <div className="space-y-3.5">
          {/* Skeleton Card 1 (Default Card) */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#6B1725]/30 shadow-2xs animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-14 h-5 rounded-md bg-stone-200/80" />
                <div className="w-10 h-3.5 rounded bg-stone-200/60" />
              </div>
              <div className="w-5 h-5 rounded-full bg-[#6B1725]/20" />
            </div>
            <div className="w-36 h-4.5 bg-stone-200/90 rounded mt-2" />
            <div className="space-y-1.5 pt-0.5">
              <div className="w-full h-3 bg-stone-200/60 rounded" />
              <div className="w-3/4 h-3 bg-stone-200/60 rounded" />
            </div>
            <div className="w-28 h-3 bg-stone-200/60 rounded" />
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-stone-200/70" />
              <div className="w-44 h-3 bg-stone-200/70 rounded" />
            </div>
            <div className="border-t border-[#EFEBE4] my-2.5" />
            <div className="flex items-center gap-5 pt-0.5">
              <div className="w-12 h-3.5 rounded bg-stone-200/60" />
              <div className="w-14 h-3.5 rounded bg-stone-200/60" />
            </div>
          </div>

          {/* Skeleton Card 2 */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E7DFC9] animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-24 h-5 rounded-md bg-stone-200/80" />
              <div className="w-5 h-5 rounded-full border border-stone-200" />
            </div>
            <div className="w-32 h-4.5 bg-stone-200/90 rounded mt-2" />
            <div className="space-y-1.5 pt-0.5">
              <div className="w-full h-3 bg-stone-200/60 rounded" />
              <div className="w-2/3 h-3 bg-stone-200/60 rounded" />
            </div>
            <div className="w-28 h-3 bg-stone-200/60 rounded" />
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-stone-200/70" />
              <div className="w-36 h-3 bg-stone-200/70 rounded" />
            </div>
            <div className="border-t border-[#EFEBE4] my-2.5" />
            <div className="flex items-center gap-5 pt-0.5">
              <div className="w-12 h-3.5 rounded bg-stone-200/60" />
              <div className="w-14 h-3.5 rounded bg-stone-200/60" />
            </div>
          </div>

          {/* Skeleton Card 3 */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E7DFC9] animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-20 h-5 rounded-md bg-stone-200/80" />
              <div className="w-5 h-5 rounded-full border border-stone-200" />
            </div>
            <div className="w-36 h-4.5 bg-stone-200/90 rounded mt-2" />
            <div className="space-y-1.5 pt-0.5">
              <div className="w-full h-3 bg-stone-200/60 rounded" />
              <div className="w-3/5 h-3 bg-stone-200/60 rounded" />
            </div>
            <div className="w-28 h-3 bg-stone-200/60 rounded" />
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-3.5 h-3.5 rounded-full bg-stone-200/70" />
              <div className="w-32 h-3 bg-stone-200/70 rounded" />
            </div>
            <div className="border-t border-[#EFEBE4] my-2.5" />
            <div className="flex items-center gap-5 pt-0.5">
              <div className="w-12 h-3.5 rounded bg-stone-200/60" />
              <div className="w-14 h-3.5 rounded bg-stone-200/60" />
            </div>
          </div>

          {/* Skeleton Add Address Button */}
          <div className="w-full h-12 rounded-xl border border-dashed border-[#D4C39D]/70 bg-stone-200/10 animate-pulse flex items-center justify-center mt-4">
            <div className="w-36 h-4 bg-stone-200/60 rounded" />
          </div>
        </div>
      </main>
    </div>
  );
}
