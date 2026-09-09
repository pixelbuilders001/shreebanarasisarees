"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { DbHeroBanner } from '../data/supabase';
import {
  getValidCachedHeroBanners,
  isCacheFresh,
  syncHeroBanners,
  seedDexieIfEmpty,
  subscribeToHeroBannerUpdates,
  checkForSupabaseUpdatesAndSync,
} from '../lib/heroBannerCache';

export interface UseHeroBannersResult {
  banners: DbHeroBanner[];
  isLoading: boolean;
  isFromCache: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing hero banners with Dexie.js + IndexedDB caching.
 *
 * Cache-First Architecture with updated_at change detection:
 * 1. Checks IndexedDB on mount.
 * 2. If cached banners exist: displays them instantly (zero wait time).
 * 3. In background: inspects latest updated_at from Supabase.
 *    If an admin made changes (e.g. toggled is_active, edited banners),
 *    immediately synchronizes fresh data into IndexedDB and updates the UI.
 * 4. Deduplicates requests across StrictMode, remounts, and fast page navigation.
 * 5. Re-checks updated_at when the browser tab regains focus or visibility.
 * 6. Offline safe: gracefully uses cached banners if network is disconnected.
 */
export function useHeroBanners(initialBanners?: DbHeroBanner[]): UseHeroBannersResult {
  const [banners, setBanners] = useState<DbHeroBanner[]>(initialBanners ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialBanners || initialBanners.length === 0);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const initialBannersRef = useRef(initialBanners);
  initialBannersRef.current = initialBanners;

  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to updates from background synchronization
    const unsubscribe = subscribeToHeroBannerUpdates((updatedBanners) => {
      if (isMounted) {
        setBanners(updatedBanners);
        setIsLoading(false);
        setIsFromCache(false);
      }
    });

    // 2. Cache-first resolution with updated_at detection
    const loadBanners = async () => {
      try {
        const cached = await getValidCachedHeroBanners();

        if (cached && cached.length > 0) {
          // Instant display from IndexedDB cache
          if (isMounted) {
            setBanners(cached);
            setIsLoading(false);
            setIsFromCache(true);
          }

          // Check if Supabase has newer updated_at in the background
          checkForSupabaseUpdatesAndSync().catch(() => {});
        } else {
          // No cached banners exist in IndexedDB yet
          const initBanners = initialBannersRef.current;
          if (initBanners && initBanners.length > 0) {
            // Seed Dexie with SSR-provided banners
            await seedDexieIfEmpty(initBanners);
            if (isMounted) {
              setBanners(initBanners);
              setIsLoading(false);
            }
            // Check in background if server data is already older than Supabase
            checkForSupabaseUpdatesAndSync().catch(() => {});
          } else {
            // Fetch from Supabase, save to Dexie, and render
            const freshData = await syncHeroBanners({ force: true });
            if (isMounted) {
              setBanners(freshData);
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        console.warn('[useHeroBanners] Error during cache-first resolution:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBanners();

    // 3. Re-check on tab focus / visibility change (e.g. returning from admin tab)
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkForSupabaseUpdatesAndSync().catch(() => {});
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    return () => {
      isMounted = false;
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const freshData = await syncHeroBanners({ force: true });
      setBanners(freshData);
      setIsFromCache(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    banners,
    isLoading,
    isFromCache,
    refresh,
  };
}
