import { supabase, DbHeroBanner } from '../data/supabase';
import { getDb, LocalHeroBanner, ShreeBanarasiDatabase } from './db';

/**
 * Cache TTL: 10 minutes (configurable in one place)
 */
export const HERO_BANNER_CACHE_TTL = 10 * 60 * 1000;

export const HERO_BANNERS_META_KEY = 'hero_banners_meta';

/**
 * Filters banners based on active status and schedule windows (start_at, end_at),
 * sorted by sort_order ascending.
 *
 * Rules:
 * 1. is_active must be true.
 * 2. If start_at is set, now >= start_at.
 * 3. If end_at is set, now <= end_at.
 * 4. sort_order ascending.
 */
export function filterAndSortValidBanners(
  banners: DbHeroBanner[],
  now: string = new Date().toISOString()
): DbHeroBanner[] {
  return banners
    .filter((b) => {
      if (!b.is_active) return false;
      const afterStart = !b.start_at || now >= b.start_at;
      const beforeEnd = !b.end_at || now <= b.end_at;
      return afterStart && beforeEnd;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/**
 * Fetch fresh hero banners from the existing Supabase table.
 * Supabase is the single source of truth.
 */
export async function fetchHeroBannersFromSupabase(): Promise<DbHeroBanner[]> {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }
  return (data || []) as DbHeroBanner[];
}

/**
 * Reconcile fresh Supabase banners into IndexedDB using updated_at.
 * Supabase always wins in case of conflicts:
 * - Newly created banners are added.
 * - Changed banners are updated.
 * - Deleted banners (missing from Supabase) are removed.
 * - Updated active status, ordering, and scheduling are reflected.
 */
export async function reconcileBannersInDexie(
  db: ShreeBanarasiDatabase,
  freshBanners: DbHeroBanner[]
): Promise<void> {
  await db.transaction('rw', db.heroBanners, db.cacheMeta, async () => {
    const cachedList = await db.heroBanners.toArray();
    const cachedMap = new Map(cachedList.map((b) => [b.id, b]));
    const freshIds = new Set(freshBanners.map((b) => b.id));
    const nowTimestamp = Date.now();

    // 1. Remove deleted banners (present in IndexedDB but removed from Supabase)
    const toDelete = cachedList.filter((b) => !freshIds.has(b.id)).map((b) => b.id);
    if (toDelete.length > 0) {
      await db.heroBanners.bulkDelete(toDelete);
    }

    // 2. Add or update fresh banners
    const toPut: LocalHeroBanner[] = freshBanners.map((fresh) => {
      const cached = cachedMap.get(fresh.id);
      const isModified =
        !cached ||
        cached.updated_at !== fresh.updated_at ||
        cached.is_active !== fresh.is_active ||
        cached.sort_order !== fresh.sort_order ||
        cached.image_url !== fresh.image_url ||
        cached.title !== fresh.title ||
        cached.subtitle !== fresh.subtitle ||
        cached.eyebrow !== fresh.eyebrow ||
        cached.button_link !== fresh.button_link ||
        cached.button_text !== fresh.button_text ||
        cached.start_at !== fresh.start_at ||
        cached.end_at !== fresh.end_at;

      return {
        ...fresh,
        cachedAt: isModified ? nowTimestamp : (cached?.cachedAt ?? nowTimestamp),
        lastSyncAt: nowTimestamp,
      };
    });

    if (toPut.length > 0) {
      await db.heroBanners.bulkPut(toPut);
    }

    // 3. Update table sync metadata including latest updated_at
    const latestUpdatedAt = freshBanners.reduce<string | null>((max, b) => {
      if (!b.updated_at) return max;
      if (!max) return b.updated_at;
      return b.updated_at > max ? b.updated_at : max;
    }, null);

    await db.cacheMeta.put({
      key: HERO_BANNERS_META_KEY,
      lastSyncAt: nowTimestamp,
      latestUpdatedAt,
      count: freshBanners.length,
    });
  });
}

/**
 * Seed Dexie cache if empty using SSR-provided initial banners.
 */
export async function seedDexieIfEmpty(initialBanners: DbHeroBanner[]): Promise<void> {
  const db = getDb();
  if (!db || !initialBanners || initialBanners.length === 0) return;

  try {
    const count = await db.heroBanners.count();
    if (count === 0) {
      await reconcileBannersInDexie(db, initialBanners);
    }
  } catch (err) {
    console.warn('[heroBannerCache] Error seeding Dexie from initial banners:', err);
  }
}

/**
 * Get valid cached hero banners from Dexie.
 * Returns empty array if not in browser or if no valid banners exist.
 */
export async function getValidCachedHeroBanners(
  now: string = new Date().toISOString()
): Promise<DbHeroBanner[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const cached = await db.heroBanners.toArray();
    return filterAndSortValidBanners(cached, now);
  } catch (err) {
    console.warn('[heroBannerCache] Error reading from IndexedDB:', err);
    return [];
  }
}

/**
 * Check if the current cache in IndexedDB is fresh according to HERO_BANNER_CACHE_TTL.
 */
export async function isCacheFresh(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const meta = await db.cacheMeta.get(HERO_BANNERS_META_KEY);
    if (!meta) return false;
    return Date.now() - meta.lastSyncAt < HERO_BANNER_CACHE_TTL;
  } catch {
    return false;
  }
}

