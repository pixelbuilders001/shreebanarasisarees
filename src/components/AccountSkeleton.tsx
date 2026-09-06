"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Footer } from './Footer';

export function AccountSkeleton() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F0] w-full max-w-full overflow-x-clip">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-[#E5DEC9] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 text-[#292524]/40">
              <ChevronLeft size={22} />
            </div>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524]">
              Account
            </h1>
          </div>
          {/* Header Right Avatar Skeleton */}
          <div className="flex items-center gap-2 py-1 px-1.5 sm:px-2.5 animate-pulse">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200/90" />
            <div className="w-16 sm:w-20 h-3.5 bg-stone-200/70 rounded" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-grow min-w-0">
        {/* Mobile Pills Skeleton */}
        <div className="lg:hidden mb-5 w-full max-w-full">
          <div className="bg-white border border-[#F3ECE0] p-1.5 rounded-2xl shadow-xs flex items-center gap-2 overflow-x-hidden animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 bg-stone-200/70 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
          {/* Desktop Sidebar Skeleton */}
          <aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-3xl border border-[#F3ECE0] shadow-xs space-y-2.5 animate-pulse">
            <div className="w-24 h-3 bg-stone-200/60 rounded mb-3 ml-2" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-stone-200/40 rounded-xl" />
            ))}
          </aside>

          {/* Dashboard Content Skeleton */}
          <div className="lg:col-span-9 w-full min-w-0">
            <div className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#F3ECE0] shadow-xs space-y-6 animate-pulse">
              <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3.5">
                <div className="w-36 h-5 bg-stone-200/80 rounded" />
              </div>

              {/* Order Skeleton Cards */}
              <div className="space-y-4">
                {[0, 1].map((n) => (
                  <div
                    key={n}
                    className="bg-white border border-[#F3ECE0] rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col gap-4"
                  >
                    {/* Top: Order ID & Date */}
                    <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
                      <div className="w-28 h-6 bg-stone-200/80 rounded-lg" />
                      <div className="w-20 h-4 bg-stone-200/60 rounded" />
                    </div>

                    {/* Middle: Thumbnails & Title */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex -space-x-2">
                        <div className="w-12 h-16 bg-stone-200/90 rounded-lg border-2 border-white" />
                        <div className="w-12 h-16 bg-stone-200/70 rounded-lg border-2 border-white" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="w-20 h-4 bg-stone-200/80 rounded" />
                        <div className="w-48 h-3 bg-stone-200/60 rounded" />
                      </div>
                    </div>

                    {/* Bottom: Total & Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#F3ECE0]">
                      <div className="w-24 h-5 bg-stone-200/80 rounded" />
                      <div className="w-32 h-9 bg-stone-200/80 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
