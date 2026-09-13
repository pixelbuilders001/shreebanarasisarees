import { supabase, fetchProducts } from './supabase';
import { Product } from './products';
import {
  HomepageSection,
  Collection,
  CollectionRule,
  CollectionProduct,
} from '../types/homepage-sections';

/**
 * Evaluates whether a product satisfies an individual collection rule.
 */
export function evaluateRule(product: Product, rule: CollectionRule): boolean {
  if (!rule || !rule.field) return true;

  const field = rule.field.toLowerCase().trim();
  const operator = (rule.operator || 'eq').toLowerCase().trim();

  // Extract actual value from product
  let productValue: any;
  switch (field) {
    case 'selling_price':
    case 'price':
      productValue = product.salePrice != null && product.salePrice > 0 ? product.salePrice : product.price;
      break;
    case 'stock':
      productValue = product.stock ?? 0;
      break;
    case 'category':
      productValue = product.category || '';
      break;
    case 'fabric':
      productValue = product.fabric || '';
      break;
    case 'color':
      productValue = product.color || '';
      break;
    case 'occasion':
      productValue = product.occasion || '';
      break;
    case 'bestseller':
      productValue = Boolean(product.bestseller);
      break;
    case 'new_arrival':
    case 'newarrival':
      productValue = Boolean(product.newArrival);
      break;
    case 'status':
      // Storefront products are already active
      productValue = 'active';
      break;
    default:
      productValue = (product as any)[rule.field] ?? '';
      break;
  }

  // Compare according to operator
  switch (operator) {
    case 'eq':
      if (typeof productValue === 'number') {
        return productValue === Number(rule.value);
      }
      if (typeof productValue === 'boolean') {
        return productValue === (rule.value === true || rule.value === 'true' || rule.value === 1);
      }
      return String(productValue).trim().toLowerCase() === String(rule.value).trim().toLowerCase();

    case 'neq':
      if (typeof productValue === 'number') {
        return productValue !== Number(rule.value);
      }
      if (typeof productValue === 'boolean') {
        return productValue !== (rule.value === true || rule.value === 'true' || rule.value === 1);
      }
      return String(productValue).trim().toLowerCase() !== String(rule.value).trim().toLowerCase();

    case 'gt':
      return Number(productValue) > Number(rule.value);

    case 'gte':
      return Number(productValue) >= Number(rule.value);

    case 'lt':
      return Number(productValue) < Number(rule.value);

    case 'lte':
      return Number(productValue) <= Number(rule.value);

    case 'contains':
    case 'ilike':
      return String(productValue).toLowerCase().includes(String(rule.value).toLowerCase());

    case 'in':
      if (Array.isArray(rule.value)) {
        const needle = String(productValue).toLowerCase();
        return rule.value.map(v => String(v).toLowerCase()).includes(needle);
      }
      return String(rule.value).toLowerCase().includes(String(productValue).toLowerCase());

    default:
      return true;
  }
}

/**
 * Resolves products for an automatic collection based on rules, sort order, and product limit.
 */
export function resolveAutomaticCollection(
  collection: Collection,
  allProducts: Product[]
): Product[] {
  const rules = collection.rules || [];

  // Filter products by all rules (AND logic)
  let matching = allProducts.filter(product => {
    for (const rule of rules) {
      if (!evaluateRule(product, rule)) {
        return false;
      }
    }
    return true;
  });

  // Apply sorting
  const sortBy = (collection.sort_by || 'newest').toLowerCase();
  matching.sort((a, b) => {
    const priceA = a.salePrice != null && a.salePrice > 0 ? a.salePrice : a.price;
    const priceB = b.salePrice != null && b.salePrice > 0 ? b.salePrice : b.price;

    switch (sortBy) {
      case 'price_low':
      case 'price_asc':
        return priceA - priceB;
      case 'price_high':
      case 'price_desc':
        return priceB - priceA;
      case 'best_selling':
      case 'bestseller':
        return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
      case 'newest':
      default:
        // Prioritize new arrivals, then stable ID ordering
        if (a.newArrival !== b.newArrival) {
          return a.newArrival ? -1 : 1;
        }
        return b.id.localeCompare(a.id);
    }
  });

  // Apply product limit
  const limit = collection.product_limit && collection.product_limit > 0
    ? collection.product_limit
    : 8;

  return matching.slice(0, limit);
}

/**
 * Resolves products for a manual collection based on collection_products table rows.
 */
