import Dexie, { type EntityTable } from 'dexie';
import { DbHeroBanner, DbCategory } from '../data/supabase';

/**
 * Local hero banner record stored in IndexedDB.
 * Mirrors existing Supabase hero_banners fields with client-only metadata.
 * Note: Never store image Blobs here; only image_url metadata.
 */
export interface LocalHeroBanner extends DbHeroBanner {
  cachedAt?: number;
  lastSyncAt?: number;
}

/**
 * Local category record stored in IndexedDB.
 * Mirrors existing Supabase categories fields with client-only metadata.
 * Note: Never store image Blobs here; only image_url metadata.
 */
export interface LocalCategory extends DbCategory {
  cachedAt?: number;
  lastSyncAt?: number;
}

/**
 * Cache metadata table in IndexedDB to track table-level sync timestamps.
 */
export interface CacheMetadata {
  key: string;
  lastSyncAt: number;
  latestUpdatedAt?: string | null;
  count?: number;
}

export class ShreeBanarasiDatabase extends Dexie {
  heroBanners!: EntityTable<LocalHeroBanner, 'id'>;
  categories!: EntityTable<LocalCategory, 'id'>;
  cacheMeta!: EntityTable<CacheMetadata, 'key'>;

  constructor() {
    super('ShreeBanarasiDB');
    this.version(1).stores({
      heroBanners: 'id, sort_order, is_active, updated_at',
      cacheMeta: 'key'
    });
    this.version(2).stores({
      heroBanners: 'id, sort_order, is_active, updated_at',
      categories: 'id, category_id, slug, status, sort_order, updated_at',
      cacheMeta: 'key'
    });
  }
}

// Singleton database instance, safe for SSR (only instantiated in browser)
let dbInstance: ShreeBanarasiDatabase | null = null;

/**
 * Get or initialize the Dexie database singleton.
 * Returns null if executed during Server-Side Rendering (SSR).
 */
export function getDb(): ShreeBanarasiDatabase | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!dbInstance) {
    dbInstance = new ShreeBanarasiDatabase();
  }
  return dbInstance;
}
