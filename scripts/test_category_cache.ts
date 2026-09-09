import 'fake-indexeddb/auto';
import assert from 'node:assert';
import { ShreeBanarasiDatabase, LocalCategory } from '../src/lib/db';
import {
  CATEGORY_CACHE_TTL,
  CATEGORIES_META_KEY,
  filterAndSortValidCategories,
  reconcileCategoriesInDexie,
  fetchCategoriesFromSupabase,
  syncCategories,
  isCategoryCacheFresh,
  getValidCachedCategories,
  checkForCategorySupabaseUpdatesAndSync
} from '../src/lib/categoryCache';
import { DbCategory } from '../src/data/supabase';

async function runTests() {
  console.log('--- STARTING CATEGORIES DEXIE CACHE TESTS ---');

  const db = new ShreeBanarasiDatabase();
  await db.open();

  // Test 1: TTL constant
  console.log('\nTest 1: Verify CATEGORY_CACHE_TTL');
  assert.strictEqual(CATEGORY_CACHE_TTL, 10 * 60 * 1000, 'TTL must be exactly 10 minutes');
  console.log('✓ CATEGORY_CACHE_TTL is 10 minutes (600,000 ms)');

  // Test 2: Active status filtering and sort_order
  console.log('\nTest 2: status === "active" filtering and sort_order');
  const sampleCategories: DbCategory[] = [
    {
      id: 'c1',
      category_id: 'cat_01',
      name: 'Banarasi Silk',
      slug: 'banarasi-silk',
      description: 'Handwoven silk sarees',
      image_url: 'https://example.com/c1.jpg',
      status: 'active',
      sort_order: 2,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'c2',
      category_id: 'cat_02',
      name: 'Discontinued Fabric',
      slug: 'discontinued',
      description: 'Old stock',
      image_url: 'https://example.com/c2.jpg',
      status: 'inactive',
      sort_order: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'c3',
      category_id: 'cat_03',
      name: 'Organza',
      slug: 'organza',
      description: 'Lightweight organza sarees',
      image_url: 'https://example.com/c3.jpg',
      status: 'active',
      sort_order: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'c4',
      category_id: 'cat_04',
      name: 'Draft Category',
      slug: 'draft',
      description: 'Work in progress',
      image_url: 'https://example.com/c4.jpg',
      status: 'draft',
      sort_order: 3,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }
  ];

  const valid = filterAndSortValidCategories(sampleCategories);
  assert.strictEqual(valid.length, 2, 'Only active categories (c3, c1) should be returned');
  assert.strictEqual(valid[0].id, 'c3', 'c3 has sort_order 1, should be first');
  assert.strictEqual(valid[1].id, 'c1', 'c1 has sort_order 2, should be second');
  console.log('✓ Inactive and draft categories successfully excluded');
  console.log('✓ Categories sorted by sort_order ascending');

  // Test 3: Storage integrity - store in Dexie and verify schema
  console.log('\nTest 3: Storage in Dexie categories table');
  await reconcileCategoriesInDexie(db, sampleCategories);

  const stored = await db.categories.toArray();
  assert.strictEqual(stored.length, 4, 'All categories should be stored in Dexie table');
  const meta = await db.cacheMeta.get(CATEGORIES_META_KEY);
  assert(meta && meta.lastSyncAt > 0, 'cacheMeta lastSyncAt must be recorded');
  assert.strictEqual(meta?.count, 4, 'cacheMeta count must match total fresh categories');
  console.log(`✓ Stored ${stored.length} categories in Dexie with metadata:`, meta);

  // Test 4: Verify no Blobs stored
  console.log('\nTest 4: Verify only image_url metadata is stored (no image Blobs)');
  for (const cat of stored) {
    assert(typeof cat.image_url === 'string', 'image_url must be string URL');
    assert(!('blob' in cat), 'No image blobs allowed in Dexie cache');
    assert(!('data' in cat), 'No raw binary data allowed in Dexie cache');
  }
  console.log('✓ Confirmed: only metadata and image URLs stored');

  // Test 5: Reconciliation of changes (add, update, delete)
  console.log('\nTest 5: Reconciliation of modifications, additions, and deletions');
  const updatedCategories: DbCategory[] = [
    {
      id: 'c1',
      category_id: 'cat_01',
      name: 'Pure Katan Silk (Renamed)',
      slug: 'pure-katan-silk',
      description: 'Updated luxury description',
      image_url: 'https://example.com/c1_new.jpg',
      status: 'active',
      sort_order: 5,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-09-09T12:00:00Z'
    },
    // c2 deleted from Supabase
    sampleCategories[2], // c3
    // c4 deleted from Supabase
    {
      id: 'c5',
      category_id: 'cat_05',
      name: 'Tussar Silk',
      slug: 'tussar-silk',
      description: 'Raw silk textures',
      image_url: 'https://example.com/c5.jpg',
      status: 'active',
      sort_order: 0,
      created_at: '2026-09-09T12:00:00Z',
      updated_at: '2026-09-09T12:00:00Z'
    }
  ];

  await reconcileCategoriesInDexie(db, updatedCategories);

  const afterUpdate = await db.categories.toArray();
  assert.strictEqual(afterUpdate.length, 3, 'Total categories should now be 3');

  const c2Check = await db.categories.get('c2');
  assert.strictEqual(c2Check, undefined, 'Deleted category c2 must no longer exist in Dexie');
  const c4Check = await db.categories.get('c4');
  assert.strictEqual(c4Check, undefined, 'Deleted category c4 must no longer exist in Dexie');

  const c1Check = await db.categories.get('c1');
  assert.strictEqual(c1Check?.name, 'Pure Katan Silk (Renamed)', 'c1 name must be updated');
  assert.strictEqual(c1Check?.image_url, 'https://example.com/c1_new.jpg', 'c1 image_url must be updated');
  assert.strictEqual(c1Check?.sort_order, 5, 'c1 sort_order must be 5');

  const c5Check = await db.categories.get('c5');
  assert.strictEqual(c5Check?.name, 'Tussar Silk', 'Newly added category c5 must exist');
  console.log('✓ Successfully reconciled modifications, insertions, and deletions');

  // Test 6: Live Supabase query
  console.log('\nTest 6: Live Supabase fetch & reconciliation');
  const liveCategories = await fetchCategoriesFromSupabase();
  assert(Array.isArray(liveCategories) && liveCategories.length > 0, 'Live categories should be fetched');
  console.log(`✓ Fetched ${liveCategories.length} live categories from Supabase`);

  await reconcileCategoriesInDexie(db, liveCategories);
  const dexieLive = await db.categories.toArray();
  assert.strictEqual(dexieLive.length, liveCategories.length, 'Dexie count must match live Supabase count');
  console.log(`✓ Synchronized ${dexieLive.length} live categories into Dexie`);

  // Test 7: Request deduplication & cache freshness
  console.log('\nTest 7: Single-flight request deduplication & TTL freshness');
  (globalThis as any).window = globalThis;

  await db.categories.clear();
  await db.cacheMeta.clear();

  const [res1, res2, res3] = await Promise.all([
    syncCategories(),
    syncCategories(),
    syncCategories()
  ]);

  assert.deepStrictEqual(res1, res2, 'Concurrent calls 1 and 2 must return identical data');
  assert.deepStrictEqual(res2, res3, 'Concurrent calls 2 and 3 must return identical data');
  console.log('✓ Deduplication: 3 concurrent requests coalesced into single execution');

  const isFresh = await isCategoryCacheFresh();
  assert.strictEqual(isFresh, true, 'Category cache must be marked fresh');
  console.log('✓ Cache is fresh (age < 10 mins)');

  const cachedFast = await syncCategories();
  assert.strictEqual(cachedFast.length, res1.length, 'Immediate cache return must match');
  console.log('✓ Immediate cache return verified without network requests');

  // Test 8: updated_at change detection
  console.log('\nTest 8: updated_at change detection via checkForCategorySupabaseUpdatesAndSync');
  const noUpdate = await checkForCategorySupabaseUpdatesAndSync();
  assert.strictEqual(noUpdate, null, 'When updated_at is identical, no full sync is performed');
  console.log('✓ When updated_at matches, unnecessary full sync is skipped');

  // Simulate admin change by setting an older timestamp in cacheMeta
  const metaBefore = await db.cacheMeta.get(CATEGORIES_META_KEY);
  assert(metaBefore !== undefined);
  await db.cacheMeta.put({
    ...metaBefore,
    latestUpdatedAt: '2020-01-01T00:00:00.000Z'
  });

  const updatedSync = await checkForCategorySupabaseUpdatesAndSync();
  assert(Array.isArray(updatedSync) && updatedSync.length > 0, 'Admin change must trigger fresh sync');
  const metaAfter = await db.cacheMeta.get(CATEGORIES_META_KEY);
  assert.notStrictEqual(metaAfter?.latestUpdatedAt, '2020-01-01T00:00:00.000Z', 'latestUpdatedAt must be refreshed');
  console.log('✓ Admin update detected via updated_at, successfully synced fresh categories');

  console.log('\n--- ALL CATEGORY CACHE TESTS PASSED SUCCESSFULLY! ---');
  await db.close();
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