export function resolveManualCollection(
  collection: Collection,
  collectionProducts: CollectionProduct[],
  productsById: Map<string, Product>
): Product[] {
  const rels = collectionProducts
    .filter(cp => cp.collection_id === collection.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const resolved: Product[] = [];
  for (const rel of rels) {
    const pid = rel.product_id || rel.inventory_id;
    if (pid) {
      const prod = productsById.get(pid) || productsById.get(pid.toUpperCase());
      if (prod && !resolved.some(p => p.id === prod.id)) {
        resolved.push(prod);
      }
    }
  }

  const limit = collection.product_limit && collection.product_limit > 0
    ? collection.product_limit
    : 8;

  return resolved.slice(0, limit);
}

/**
 * Fetches all active, scheduled homepage sections with resolved collections and products.
 * Guarantees zero N+1 database queries through batch fetching and caching.
 * Excludes sections with 0 products.
 * Resilient to single-section failures.
 */
export async function fetchDynamicHomepageSections(): Promise<HomepageSection[]> {
  try {
    const nowIso = new Date().toISOString();

    // 1. Fetch active sections from homepage_sections ordered by sort_order
    const { data: rawSections, error: sectionsError } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (sectionsError || !rawSections) {
      console.error('Error fetching homepage_sections:', sectionsError);
      return [];
    }

    // 2. Filter scheduling window in memory (start_at is null OR now >= start_at; end_at is null OR now <= end_at)
    const activeSections: HomepageSection[] = (rawSections as HomepageSection[]).filter(section => {
      const afterStart = !section.start_at || nowIso >= section.start_at;
      const beforeEnd = !section.end_at || nowIso <= section.end_at;
      return afterStart && beforeEnd;
    });

    if (activeSections.length === 0) {
      return [];
    }

    // 3. Batch fetch associated collections
    const collectionIds = Array.from(
      new Set(activeSections.map(s => s.collection_id).filter(Boolean))
    ) as string[];

    let collectionsMap = new Map<string, Collection>();
    let manualCollectionIds: string[] = [];

    if (collectionIds.length > 0) {
      try {
        const { data: rawCollections, error: collError } = await supabase
          .from('collections')
          .select('*')
          .in('id', collectionIds)
          .eq('is_active', true);

        if (!collError && rawCollections) {
          for (const coll of rawCollections as Collection[]) {
            collectionsMap.set(coll.id, coll);
            if (coll.collection_type === 'manual') {
              manualCollectionIds.push(coll.id);
            }
          }
        }
      } catch (collEx) {
        console.error('Exception fetching collections:', collEx);
      }
    }

    // 4. Batch fetch collection_products for manual collections if any
    let collectionProducts: CollectionProduct[] = [];
    if (manualCollectionIds.length > 0) {
      try {
        const { data: rawCp, error: cpError } = await supabase
          .from('collection_products')
          .select('*')
          .in('collection_id', manualCollectionIds)
          .order('sort_order', { ascending: true });

        if (!cpError && rawCp) {
          collectionProducts = rawCp as CollectionProduct[];
        }
      } catch (cpEx) {
        console.error('Exception fetching collection_products:', cpEx);
      }
    }

    // 5. Fetch safe active storefront products (reuses existing safe select & cache)
    const allProducts = await fetchProducts();
    const productsById = new Map<string, Product>();
    for (const prod of allProducts) {
      productsById.set(prod.id, prod);
      productsById.set(prod.id.toUpperCase(), prod);
    }

    // 6. Resolve each section safely without letting one failure abort others
    const validSections: HomepageSection[] = [];

    for (const section of activeSections) {
      try {
        const collection = section.collection_id ? collectionsMap.get(section.collection_id) || null : null;
        let resolvedProducts: Product[] = [];

        if (collection) {
          if (collection.collection_type === 'manual') {
            resolvedProducts = resolveManualCollection(collection, collectionProducts, productsById);
          } else {
            resolvedProducts = resolveAutomaticCollection(collection, allProducts);
          }
        } else if (section.section_type === 'products') {
          // If no collection assigned but product section, fallback to empty or top active products
          resolvedProducts = [];
        }

        // Rule 10: If a collection returns zero valid products, do not render product-dependent sections.
        // Exception: If display_style is 'banner' / 'banners_showcase' / 'category_cards' or has an image_url,
        // it can render independently of collection products.
        const isVisualShowcase =
          section.display_style === 'banner' ||
          section.display_style === 'banner_showcase' ||
          section.display_style === 'banners_showcase' ||
          section.display_style === 'category_cards' ||
          section.display_style === 'offer_timer' ||
          Boolean(section.image_url);

        if (!isVisualShowcase && resolvedProducts.length === 0) {
          continue;
        }

        validSections.push({
          ...section,
          collection,
          products: resolvedProducts,
        });
      } catch (sectionErr) {
        console.error(`Error resolving homepage section ${section.id} (${section.title}):`, sectionErr);
        // Skip failed section silently to protect page stability
      }
    }

    return validSections;
  } catch (err) {
    console.error('Exception in fetchDynamicHomepageSections:', err);
    return [];
  }
}

export interface ResolvedCollectionPageData {
  id: string;
  name: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  slug: string;
  desktop_banner_url?: string | null;
  mobile_banner_url?: string | null;
  products: Product[];
}

/**
 * Resolves full collection data for the /collections/[slug] page.
 * Seamlessly resolves dynamic collections (both automatic & manual) and fallback campaigns without PGRST116 errors.
 */
export async function fetchResolvedCollectionBySlug(slug: string): Promise<ResolvedCollectionPageData | null> {
  try {
    const cleanSlug = slug.toLowerCase().trim();

    // 1. Check if any active homepage section has a matching view_all_url or title
    const { data: sectionRows } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true);

    let matchedSection: HomepageSection | null = null;
    let targetCollectionId: string | null = null;

    if (sectionRows && sectionRows.length > 0) {
      for (const sec of sectionRows as HomepageSection[]) {
        const vUrl = (sec.view_all_url || '').toLowerCase();
        if (vUrl.includes(cleanSlug) || vUrl.endsWith(`/${cleanSlug}`)) {
          matchedSection = sec;
          targetCollectionId = sec.collection_id || null;
          break;
        }
      }
    }

    // 2. Fetch target collection from collections table
    let collection: Collection | null = null;
    if (targetCollectionId) {
      const { data: colData } = await supabase
        .from('collections')
        .select('*')
        .eq('id', targetCollectionId)
        .eq('is_active', true)
        .maybeSingle();

      if (colData) {
        collection = colData as Collection;
      }
    }

    // If not matched by section view_all_url, try querying collections table directly
    if (!collection) {
      const { data: allCollections } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true);

      if (allCollections && allCollections.length > 0) {
        collection = (allCollections as Collection[]).find(c => {
          if (c.id === cleanSlug) return true;
          if (c.slug && c.slug.toLowerCase() === cleanSlug) return true;
          const slugifiedName = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          if (slugifiedName === cleanSlug) return true;
          // Word matching (e.g. limited-edition matches The Limited Edition)
          const slugWords = cleanSlug.split('-').filter(w => w !== 'collections' && w !== 'collection');
          const nameWords = c.name.toLowerCase().split(/\s+/);
          const common = slugWords.filter(w => nameWords.includes(w));
          if (common.length >= 2) return true;
          return false;
        }) || null;
      }
    }

    // 3. If collection is found, resolve its full products list for the collection page
    if (collection) {
      const allProducts = await fetchProducts();
      let resolvedProducts: Product[] = [];

      if (collection.collection_type === 'manual') {
        const { data: rawCp } = await supabase
          .from('collection_products')
          .select('*')
          .eq('collection_id', collection.id)
          .order('sort_order', { ascending: true });

        const productsById = new Map<string, Product>();
        for (const prod of allProducts) {
          productsById.set(prod.id, prod);
          productsById.set(prod.id.toUpperCase(), prod);
        }

        resolvedProducts = resolveManualCollection(collection, (rawCp || []) as CollectionProduct[], productsById);
      } else {
        // For the dedicated collection page, show all products matching the rules
        const collectionForPage: Collection = {
          ...collection,
          product_limit: collection.product_limit && collection.product_limit > 8 ? collection.product_limit : 100,
        };
        resolvedProducts = resolveAutomaticCollection(collectionForPage, allProducts);
      }

      return {
        id: collection.id,
        name: collection.name,
        title: matchedSection?.title || collection.name,
        subtitle: matchedSection?.subtitle || collection.description,
        description: collection.description,
        slug: cleanSlug,
        desktop_banner_url: matchedSection?.image_url || collection.banner_url || null,
        mobile_banner_url: matchedSection?.image_url || collection.banner_url || null,
        products: resolvedProducts,
      };
    }

    // 4. Fallback: check campaigns table with maybeSingle to safely support legacy campaigns
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (!campaignError && campaignData) {
      const campaign = campaignData as any;
      const { fetchCampaignProducts } = await import('./supabase');
      const campaignProducts = await fetchCampaignProducts(campaign.id);

      return {
        id: campaign.id,
        name: campaign.name,
        title: campaign.title || campaign.name,
        subtitle: campaign.subtitle,
        description: campaign.subtitle || campaign.title,
        slug: campaign.slug,
        desktop_banner_url: campaign.desktop_banner_url,
        mobile_banner_url: campaign.mobile_banner_url,
        products: campaignProducts,
      };
    }

    return null;
  } catch (err) {
    console.error('Exception in fetchResolvedCollectionBySlug:', err);
    return null;
  }
}
