import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] font-sans pb-32 lg:pb-16 text-[#292524]">
      {/* ── DESKTOP BREADCRUMB ── */}
      <div className="hidden lg:block bg-white border-b border-[#E5DEC9] py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="h-3 w-12 bg-stone-200 rounded animate-pulse" />
          <span className="text-stone-300">/</span>
          <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
          <span className="text-stone-300">/</span>
          <div className="h-3 w-28 bg-stone-200 rounded animate-pulse" />
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto lg:px-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* ── IMAGE SECTION ── */}
          <div className="lg:col-span-7">
            {/* Mobile floating top buttons placeholder */}
            <div className="lg:hidden relative">
              <div className="w-full aspect-[3/4] bg-stone-200 animate-pulse" />
              <div className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/70 animate-pulse" />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/70 animate-pulse" />
                <div className="w-9 h-9 rounded-full bg-white/70 animate-pulse" />
              </div>
              {/* Pagination dots */}
              <div className="flex items-center justify-center gap-1.5 py-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Desktop main image + thumbnails */}
            <div className="hidden lg:block space-y-4">
              <div className="w-full aspect-[3/4] max-h-[600px] bg-stone-200 rounded-2xl animate-pulse" />
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="w-20 h-24 rounded-xl bg-stone-200 shrink-0 animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* ── DETAILS SECTION ── */}
          <div className="lg:col-span-5 px-4 sm:px-6 lg:px-0 py-4 lg:py-0 space-y-5">
            {/* Fabric Tag */}
            <div className="h-4 w-28 bg-stone-200 rounded-full animate-pulse" />

            {/* Title */}
            <div className="space-y-2">
              <div className="h-6 sm:h-7 w-4/5 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-6 sm:h-7 w-2/3 bg-stone-200 rounded-md animate-pulse" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-stone-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-stone-200 rounded animate-pulse" />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-1">
              <div className="h-8 w-28 bg-stone-200 rounded-md animate-pulse" />
              <div className="h-5 w-20 bg-stone-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-stone-200 rounded-full animate-pulse" />
            </div>

            {/* Delivery Info Card */}
            <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 flex items-center gap-3.5 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-stone-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-44 bg-stone-200 rounded" />
                <div className="h-2.5 w-56 bg-stone-200 rounded" />
              </div>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3 pt-2">
              <div className="flex-1 h-12 bg-stone-200 rounded-full animate-pulse" />
              <div className="flex-1 h-12 bg-stone-200 rounded-full animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-stone-200 shrink-0 animate-pulse" />
            </div>

            {/* Accordion List */}
            <div className="space-y-3 pt-3 border-t border-[#E5DEC9]">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between py-3 border-b border-[#F3ECE0]">
                  <div className="h-4 w-36 bg-stone-200 rounded animate-pulse" />
                  <div className="w-4 h-4 rounded-full bg-stone-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-5 w-20 bg-stone-200 rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-stone-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 bg-stone-200 rounded-full animate-pulse" />
            <div className="h-10 w-24 bg-stone-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

