"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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
            setIsLoading(true);
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
            setIsLoading(true);
          }
        } catch (e) { }
      }
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => {
      setIsLoading(true);
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

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FFF9F0]/80 backdrop-blur-md transition-all duration-300 ease-in-out select-none ${isLoading ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'
        }`}
    >
      {/* Brand Icon / Logo Loader with gold & maroon animation */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Outer glowing gold pulse ring */}
        <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-[#C9A45C]/40 animate-ping opacity-75" />

        {/* Inner spinning border */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-transparent border-t-[#801F32] border-r-[#C9A45C] animate-spin" />

        {/* Center brand logo */}
        <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFF9F0] border-2 border-[#C9A45C]/40 flex items-center justify-center shadow-lg overflow-hidden p-1">
          <img
            src="/brand_logo.webp"
            alt="Shree Banarasi Sarees Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>



      {/* Premium Loading Progress Bar */}
      {/* <div className="w-36 sm:w-44 h-[2.5px] bg-[#F7EEDF] rounded-full mt-5 overflow-hidden relative shadow-inner">
        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-[#801F32] via-[#C9A45C] to-[#801F32] animate-loading-progress" />
      </div> */}
    </div>
  );
}
