"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { DbHeroBanner } from '../data/supabase';
import {
  getValidCachedHeroBanners,
  isCacheFresh,
  syncHeroBanners,
  seedDexieIfEmpty,
  subscribeToHeroBannerUpdates,
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
 * Cache-First Architecture:
 * 1. Checks IndexedDB on mount.
 * 2. If cached banners exist: displays them instantly (zero wait time).
 * 3. If cache is stale (> 10 mins): triggers background refresh from Supabase without blocking UI.
 * 4. If cache is fresh (< 10 mins): no network request is made.
 * 5. If no cache exists: fetches from Supabase, saves to Dexie, and displays.
 * 6. Deduplicates requests across StrictMode, remounts, and fast page navigation.
 * 7. Offline safe: gracefully uses cached banners if network is disconnected.
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

    // 2. Cache-first resolution
    const loadBanners = async () => {
      try {
        const cached = await getValidCachedHeroBanners();
        const fresh = await isCacheFresh();

        if (cached && cached.length > 0) {
          // Instant display from IndexedDB cache
          if (isMounted) {
            setBanners(cached);
            setIsLoading(false);
            setIsFromCache(true);
          }

          // If cache is older than TTL, perform background refresh from Supabase
          if (!fresh) {
            syncHeroBanners().catch(() => {});
          }
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

    return () => {
      isMounted = false;
      unsubscribe();
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
