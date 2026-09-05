"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';

export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#292524] flex flex-col font-sans pb-32">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-[#E5DEC9] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="w-9 h-9 rounded-full bg-stone-200/80 animate-pulse flex items-center justify-center">
            <ChevronLeft size={18} className="text-stone-300" />
          </div>
          <div className="h-6 w-24 bg-stone-200 rounded-md animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-transparent" />
        </div>
      </header>

      {/* 2. STEPPER */}
      <div className="bg-white border-b border-[#F3ECE0] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-stone-200 animate-pulse" />
            <div className="h-3 w-14 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-stone-200 animate-pulse" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-stone-200 animate-pulse" />
            <div className="h-3 w-14 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-stone-200 animate-pulse" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-stone-200 animate-pulse" />
            <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="max-w-xl mx-auto w-full px-4 py-4 space-y-4 flex-1">
        {/* DELIVER TO CARD */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-stone-200 rounded animate-pulse" />
          </div>

          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className="w-[240px] sm:w-[260px] shrink-0 bg-white rounded-xl border border-[#E5DEC9] p-3 animate-pulse"
              >
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="w-24 h-3 bg-stone-200 rounded-md" />
                  <div className="w-4 h-4 rounded-full border border-[#E5DEC9]" />
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-md mb-1.5" />
                <div className="w-4/5 h-2.5 bg-stone-200 rounded-md mb-1.5" />
                <div className="w-1/2 h-2.5 bg-stone-200 rounded-md" />
                <div className="mt-3 pt-2 border-t border-[#F3ECE0] flex items-center justify-end">
                  <div className="w-10 h-2.5 bg-stone-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DELIVERY MODE CARD */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 flex items-start justify-between shadow-2xs animate-pulse">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-7 h-7 rounded-full bg-stone-200 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="w-40 sm:w-52 h-3.5 bg-stone-200 rounded-md" />
              <div className="w-56 sm:w-72 h-2.5 bg-stone-200 rounded-md" />
            </div>
          </div>
          <div className="w-10 h-3.5 bg-stone-200 rounded-md shrink-0" />
        </div>

        {/* PAYMENT METHOD SECTION */}
        <div className="space-y-2.5 pt-1">
          <div className="h-3 w-32 bg-stone-200 rounded animate-pulse" />
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-[#E5DEC9] animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-28 h-3 bg-stone-200 rounded-md" />
                  <div className="w-40 h-2.5 bg-stone-200 rounded-md" />
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border border-[#D4C39D]" />
            </div>
          ))}
        </div>

        {/* ORDER SUMMARY CARD */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 space-y-3 shadow-2xs">
          <div className="h-3 w-40 bg-stone-200 rounded animate-pulse" />
          <div className="space-y-3 pt-1">
            {[0, 1].map((n) => (
              <div key={n} className="flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-14 rounded-lg bg-stone-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-2.5 bg-stone-200 rounded-md" />
                    <div className="w-16 h-2 bg-stone-200 rounded-md" />
                  </div>
                </div>
                <div className="w-14 h-3 bg-stone-200 rounded-md shrink-0" />
              </div>
            ))}
          </div>
          <div className="border-t border-[#F3ECE0] pt-3 flex items-center justify-between animate-pulse">
            <div className="w-14 h-3 bg-stone-200 rounded-md" />
            <div className="w-20 h-4 bg-stone-200 rounded-md" />
          </div>
        </div>
      </main>

      {/* 4. STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] px-4 py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 animate-pulse">
            <div className="w-20 h-5 bg-stone-200 rounded-md" />
            <div className="w-28 h-2 bg-stone-200 rounded-md" />
          </div>
          <div className="w-40 sm:w-44 h-12 bg-stone-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}