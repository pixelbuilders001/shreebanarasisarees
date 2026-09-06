"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProfileSkeleton({ onBack }: { onBack?: () => void }) {
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
      {/* 1. TOP HEADER (EXACTLY MATCHING ADDRESSES PAGE) */}
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
            Profile
          </h1>
        </div>
      </header>

      {/* 2. SKELETON CARDS */}
      <main className="flex-1 max-w-md sm:max-w-xl mx-auto w-full px-4 py-4 sm:py-5 space-y-4 animate-pulse">
        {/* Skeleton Identity Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-[#E7DFC9] shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-stone-200/90 flex-shrink-0" />
              <div className="space-y-2">
                <div className="w-36 h-5 bg-stone-200/80 rounded" />
                <div className="w-48 h-3.5 bg-stone-200/60 rounded" />
              </div>
            </div>
            <div className="w-16 h-8 rounded-lg bg-stone-200/60" />
          </div>
        </div>

        {/* Skeleton Details Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-[#E7DFC9] shadow-2xs space-y-4">
          <div className="w-32 h-4.5 bg-stone-200/80 rounded" />
          <div className="space-y-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="w-20 h-3 bg-stone-200/50 rounded" />
                <div className="w-40 h-4 bg-stone-200/70 rounded" />
                {i < 2 && <div className="border-t border-[#EFEBE4] my-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Notification Settings Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-[#E7DFC9] shadow-2xs space-y-3">
          <div className="w-36 h-4.5 bg-stone-200/80 rounded" />
          <div className="w-full h-10 bg-stone-200/40 rounded-xl mt-2" />
        </div>
      </main>
    </div>
  );
}
