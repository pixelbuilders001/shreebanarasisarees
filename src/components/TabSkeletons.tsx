"use client";

import React from 'react';

/**
 * Skeleton for the Orders tab content area.
 * Renders only inside the account tab content container (no outer header/tabs).
 */
export function OrdersTabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse w-full">
      {/* Header bar placeholder */}
      <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs flex items-center justify-between">
        <div className="w-36 h-5 bg-stone-200/80 rounded" />
        <div className="w-24 h-7 bg-stone-200/60 rounded-lg" />
      </div>

      {/* Filter Pills Skeleton */}
      <div className="flex items-center gap-2.5 overflow-x-hidden py-1">
        <div className="w-14 h-9 bg-stone-200/80 rounded-full shrink-0" />
        <div className="w-24 h-9 bg-stone-200/50 rounded-full shrink-0" />
        <div className="w-24 h-9 bg-stone-200/50 rounded-full shrink-0" />
        <div className="w-24 h-9 bg-stone-200/50 rounded-full shrink-0" />
      </div>

      {/* Order Cards Skeleton */}
      <div className="space-y-3.5">
        {[0, 1, 2].map((n) => (
          <div key={n} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="w-24 h-5 bg-stone-200/80 rounded-md" />
              <div className="w-20 h-4 bg-stone-200/60 rounded" />
            </div>
            <div className="flex items-start gap-3.5">
              <div className="w-16 h-20 sm:w-18 sm:h-22 bg-stone-200/70 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 pt-0.5">
                <div className="w-48 h-4 bg-stone-200/80 rounded" />
                <div className="w-36 h-3 bg-stone-200/60 rounded" />
                <div className="w-28 h-3.5 bg-stone-200/70 rounded mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for the Addresses tab content area.
 * Renders only inside the account tab content container (no outer header/tabs).
 */
export function AddressesTabSkeleton() {
  return (
    <div className="space-y-3.5 animate-pulse w-full">
      {/* Header bar placeholder */}
      <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs flex items-center justify-between">
        <div className="w-40 h-5 bg-stone-200/80 rounded" />
        <div className="w-24 h-7 bg-stone-200/60 rounded-lg" />
      </div>

      {/* Address cards skeleton */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-16 h-5 bg-stone-200/80 rounded-md" />
            <div className="w-5 h-5 bg-stone-200/60 rounded-full" />
          </div>
          <div className="w-36 h-4.5 bg-stone-200/80 rounded" />
          <div className="space-y-1.5 pt-1">
            <div className="w-56 h-3.5 bg-stone-200/60 rounded" />
            <div className="w-44 h-3.5 bg-stone-200/60 rounded" />
          </div>
          <div className="w-32 h-3.5 bg-stone-200/50 rounded" />
          <div className="border-t border-[#EFEBE4] my-2" />
          <div className="flex items-center gap-5">
            <div className="w-12 h-3.5 bg-stone-200/60 rounded" />
            <div className="w-14 h-3.5 bg-stone-200/60 rounded" />
          </div>
        </div>
      ))}
      <div className="w-full h-12 rounded-xl border border-dashed border-stone-200 bg-stone-50/50" />
    </div>
  );
}

/**
 * Skeleton for the Profile tab content area.
 * Renders only inside the account tab content container (no outer header/tabs).
 */
export function ProfileTabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse w-full">
      {/* Identity Card Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-stone-200/90 shrink-0" />
            <div className="space-y-2">
              <div className="w-36 h-5 bg-stone-200/80 rounded" />
              <div className="w-48 h-3.5 bg-stone-200/60 rounded" />
            </div>
          </div>
          <div className="w-24 h-8 rounded-lg bg-stone-200/60" />
        </div>
      </div>

      {/* Details Card Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3">
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

      {/* Notification Settings Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3">
        <div className="w-36 h-4.5 bg-stone-200/80 rounded" />
        <div className="w-full h-10 bg-stone-200/40 rounded-xl mt-2" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the Customizations tab content area.
 * Renders only inside the account tab content container (no outer header/tabs).
 */
export function CustomizationsTabSkeleton() {
  return (
    <div className="space-y-3.5 animate-pulse w-full">
      {/* Header bar placeholder */}
      <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs">
        <div className="w-48 h-5 bg-stone-200/80 rounded" />
      </div>

      {/* Custom request card skeletons */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="w-40 h-5 bg-stone-200/80 rounded" />
            <div className="w-20 h-5 bg-stone-200/60 rounded-md" />
          </div>
          <div className="w-32 h-3.5 bg-stone-200/50 rounded" />
          <div className="border-t border-[#EFEBE4]" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="space-y-1">
                <div className="w-16 h-3 bg-stone-200/50 rounded" />
                <div className="w-24 h-4 bg-stone-200/70 rounded" />
              </div>
            ))}
          </div>
          <div className="border-t border-[#EFEBE4]" />
          <div className="flex items-center justify-between pt-1">
            <div className="w-28 h-3.5 bg-stone-200/50 rounded" />
            <div className="w-32 h-8 bg-stone-200/70 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