// In-flight sync promise for deduplication
let inFlightSyncPromise: Promise<DbHeroBanner[]> | null = null;

// Subscribers for cache updates
type CacheSubscriber = (banners: DbHeroBanner[]) => void;
const subscribers = new Set<CacheSubscriber>();

export function subscribeToHeroBannerUpdates(callback: CacheSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(banners: DbHeroBanner[]) {
  subscribers.forEach((cb) => {
    try {
      cb(banners);
    } catch (err) {
      console.error('[heroBannerCache] Error in subscriber callback:', err);
    }
  });
}

/**
 * Single coordinated hero-banner fetch/sync operation.
 * Prevents duplicate requests from React re-renders, Strict Mode, navigation, or component remounts.
 *
 * Behavior:
 * 1. Returns existing in-flight sync if one is currently active.
 * 2. If !force and cache is fresh (< 10 minutes), returns cached data without hitting Supabase.
 * 3. Otherwise, fetches fresh data from Supabase, updates Dexie, notifies subscribers, and returns fresh valid banners.
 * 4. If offline or network error occurs, falls back gracefully to cached banners without error.
 */
export async function syncHeroBanners(options: { force?: boolean } = {}): Promise<DbHeroBanner[]> {
  if (typeof window === 'undefined') {
    // SSR fallback: direct fetch
    try {
      const fresh = await fetchHeroBannersFromSupabase();
      return filterAndSortValidBanners(fresh);
    } catch {
      return [];
    }
  }

  const db = getDb();
  if (!db) {
    try {
      const fresh = await fetchHeroBannersFromSupabase();
      return filterAndSortValidBanners(fresh);
    } catch {
      return [];
    }
  }

  // Deduplicate: If a sync is already running, reuse the pending promise
  if (inFlightSyncPromise) {
    return inFlightSyncPromise;
  }

  // Check TTL if not a forced sync
  if (!options.force) {
    const fresh = await isCacheFresh();
    if (fresh) {
      const cached = await getValidCachedHeroBanners();
      if (cached.length > 0) {
        return cached;
      }
    }
  }

  inFlightSyncPromise = (async () => {
    try {
      const fresh = await fetchHeroBannersFromSupabase();
      await reconcileBannersInDexie(db, fresh);
      const valid = filterAndSortValidBanners(fresh);
      notifySubscribers(valid);
      return valid;
    } catch (err) {
      console.warn(
        '[heroBannerCache] Supabase sync failed (offline or network error). Falling back to cached banners:',
        err
      );
      const cached = await getValidCachedHeroBanners();
      return cached;
    } finally {
      inFlightSyncPromise = null;
    }
  })();

  return inFlightSyncPromise;
}

/**
 * Query only the latest updated_at timestamp and exact banner count from Supabase.
 * Extremely lightweight request (a few bytes) to verify if data has changed.
 */
export async function getLatestSupabaseUpdatedAtAndCount(): Promise<{
  latestUpdatedAt: string | null;
  count: number;
} | null> {
  try {
    const { data, count, error } = await supabase
      .from('hero_banners')
      .select('updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data) {
      return null;
    }

    return {
      latestUpdatedAt: data[0]?.updated_at ?? null,
      count: count ?? 0,
    };
  } catch (err) {
    console.warn('[heroBannerCache] Error fetching latest updated_at from Supabase:', err);
    return null;
  }
}

let inFlightCheckPromise: Promise<DbHeroBanner[] | null> | null = null;

/**
 * Checks if Supabase has newer changes using the `updated_at` column.
 * If Supabase's latest updated_at differs from what's stored in IndexedDB
 * (e.g. admin toggled is_active, edited details, created banner, or deleted a banner),
 * it immediately triggers syncHeroBanners({ force: true }) to refresh the UI and Dexie.
 */
export async function checkForSupabaseUpdatesAndSync(force: boolean = false): Promise<DbHeroBanner[] | null> {
  if (typeof window === 'undefined') return null;

  const db = getDb();
  if (!db) return null;

  if (inFlightCheckPromise) {
    return inFlightCheckPromise;
  }

  inFlightCheckPromise = (async () => {
    try {
      const meta = await db.cacheMeta.get(HERO_BANNERS_META_KEY);

      if (!meta || force) {
        return await syncHeroBanners({ force: true });
      }

      const remote = await getLatestSupabaseUpdatedAtAndCount();
      if (!remote) {
        // Offline or network error - gracefully keep existing cached banners
        return null;
      }

      // Check if updated_at changed or total count changed (e.g. is_active toggled, banner deleted/added)
      const hasChanged =
        meta.latestUpdatedAt !== remote.latestUpdatedAt ||
        meta.count !== remote.count;

      if (hasChanged) {
        return await syncHeroBanners({ force: true });
      } else {
        // Data is identical! Update lastSyncAt to prevent repeated checks
        await db.cacheMeta.put({
          ...meta,
          lastSyncAt: Date.now(),
        });
        return null;
      }
    } catch (err) {
      console.warn('[heroBannerCache] Error in checkForSupabaseUpdatesAndSync:', err);
      return null;
    } finally {
      inFlightCheckPromise = null;
    }
  })();

  return inFlightCheckPromise;
}

