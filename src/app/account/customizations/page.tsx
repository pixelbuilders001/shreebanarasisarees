"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../../../context/StoreContext';
import {
  ChevronLeft,
  Sparkles,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { CustomizationsTabSkeleton } from '../../../components/TabSkeletons';

function getStatusBadgeStyle(status: string): string {
  const s = status?.toLowerCase() || '';
  if (s === 'completed') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
  }
  if (s === 'contacted') {
    return 'bg-sky-50 text-sky-800 border-sky-200/80';
  }
  if (s.includes('progress')) {
    return 'bg-purple-50 text-purple-800 border-purple-200/80';
  }
  // Pending / default
  return 'bg-amber-50 text-amber-800 border-amber-200/80';
}

export default function CustomizationsPage() {
  const router = useRouter();
  const { customRequests, user, isHydrated, setIsAuthModalOpen } = useStore();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/account');
    }
  };

  // 1. Loading / Hydration skeleton state (scoped to tab content area only)
  if (!isHydrated) {
    return <CustomizationsTabSkeleton />;
  }

  // 2. Unauthenticated view
  if (!user) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-8 border border-[#E7DFC9] text-center max-w-md mx-auto shadow-2xs space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#D4C39D] flex items-center justify-center mx-auto text-[#6B1725]">
          <Sparkles size={24} className="text-[#A17A32]" />
        </div>
        <h3 className="font-serif font-bold text-lg text-[#1C1917]">Sign in to view customizations</h3>
        <p className="text-xs text-[#57534E] leading-relaxed font-sans">
          Access your bespoke saree customization requests, status updates, and artisan discussions.
        </p>
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="py-2.5 px-6 bg-[#601221] hover:bg-[#4E0E1A] text-white rounded-full font-sans font-medium text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fadeIn min-w-0">
      {/* Section Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E7DFC9] shadow-2xs">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#1C1917] flex items-center gap-2">
          <Sparkles size={18} className="text-[#6B1725]" />
          <span>Bespoke Customizations ({customRequests.length})</span>
        </h2>
      </div>
        {customRequests.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] py-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full border border-[#D4C39D] bg-transparent flex items-center justify-center mx-auto mb-5 shrink-0">
              <Sparkles size={22} className="text-[#A17A32] stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1917] font-normal tracking-tight mb-2.5 text-center">
              No custom requests
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#57534E] max-w-[280px] mx-auto text-center leading-relaxed font-normal mb-7">
              Have a dream saree crafted for your wedding or special occasion with our master weavers in Varanasi.
            </p>
            <Link
              href="/sarees"
              className="py-3 px-8 bg-[#601221] hover:bg-[#4E0E1A] text-white rounded-full font-sans font-medium text-sm transition-all active:scale-95 cursor-pointer shadow-xs inline-block"
            >
              Explore Sarees
            </Link>
          </div>
        ) : (
          /* Custom Requests List */
          <div className="space-y-3.5 animate-fadeIn">
            {customRequests.map((req) => {
              const date = new Date(req.createdAt);
              const formattedDate = !isNaN(date.getTime())
                ? date.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Recently';

              const statusStyle = getStatusBadgeStyle(req.status);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-[#E7DFC9] shadow-2xs space-y-3.5 transition-all"
                >
                  {/* Top Row: Saree Type + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif font-bold text-base sm:text-lg text-[#1C1917] truncate">
                        {req.sareeType || 'Bespoke Saree'}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-[#78716C] mt-1 font-sans">
                        <Calendar size={13} className="text-[#A8A29E] shrink-0" />
                        <span>Submitted on {formattedDate}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 border rounded-md text-[11px] font-semibold font-sans shrink-0 ${statusStyle}`}>
                      {req.status || 'Pending'}
                    </span>
                  </div>

                  {/* Optional Saree Reference Image */}
                  {req.image && (
                    <div className="rounded-lg overflow-hidden border border-[#E7DFC9] max-h-48 bg-[#FAF8F5]">
                      <img
                        src={req.image}
                        alt={req.sareeType}
                        className="w-full h-full object-cover max-h-48"
                      />
                    </div>
                  )}

                  <div className="border-t border-[#EFEBE4]" />

                  {/* 4 Attributes Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#78716C] font-sans block">Fabric</span>
                      <span className="font-medium text-[#1C1917] font-sans block truncate mt-0.5">
                        {req.fabric || 'Pure Katan Silk'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#78716C] font-sans block">Color Preferred</span>
                      <span className="font-medium text-[#1C1917] font-sans block truncate mt-0.5">
                        {req.color || 'Custom'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#78716C] font-sans block">Budget Target</span>
                      <span className="font-semibold text-[#6B1725] font-serif block truncate mt-0.5">
                        {req.budget || 'Flexible'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#78716C] font-sans block">Occasion</span>
                      <span className="font-medium text-[#1C1917] font-sans block truncate mt-0.5">
                        {req.occasion || 'Wedding / Special'}
                      </span>
                    </div>
                  </div>

                  {/* Special Instructions Note */}
                  {req.requirements && (
                    <>
                      <div className="border-t border-[#EFEBE4]" />
                      <div>
                        <span className="text-[11px] text-[#78716C] font-sans block">Special Instructions</span>
                        <div className="bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EAE2D2] mt-1">
                          <p className="text-xs text-[#57534E] leading-relaxed font-sans italic">
                            &ldquo;{req.requirements}&rdquo;
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="border-t border-[#EFEBE4]" />

                  {/* Footer: ID + WhatsApp Chat CTA */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <span className="text-[11px] text-[#78716C] font-mono truncate">
                      ID: {req.id}
                    </span>
                    <a
                      href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hello, I am inquiring about my Bespoke Saree Request (ID: ${req.id}, Type: ${req.sareeType})`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-sans font-medium rounded-full text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <MessageCircle size={13} className="fill-current" />
                      <span>Chat with Expert</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
