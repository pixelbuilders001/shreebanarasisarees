"use client";

import React, { Suspense } from 'react';
import { useStore } from '../../../context/StoreContext';
import { FileText, MessageCircle, Calendar, Sparkles, AlertCircle } from 'lucide-react';

function CustomizationsContent() {
  const { customRequests, user } = useStore();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'contacted':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'in progress':
      case 'in_progress':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-cream text-dark-brown/70 border-cream';
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-cream shadow-sm text-center text-xs text-dark-brown/50 italic py-16">
        Please log in to view your customization requests.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fadeIn mx-auto w-full">
      <div className="flex justify-between items-center border-b border-cream pb-3 bg-white p-4 rounded-2xl border border-cream shadow-sm">
        <h2 className="font-serif text-lg font-bold text-dark-brown flex items-center gap-2">
          <FileText size={18} className="text-maroon animate-pulse" />
          My Customizations ({customRequests.length})
        </h2>
      </div>

      {customRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cream shadow-sm text-center text-xs text-dark-brown/50 italic py-16 flex flex-col items-center justify-center space-y-3">
          <Sparkles size={32} className="text-cream/80" />
          <span>No customization requests submitted yet.</span>
          <p className="text-[11px] text-dark-brown/40 max-w-xs leading-relaxed font-semibold">
            Want a saree designed specifically for your special occasion? Fill out the customization form on our collections page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customRequests.map((req) => {
            const date = new Date(req.createdAt);
            const formattedDate = date.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div 
                key={req.id} 
                className="bg-white border border-cream rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-cream/40 pb-2.5">
                    <div>
                      <span className="font-serif font-bold text-maroon text-base">{req.sareeType}</span>
                      <div className="flex items-center gap-1 text-[10px] text-dark-brown/40 mt-0.5">
                        <Calendar size={11} />
                        <span>Submitted on {formattedDate}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-dark-brown/85">
                    <div>
                      <span className="text-[9px] text-dark-brown/45 block uppercase font-bold tracking-wider">Fabric</span>
                      <span className="text-dark-brown leading-none">{req.fabric}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-dark-brown/45 block uppercase font-bold tracking-wider">Color Preferred</span>
                      <span className="text-dark-brown leading-none">{req.color}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-dark-brown/45 block uppercase font-bold tracking-wider">Budget Target</span>
                      <span className="text-maroon leading-none">{req.budget}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-dark-brown/45 block uppercase font-bold tracking-wider">Occasion</span>
                      <span className="text-dark-brown leading-none">{req.occasion || 'Wedding / Special'}</span>
                    </div>
                  </div>

                  {req.requirements && (
                    <div className="pt-2 border-t border-cream/35">
                      <span className="text-[9px] text-dark-brown/45 block uppercase font-bold tracking-wider">Special Requirements</span>
                      <p className="text-[11px] text-dark-brown/70 leading-relaxed italic mt-0.5">
                        &ldquo;{req.requirements}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-cream/50 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-dark-brown/40 font-mono font-bold uppercase tracking-wider">ID: {req.id}</span>
                  <a
                    href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hello, I am tracking my Saree Customization Request (ID: ${req.id}, Type: ${req.sareeType})`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-serif font-bold rounded-xl text-[10px] flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <MessageCircle size={12} className="fill-current" />
                    Chat with Expert
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

export default function CustomizationsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-dark-brown/50 italic animate-pulse">Loading customization requests...</div>}>
      <CustomizationsContent />
    </Suspense>
  );
}
