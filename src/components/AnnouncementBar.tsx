"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Smartphone, MapPin, Truck, Package, Store, MessageCircle } from 'lucide-react';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';

export const AnnouncementBar: React.FC = () => {
  const isPwaInstalled = useIsPwaInstalled();
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const announcements = [
    {
      icon: MapPin,
      text: "20-Min Delivery in Samastipur",
      href: null,
      isExternal: false
    },
    {
      icon: Truck,
      text: "Pan-India in 3–5 days",
      href: null,
      isExternal: false
    },
    {
      icon: Package,
      text: "Track Order",
      href: "/account",
      isExternal: false
    },
    {
      icon: Store,
      text: "Visit Our Store",
      href: "/our-store",
      isExternal: false
    },
    {
      icon: MessageCircle,
      text: "Help on WhatsApp",
      href: "https://wa.me/916203909946",
      isExternal: true
    },
  ];

  // Smoothly auto-rotate announcements on mobile screens
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveMobileIdx((prev) => (prev + 1) % announcements.length);
        setIsAnimating(false);
      }, 350);
    }, 3500);
    return () => clearInterval(timer);
  }, [announcements.length]);

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

  const currentMobileItem = announcements[activeMobileIdx];
  const CurrentMobileIcon = currentMobileItem.icon;

  return (
    <div className="bg-[#52111C] text-[#FAF7F0] text-[11px] sm:text-xs py-1.5 px-3 border-b border-[#B08A3C]/25 select-none z-50 relative font-sans font-medium tracking-wide">
      <div className="max-w-7xl mx-auto flex items-center justify-center">

        {/* ── DESKTOP VIEW (UNIFORM ICONS & TYPOGRAPHY) ── */}
        <div className="hidden sm:flex items-center justify-center gap-3.5 text-center">
          {announcements.map((item, idx) => {
            const IconComponent = item.icon;

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="w-1 h-1 rounded-full bg-[#B08A3C]/70 shrink-0" />
                )}

                {item.href ? (
                  item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-[#D4B870] transition-colors underline-offset-2 hover:underline"
                    >
                      <IconComponent size={13} className="text-[#D4B870] shrink-0" />
                      <span>{item.text}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 hover:text-[#D4B870] transition-colors underline-offset-2 hover:underline"
                    >
                      <IconComponent size={13} className="text-[#D4B870] shrink-0" />
                      <span>{item.text}</span>
                    </Link>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <IconComponent size={13} className="text-[#D4B870] shrink-0" />
                    <span>{item.text}</span>
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── MOBILE VIEW (ROTATING ICON + SMOOTH SLIDE-FADE TICKER) ── */}
        <div className="sm:hidden flex items-center justify-between w-full gap-2">
          <div className="flex-1 min-w-0 overflow-hidden h-5 flex items-center relative">
            <div
              className={`w-full transition-all duration-350 ease-out transform ${
                isAnimating
                  ? '-translate-y-2 opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <CurrentMobileIcon size={13} className="text-[#D4B870] shrink-0" />

                {currentMobileItem.href ? (
                  currentMobileItem.isExternal ? (
                    <a
                      href={currentMobileItem.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4B870] hover:underline underline-offset-2 truncate text-[11px] font-medium transition-colors"
                    >
                      {currentMobileItem.text}
                    </a>
                  ) : (
                    <Link
                      href={currentMobileItem.href}
                      className="hover:text-[#D4B870] hover:underline underline-offset-2 truncate text-[11px] font-medium transition-colors"
                    >
                      {currentMobileItem.text}
                    </Link>
                  )
                ) : (
                  <span className="truncate text-[11px] font-medium text-[#FAF7F0]">
                    {currentMobileItem.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isPwaInstalled && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1 h-1 rounded-full bg-[#B08A3C]" />
              <button
                onClick={handlePwaInstall}
                className="inline-flex items-center gap-1 bg-[#FAF7F0]/15 hover:bg-[#FAF7F0]/25 text-[#D4B870] hover:text-white px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border border-[#B08A3C]/40 active:scale-95 shrink-0"
                title="Install Mobile App"
              >
                <Smartphone size={11} className="text-[#D4B870]" />
                <span>Install App</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
