"use client";

import React from 'react';
import { Smartphone } from 'lucide-react';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';

export const AnnouncementBar: React.FC = () => {
  const isPwaInstalled = useIsPwaInstalled();

  const handlePwaInstall = async () => {
    const promptEvent = typeof window !== 'undefined' ? (window as any).deferredPwaPrompt : null;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
          markPwaAsInstalled();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else {
      alert('To install our app:\n1. Tap the Share icon in your browser\n2. Select "Add to Home Screen"');
    }
  };

  return (
    <div className="bg-[#52111C] text-[#FAF7F0] text-[11px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide flex items-center justify-center gap-2 sm:gap-4 border-b border-[#B08A3C]/25 select-none z-50 relative">
      <span>✨ Pan-India Delivery</span>
      <span className="w-1.5 h-1.5 rounded-full bg-[#B08A3C]" />
      <span>Secure Payments</span>
      <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#B08A3C]" />
      <span className="hidden sm:inline-block text-[#D4B870] font-semibold">COD Available 🇮🇳</span>

      {!isPwaInstalled && (
        <span className="sm:hidden inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B08A3C]" />
          <button
            onClick={handlePwaInstall}
            className="inline-flex items-center gap-1 bg-[#FAF7F0]/15 hover:bg-[#FAF7F0]/25 text-[#D4B870] hover:text-white px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer border border-[#B08A3C]/40 active:scale-95"
            title="Install Mobile App"
          >
            <Smartphone size={12} className="text-[#D4B870]" />
            <span>Install App</span>
          </button>
        </span>
      )}
    </div>
  );
};


