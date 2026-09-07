"use client";

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname or search parameters settle, complete the progress bar
  useEffect(() => {
    if (isLoading || visible) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      // Rush to 100%
      setProgress(100);

      // Fade out and reset
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setIsLoading(false);
        setTimeout(() => setProgress(0), 200);
      }, 250);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [pathname, searchParams]);

  // Handle progressive bar simulation when loading starts
  useEffect(() => {
    if (isLoading) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      setVisible(true);
      setProgress(20);

      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + Math.random() * 15 + 5;
          if (prev < 85) return prev + Math.random() * 5 + 2;
          return prev;
        });
      }, 200);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isLoading]);

  // Safety fallback: dismiss progress bar if navigation hangs for over 5 seconds
  useEffect(() => {
    if (!isLoading) return;
    const safetyTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setIsLoading(false);
        setTimeout(() => setProgress(0), 200);
      }, 200);
    }, 5000);
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  // Intercept link clicks and monkey-patch history
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

        // Ignore transitions to or within /account routes
        if (targetUrl.pathname.startsWith('/account') || currentUrl.pathname.startsWith('/account')) {
          return;
        }

        setIsLoading(true);
      } catch (err) {
        // Ignore invalid URLs
      }
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const url = args[2];
      if (url) {
        try {
          const targetUrl = new URL(url.toString(), window.location.href);
          const currentUrl = new URL(window.location.href);
          const isAccountTarget = targetUrl.pathname.startsWith('/account');
          const isAccountCurrent = currentUrl.pathname.startsWith('/account') || window.location.pathname.startsWith('/account');

          if (isAccountTarget || isAccountCurrent) {
            return originalPushState.apply(this, args);
          }

          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            setTimeout(() => {
              setIsLoading(true);
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
          const isAccountTarget = targetUrl.pathname.startsWith('/account');
          const isAccountCurrent = currentUrl.pathname.startsWith('/account') || window.location.pathname.startsWith('/account');

          if (isAccountTarget || isAccountCurrent) {
            return originalReplaceState.apply(this, args);
          }

          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            setTimeout(() => {
              setIsLoading(true);
            }, 0);
          }
        } catch (e) { }
      }
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => {
      try {
        if (window.location.pathname.startsWith('/account')) {
          return;
        }
      } catch (e) {}
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

  // Completely disable while inside /account
  if (pathname.startsWith('/account')) return null;
  if (!visible && !isLoading && progress === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <div
        className="h-[2.5px] bg-gradient-to-r from-[#6B1725] via-[#B08A3C] to-[#E6CA65] shadow-[0_0_8px_#B08A3C,0_0_4px_#FAF7F0] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
