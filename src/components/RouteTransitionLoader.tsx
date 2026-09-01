"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const LOADER_ICONS = [
  "/loader%20icons/loader_1.png",
  "/loader%20icons/loader_2.png",
  "/loader%20icons/loader_3.png",
  "/loader%20icons/loader_4.png",
  "/loader%20icons/loader_5.png"
];

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Stop loading when pathname or search parameters change
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Handle smooth fade-in / fade-out animation timings
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setIsVisible(true);
    } else {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Safety fallback: automatically dismiss loader if navigation hangs for over 5 seconds
  useEffect(() => {
    if (!isLoading) return;
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  // Intercept click events on internal links and patch history pushState / replaceState
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip new tabs, downloads, or keyboard modifiers
      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Skip anchor links, javascript, tel, mailto, whatsapp
      if (
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:')
      ) {
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Ignore external origin
        if (targetUrl.origin !== currentUrl.origin) return;

        // Ignore exact same URL (pathname + search)
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        setIsLoading(true);
      } catch (err) {
        // Ignore invalid URLs
      }
    };

    // Patch history.pushState & replaceState for router.push/replace calls
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const url = args[2];
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.href);
          const currentUrl = new URL(window.location.href);
          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            setTimeout(() => {
              setIsLoading(true);
              setIsVisible(true);
            }, 0);
          }
        } catch (e) { }
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      const url = args[2];
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.href);
          const currentUrl = new URL(window.location.href);
          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            setTimeout(() => {
              setIsLoading(true);
              setIsVisible(true);
            }, 0);
          }
        } catch (e) { }
      }
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => {
      setTimeout(() => setIsLoading(true), 0);
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  if (!isVisible && !isLoading) return null;

  // Duplicate 5 icons for seamless loop
  const marqueeList = [...LOADER_ICONS, ...LOADER_ICONS, ...LOADER_ICONS, ...LOADER_ICONS];

  return (
    <div
      className={`fixed inset-0 z-[99999] w-screen h-screen overflow-hidden flex flex-col items-center justify-center select-none px-4 transition-all duration-300 ease-in-out bg-[#FAF7F0]/70 backdrop-blur-xl transform-gpu ${isLoading ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'
        }`}
      style={{
        WebkitBackdropFilter: 'blur(24px) brightness(0.97)',
        backdropFilter: 'blur(24px) brightness(0.97)'
      }}
    >
      {/* 1. Brand Logo Above PNG Icons Track */}
      <div className="relative z-10 mb-5 sm:mb-7">
        <img
          src="/brand_logo.webp"
          alt="Shree Banarasi Sarees Logo"
          className="h-12 sm:h-16 md:h-20 w-auto object-contain"
        />
      </div>

      {/* 2. Ultra-Smooth Hardware-Accelerated Marquee Track */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-2xl md:max-w-3xl mx-auto overflow-hidden py-3 sm:py-5 transform-gpu">
        <div className="flex items-center gap-6 sm:gap-10 md:gap-14 animate-marquee-loader w-max transform-gpu">
          {marqueeList.map((src, idx) => (
            <div
              key={idx}
              className="shrink-0 flex items-center justify-center transform-gpu"
            >
              <img
                src={src}
                alt="Loader Icon"
                className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain transform-gpu"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sleek Gold Zari Thread Pulse Accent Line */}
      <div className="relative z-10 mt-3 sm:mt-4 w-36 sm:w-60 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#B08A3C]/70 to-transparent shadow-xs" />
    </div>
  );
}
