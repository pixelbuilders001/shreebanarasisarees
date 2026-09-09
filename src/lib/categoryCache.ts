import { supabase, DbCategory } from '../data/supabase';
import { getDb, LocalCategory, ShreeBanarasiDatabase } from './db';

/**
 * Cache TTL: 10 minutes (configurable in one place)
 */
export const CATEGORY_CACHE_TTL = 10 * 60 * 1000;

export const CATEGORIES_META_KEY = 'categories_meta';

/**
 * Filters categories to only include those where status === 'active',
 * ordered by sort_order ascending.
 */
export function filterAndSortValidCategories(categories: DbCategory[]): DbCategory[] {
  return categories
    .filter((c) => c.status === 'active')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/**
 * Fetch fresh categories from the existing Supabase table.
 * Supabase is the single source of truth.
 */
export async function fetchCategoriesFromSupabase(): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }
  return (data || []) as DbCategory[];
}

/**
 * Reconcile fresh Supabase categories into IndexedDB using updated_at.
 * Supabase always wins in case of conflicts:
 * - Newly created categories are added.
 * - Changed categories are updated.
 * - Deleted categories (missing from Supabase) are removed.
 * - Changed status, ordering, and image URLs are reflected.
 * - Stores only image_url metadata (zero image Blobs).
 */
export async function reconcileCategoriesInDexie(
  db: ShreeBanarasiDatabase,
  freshCategories: DbCategory[]
): Promise<void> {
  await db.transaction('rw', db.categories, db.cacheMeta, async () => {
    const cachedList = await db.categories.toArray();
    const cachedMap = new Map(cachedList.map((c) => [c.id, c]));
    const freshIds = new Set(freshCategories.map((c) => c.id));
    const nowTimestamp = Date.now();

    // 1. Remove deleted categories (present in IndexedDB but removed from Supabase)
    const toDelete = cachedList.filter((c) => !freshIds.has(c.id)).map((c) => c.id);
    if (toDelete.length > 0) {
      await db.categories.bulkDelete(toDelete);
    }

    // 2. Add or update fresh categories
    const toPut: LocalCategory[] = freshCategories.map((fresh) => {
      const cached = cachedMap.get(fresh.id);
      const isModified =
        !cached ||
        cached.updated_at !== fresh.updated_at ||
        cached.status !== fresh.status ||
        cached.sort_order !== fresh.sort_order ||
        cached.name !== fresh.name ||
        cached.slug !== fresh.slug ||
        cached.description !== fresh.description ||
        cached.image_url !== fresh.image_url ||
        cached.category_id !== fresh.category_id;

      return {
        ...fresh,
        cachedAt: isModified ? nowTimestamp : (cached?.cachedAt ?? nowTimestamp),
        lastSyncAt: nowTimestamp,
      };
    });

    if (toPut.length > 0) {
      await db.categories.bulkPut(toPut);
    }

    // 3. Update table sync metadata including latest updated_at
    const latestUpdatedAt = freshCategories.reduce<string | null>((max, c) => {
      if (!c.updated_at) return max;
      if (!max) return c.updated_at;
      return c.updated_at > max ? c.updated_at : max;
    }, null);

    await db.cacheMeta.put({
      key: CATEGORIES_META_KEY,
      lastSyncAt: nowTimestamp,
      latestUpdatedAt,
      count: freshCategories.length,
    });

    // 4. Update fast synchronous cache for 0ms initial render on subsequent visits
    try {
      if (typeof window !== 'undefined') {
        const valid = filterAndSortValidCategories(freshCategories);
        localStorage.setItem('sbs_categories_cache', JSON.stringify(valid));
      }
    } catch {}
  });
}

/**
 * Seed Dexie cache if empty using SSR-provided initial categories.
 */
export async function seedCategoryDexieIfEmpty(initialCategories: DbCategory[]): Promise<void> {
  const db = getDb();
  if (!db || !initialCategories || initialCategories.length === 0) return;

  try {
    const count = await db.categories.count();
    if (count === 0) {
      await reconcileCategoriesInDexie(db, initialCategories);
    }
  } catch (err) {
    console.warn('[categoryCache] Error seeding Dexie from initial categories:', err);
  }
}

/**
 * Get valid active categories from Dexie cache.
 * Returns empty array if not in browser or if no valid categories exist.
 */
export async function getValidCachedCategories(): Promise<DbCategory[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const cached = await db.categories.toArray();
    return filterAndSortValidCategories(cached);
  } catch (err) {
    console.warn('[categoryCache] Error reading categories from IndexedDB:', err);
    return [];
  }
}

/**
 * Check if the category cache in IndexedDB is fresh according to CATEGORY_CACHE_TTL.
 */
