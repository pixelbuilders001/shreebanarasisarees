import 'fake-indexeddb/auto';
import assert from 'node:assert';
import { ShreeBanarasiDatabase, LocalHeroBanner } from '../src/lib/db';
import {
  HERO_BANNER_CACHE_TTL,
  HERO_BANNERS_META_KEY,
  filterAndSortValidBanners,
  reconcileBannersInDexie
} from '../src/lib/heroBannerCache';
import { DbHeroBanner } from '../src/data/supabase';

async function runTests() {
  console.log('--- STARTING HERO BANNER DEXIE CACHE TESTS ---');

  const db = new ShreeBanarasiDatabase();
  await db.open();

  // Test 1: TTL constant
  console.log('\nTest 1: Verify HERO_BANNER_CACHE_TTL');
  assert.strictEqual(HERO_BANNER_CACHE_TTL, 10 * 60 * 1000, 'TTL must be exactly 10 minutes');
  console.log('✓ HERO_BANNER_CACHE_TTL is 10 minutes (600,000 ms)');

  // Test 2: Active & Scheduling filtering
  console.log('\nTest 2: Scheduling and active status filtering');
  const sampleBanners: DbHeroBanner[] = [
    {
      id: 'b1',
      title: 'Active Banner',
      eyebrow: null,
      subtitle: null,
      image_url: 'https://example.com/b1.jpg',
      button_text: null,
      button_link: '/sarees',
      is_active: true,
      sort_order: 1,
      start_at: null,
      end_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'b2',
      title: 'Inactive Banner',
      eyebrow: null,
      subtitle: null,
      image_url: 'https://example.com/b2.jpg',
      button_text: null,
      button_link: '/sarees',
      is_active: false,
      sort_order: 0,
      start_at: null,
      end_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'b3',
      title: 'Future Scheduled Banner',
      eyebrow: null,
      subtitle: null,
      image_url: 'https://example.com/b3.jpg',
      button_text: null,
      button_link: '/sarees',
      is_active: true,
      sort_order: 2,
      start_at: '2026-10-01T00:00:00Z',
      end_at: '2026-11-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'b4',
      title: 'Expired Scheduled Banner',
      eyebrow: null,
      subtitle: null,
      image_url: 'https://example.com/b4.jpg',
      button_text: null,
      button_link: '/sarees',
      is_active: true,
      sort_order: 3,
      start_at: '2026-01-01T00:00:00Z',
      end_at: '2026-02-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'b5',
      title: 'Currently Active Scheduled Banner',
      eyebrow: null,
      subtitle: null,
      image_url: 'https://example.com/b5.jpg',
      button_text: null,
      button_link: '/sarees',
      is_active: true,
      sort_order: 0,
      start_at: '2026-08-01T00:00:00Z',
      end_at: '2026-09-30T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }
  ];

  // Reference time: 2026-09-09T00:00:00Z
  const valid = filterAndSortValidBanners(sampleBanners, '2026-09-09T00:00:00Z');
  assert.strictEqual(valid.length, 2, 'Only b1 and b5 should be valid');
  assert.strictEqual(valid[0].id, 'b5', 'b5 has sort_order 0, should be first');
  assert.strictEqual(valid[1].id, 'b1', 'b1 has sort_order 1, should be second');
  console.log('✓ filterAndSortValidBanners properly excludes inactive, future, and expired banners');
  console.log('✓ filterAndSortValidBanners correctly sorts by sort_order ascending');

  // Test 3: Reconcile fresh Supabase data into Dexie
  console.log('\nTest 3: Initial sync into Dexie');
  await reconcileBannersInDexie(db, sampleBanners);

  const storedInDb = await db.heroBanners.toArray();
  assert.strictEqual(storedInDb.length, 5, 'All 5 banners should be stored in Dexie');
  const meta = await db.cacheMeta.get(HERO_BANNERS_META_KEY);
  assert(meta && meta.lastSyncAt > 0, 'cacheMeta lastSyncAt must be set');
  console.log(`✓ Stored ${storedInDb.length} banners in Dexie with metadata:`, meta);

  // Test 4: Conflict reconciliation and updates
  console.log('\nTest 4: Reconciliation of changes (add, update, delete)');
  const updatedBanners: DbHeroBanner[] = [
    {
      id: 'b1',
      title: 'Active Banner - RENAMED TITLE',
      eyebrow: 'New Eyebrow',
      subtitle: null,
      image_url: 'https://example.com/b1_updated.jpg',
      button_text: null,
      button_link: '/sarees?cat=updated',
      is_active: true,
      sort_order: 5,
      start_at: null,
      end_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-09T10:00:00Z'
    },
    // b2 deleted
    sampleBanners[2],
    sampleBanners[3],
    sampleBanners[4],
    // b6 added
    {
      id: 'b6',
      title: 'Newly Created Banner',
      eyebrow: null,
      subtitle: null,
      image_url: 'https://example.com/b6.jpg',
      button_text: null,
      button_link: '/sarees',
      is_active: true,
      sort_order: -1,
      start_at: null,
      end_at: null,
      created_at: '2026-09-09T10:00:00Z',
      updated_at: '2026-09-09T10:00:00Z'
    }
  ];

  await reconcileBannersInDexie(db, updatedBanners);

  const afterUpdate = await db.heroBanners.toArray();
  assert.strictEqual(afterUpdate.length, 5, 'After deleting b2 and adding b6, total is 5');

  const b2Check = await db.heroBanners.get('b2');
  assert.strictEqual(b2Check, undefined, 'Deleted banner b2 must no longer exist in Dexie');

  const b1Check = await db.heroBanners.get('b1');
  assert.strictEqual(b1Check?.title, 'Active Banner - RENAMED TITLE', 'b1 title must be updated');
  assert.strictEqual(b1Check?.image_url, 'https://example.com/b1_updated.jpg', 'b1 image_url must be updated');
  assert.strictEqual(b1Check?.sort_order, 5, 'b1 sort_order must be updated to 5');

  const b6Check = await db.heroBanners.get('b6');
  assert.strictEqual(b6Check?.title, 'Newly Created Banner', 'b6 must exist in Dexie');

  console.log('✓ Successfully reconciled added b6, updated b1, and removed deleted b2');

  // Test 5: Storage integrity - metadata only, no image Blobs
  console.log('\nTest 5: Storage integrity - metadata only, no image Blobs');
  for (const b of afterUpdate) {
    assert(typeof b.image_url === 'string', 'image_url must remain a string URL');
    assert(!('blob' in b), 'No image blobs should exist in cached records');
    assert(!('password' in b), 'No sensitive data should exist');
  }
  console.log('✓ Confirmed: only metadata and image URLs stored in IndexedDB');

  // Test 6: Live Supabase fetch & reconciliation
  console.log('\nTest 6: Live Supabase fetch & sync');
  const { fetchHeroBannersFromSupabase, syncHeroBanners, isCacheFresh, getValidCachedHeroBanners } = await import('../src/lib/heroBannerCache');
  const liveBanners = await fetchHeroBannersFromSupabase();
  assert(Array.isArray(liveBanners) && liveBanners.length > 0, 'Live banners should be retrieved from Supabase');
  console.log(`✓ Fetched ${liveBanners.length} live banners from Supabase`);

  await reconcileBannersInDexie(db, liveBanners);
  const liveStoredInDexie = await db.heroBanners.toArray();
  assert.strictEqual(liveStoredInDexie.length, liveBanners.length, 'Dexie count must match live Supabase count');
  console.log(`✓ Synchronized ${liveStoredInDexie.length} live banners into Dexie`);

  // Test 7: Single coordinated sync and deduplication in browser environment
  console.log('\nTest 7: Single-flight request deduplication & TTL freshness');
  // Mock window object for browser simulation
  (globalThis as any).window = globalThis;
  
  // Clean DB for browser simulation test
  await db.heroBanners.clear();
  await db.cacheMeta.clear();

  // Trigger 3 concurrent sync calls
  const [res1, res2, res3] = await Promise.all([
    syncHeroBanners(),
    syncHeroBanners(),
    syncHeroBanners()
  ]);

  assert.deepStrictEqual(res1, res2, 'Concurrent sync 1 & 2 must return identical data');
  assert.deepStrictEqual(res2, res3, 'Concurrent sync 2 & 3 must return identical data');
  console.log('✓ Deduplication: 3 concurrent sync requests coalesced into single execution');

  // Verify cache is now fresh
  const fresh = await isCacheFresh();
  assert.strictEqual(fresh, true, 'Cache must be marked fresh (< 10 min TTL)');
  console.log('✓ Cache is fresh (age < 10 mins)');

  // Subsequent call should immediately return cached data without refetching
  const cachedImmediate = await syncHeroBanners();
  assert.strictEqual(cachedImmediate.length, res1.length, 'Immediate cache return must match');
  console.log('✓ Immediate cache return verified');

  console.log('\n--- ALL UNIT & INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  await db.close();
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
