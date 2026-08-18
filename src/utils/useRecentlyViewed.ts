"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sbs_recently_viewed';
const MAX_ITEMS = 8;

/**
 * Returns the current list of recently viewed product IDs (most recent first)
 * and a function to record a new view.
 */
export function useRecentlyViewed() {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  // Hydrate from localStorage once on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setViewedIds(parsed);
        }
      }
    } catch {
      // Silently ignore parse errors
    }
  }, []);

  /**
   * Save a product ID to the recently viewed list.
   * Moves to front if already present; trims to MAX_ITEMS.
   */
  const recordView = useCallback((productId: string) => {
    setViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Quota or security errors — silently skip persistence
      }
      return updated;
    });
  }, []);

  return { viewedIds, recordView };
}