export async function isCategoryCacheFresh(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const meta = await db.cacheMeta.get(CATEGORIES_META_KEY);
    if (!meta) return false;
    return Date.now() - meta.lastSyncAt < CATEGORY_CACHE_TTL;
  } catch {
    return false;
  }
}

// In-flight sync promise for deduplication
let inFlightSyncPromise: Promise<DbCategory[]> | null = null;

// Subscribers for cache updates
type CategorySubscriber = (categories: DbCategory[]) => void;
const subscribers = new Set<CategorySubscriber>();

export function subscribeToCategoryUpdates(callback: CategorySubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(categories: DbCategory[]) {
  subscribers.forEach((cb) => {
    try {
      cb(categories);
    } catch (err) {
      console.error('[categoryCache] Error in subscriber callback:', err);
    }
  });
}

/**
 * Single coordinated category fetch/sync operation.
 * Prevents duplicate requests from React re-renders, Strict Mode, navigation, or component remounts.
 *
 * Behavior:
 * 1. Returns existing in-flight sync if one is currently active.
 * 2. If !force and cache is fresh (< 10 minutes), returns cached data without hitting Supabase.
 * 3. Otherwise, fetches fresh data from Supabase, updates Dexie, notifies subscribers, and returns valid active categories.
 * 4. If offline or network error occurs, falls back gracefully to cached categories without error.
 */
export async function syncCategories(options: { force?: boolean } = {}): Promise<DbCategory[]> {
  if (typeof window === 'undefined') {
    // SSR fallback: direct fetch
    try {
      const fresh = await fetchCategoriesFromSupabase();
      return filterAndSortValidCategories(fresh);
    } catch {
      return [];
    }
  }

  const db = getDb();
  if (!db) {
    try {
      const fresh = await fetchCategoriesFromSupabase();
      return filterAndSortValidCategories(fresh);
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
    const fresh = await isCategoryCacheFresh();
    if (fresh) {
      const cached = await getValidCachedCategories();
      if (cached.length > 0) {
        return cached;
      }
    }
  }

  inFlightSyncPromise = (async () => {
    try {
      const fresh = await fetchCategoriesFromSupabase();
      await reconcileCategoriesInDexie(db, fresh);
      const valid = filterAndSortValidCategories(fresh);
      notifySubscribers(valid);
      return valid;
    } catch (err) {
      console.warn(
        '[categoryCache] Supabase sync failed (offline or network error). Falling back to cached categories:',
        err
      );
      const cached = await getValidCachedCategories();
      return cached;
    } finally {
      inFlightSyncPromise = null;
    }
  })();

  return inFlightSyncPromise;
}

/**
 * Query only the latest updated_at timestamp and exact category count from Supabase.
 * Lightweight request (a few bytes) to verify if changes occurred.
 */
export async function getLatestSupabaseCategoryUpdatedAtAndCount(): Promise<{
  latestUpdatedAt: string | null;
  count: number;
} | null> {
  try {
    const { data, count, error } = await supabase
      .from('categories')
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
    console.warn('[categoryCache] Error fetching latest updated_at from Supabase:', err);
    return null;
  }
}

let inFlightCheckPromise: Promise<DbCategory[] | null> | null = null;

/**
 * Checks if Supabase has newer changes using the `updated_at` column.
 * If Supabase's latest updated_at differs from what's stored in IndexedDB
 * (e.g. admin toggled status, edited category, created category, or deleted a category),
 * it immediately triggers syncCategories({ force: true }) to refresh the UI and Dexie.
 */
export async function checkForCategorySupabaseUpdatesAndSync(
  force: boolean = false
): Promise<DbCategory[] | null> {
  if (typeof window === 'undefined') return null;

  const db = getDb();
  if (!db) return null;

  if (inFlightCheckPromise) {
    return inFlightCheckPromise;
  }

  inFlightCheckPromise = (async () => {
    try {
      const meta = await db.cacheMeta.get(CATEGORIES_META_KEY);

      if (!meta || force) {
        return await syncCategories({ force: true });
      }

      const remote = await getLatestSupabaseCategoryUpdatedAtAndCount();
      if (!remote) {
        // Offline or network error - gracefully keep existing cached categories
        return null;
      }

      // Check if updated_at changed or total count changed (e.g. status changed, category deleted/added)
      const hasChanged =
        meta.latestUpdatedAt !== remote.latestUpdatedAt ||
        meta.count !== remote.count;

      if (hasChanged) {
        return await syncCategories({ force: true });
      } else {
        // Data is identical! Update lastSyncAt to prevent repeated checks
        await db.cacheMeta.put({
          ...meta,
          lastSyncAt: Date.now(),
        });
        return null;
      }
    } catch (err) {
      console.warn('[categoryCache] Error in checkForCategorySupabaseUpdatesAndSync:', err);
      return null;
    } finally {
      inFlightCheckPromise = null;
    }
  })();

  return inFlightCheckPromise;
}
