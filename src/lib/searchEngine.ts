/**
 * Advanced Search Engine for Shree Banarasi Sarees
 * Supports: fuzzy matching, synonyms, Hindi/English variations,
 * natural language filter detection (color, fabric, price, occasion, category, SKU)
 */

import { Product } from '../data/products';

// ─── Synonym / Alias Maps ───────────────────────────────────────────────────

export const COLOR_SYNONYMS: Record<string, string> = {
  // English variants
  lal: 'Red', red: 'Red', rouge: 'Red',
  peela: 'Yellow', yellow: 'Yellow',
  nila: 'Blue', blue: 'Blue', neela: 'Blue',
  hara: 'Green', green: 'Green', hari: 'Green',
  kala: 'Black', black: 'Black',
  safed: 'White', white: 'White', cream: 'White',
  maroon: 'Maroon', gulabi: 'Pink', pink: 'Pink',
  purple: 'Purple', baingani: 'Purple', violet: 'Purple',
  orange: 'Orange', narangi: 'Orange',
  gold: 'Gold', golden: 'Gold', sona: 'Gold',
  silver: 'Silver', chandi: 'Silver',
  beige: 'Beige', ivory: 'White',
};

export const FABRIC_SYNONYMS: Record<string, string> = {
  silk: 'Silk', resham: 'Silk', रेशम: 'Silk',
  cotton: 'Cotton', suthi: 'Cotton', sutti: 'Cotton',
  georgette: 'Georgette',
  organza: 'Organza',
  chanderi: 'Chanderi Silk', chandari: 'Chanderi Silk',
  banarasi: 'Banarasi Silk', banaras: 'Banarasi Silk',
  'banarasi silk': 'Banarasi Silk',
  katan: 'Banarasi Silk', kataan: 'Banarasi Silk',
  chiffon: 'Chiffon',
  net: 'Net',
  linen: 'Linen',
  tussar: 'Tussar Silk', tasar: 'Tussar Silk',
  kanjivaram: 'Silk', kanjeevaram: 'Silk',
  raw: 'Raw Silk', 'raw silk': 'Raw Silk',
};

export const OCCASION_SYNONYMS: Record<string, string> = {
  wedding: 'Wedding', shaadi: 'Wedding', vivah: 'Wedding', bridal: 'Wedding', bride: 'Wedding',
  festive: 'Festive', festival: 'Festive', puja: 'Festive', pooja: 'Festive', durga: 'Festive',
  party: 'Party', 'party wear': 'Party', cocktail: 'Party',
  daily: 'Daily Wear', casual: 'Daily Wear', 'daily wear': 'Daily Wear', everyday: 'Daily Wear',
  office: 'Office', work: 'Office', formal: 'Office',
  gift: 'Gift', gifting: 'Gift', present: 'Gift',
};

export const CATEGORY_SYNONYMS: Record<string, string> = {
  banarasi: 'Banarasi', banaras: 'Banarasi',
  chikankari: 'Chikankari', chikan: 'Chikankari', lucknowi: 'Chikankari',
  bandhani: 'Bandhani', bandhej: 'Bandhani', tie: 'Bandhani',
  organza: 'Organza',
  chanderi: 'Chanderi', chandari: 'Chanderi',
  bridal: 'Bridal', 'bridal collection': 'Bridal',
  silk: 'Silk',
};

// ─── Price Pattern Detection ─────────────────────────────────────────────────

interface PriceFilter {
  min?: number;
  max?: number;
}

const PRICE_PATTERNS: { regex: RegExp; extract: (m: RegExpMatchArray) => PriceFilter }[] = [
  // "under 5000" / "below 5000" / "less than 5000" / "upto 5000" / "up to 5000"
  {
    regex: /(?:under|below|less than|upto|up to|within|kam se kam|se kam)\s*(?:rs\.?|₹|inr)?\s*(\d[\d,]*)/i,
    extract: (m) => ({ max: parseInt(m[1].replace(/,/g, '')) }),
  },
  // "above 2000" / "more than 2000" / "over 2000"
  {
    regex: /(?:above|more than|over|greater than|from|zyada|se jyada)\s*(?:rs\.?|₹|inr)?\s*(\d[\d,]*)/i,
    extract: (m) => ({ min: parseInt(m[1].replace(/,/g, '')) }),
  },
  // "₹1000 to ₹5000" / "1000 - 5000" / "between 1000 and 5000"
  {
    regex: /(?:₹|rs\.?|inr)?\s*(\d[\d,]*)\s*(?:to|-|–|and)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i,
    extract: (m) => ({
      min: parseInt(m[1].replace(/,/g, '')),
      max: parseInt(m[2].replace(/,/g, '')),
    }),
  },
  // "5000 rupees" / "5000 rs" / "5000 inr" standalone
  {
    regex: /(\d[\d,]*)\s*(?:rupees?|rs\.?|inr)\b/i,
    extract: (m) => ({ max: parseInt(m[1].replace(/,/g, '')) }),
  },
];

// ─── Detected Filters ────────────────────────────────────────────────────────

export interface DetectedFilters {
  colors: string[];
  fabrics: string[];
  occasions: string[];
  categories: string[];
  price?: PriceFilter;
  skuMatch?: string;
  remainingQuery: string;  // keywords not consumed by filter detection
}

// ─── Levenshtein Distance (for fuzzy matching) ───────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Returns true if `token` fuzzy-matches any value in `candidates` within `threshold` edits.
 * Threshold scales with word length.
 */
function fuzzyMatch(token: string, candidates: string[], threshold = 2): string | null {
  const lower = token.toLowerCase();
  for (const cand of candidates) {
    const cl = cand.toLowerCase();
    // Exact / starts-with / contains fast paths
    if (cl === lower || cl.startsWith(lower) || lower.startsWith(cl)) return cand;
    if (lower.length >= 4 && cl.includes(lower)) return cand;
    // Levenshtein fallback
    const dist = levenshtein(lower, cl);
    const maxDist = lower.length <= 4 ? 1 : lower.length <= 7 ? 2 : threshold;
    if (dist <= maxDist) return cand;
  }
  return null;
}

// ─── Main Query Parser ────────────────────────────────────────────────────────

export function parseSearchQuery(query: string): DetectedFilters {
  const result: DetectedFilters = {
    colors: [],
    fabrics: [],
    occasions: [],
    categories: [],
    remainingQuery: '',
  };

  let working = query.trim();

  // 1. Price detection
  for (const pattern of PRICE_PATTERNS) {
    const m = working.match(pattern.regex);
    if (m) {
      result.price = pattern.extract(m);
      working = working.replace(pattern.regex, ' ').trim();
      break; // take first match
    }
  }

  // 2. SKU detection (e.g. SBS-001 or SKU-XYZ)
  const skuMatch = working.match(/\b([A-Z]{2,5}-\d{3,8}[A-Z0-9]*)\b/i);
  if (skuMatch) {
    result.skuMatch = skuMatch[1].toUpperCase();
    working = working.replace(skuMatch[0], ' ').trim();
  }

  // 3. Multi-word synonym matching (process longest first)
  const sortedColorKeys = Object.keys(COLOR_SYNONYMS).sort((a, b) => b.length - a.length);
  const sortedFabricKeys = Object.keys(FABRIC_SYNONYMS).sort((a, b) => b.length - a.length);
  const sortedOccasionKeys = Object.keys(OCCASION_SYNONYMS).sort((a, b) => b.length - a.length);
  const sortedCategoryKeys = Object.keys(CATEGORY_SYNONYMS).sort((a, b) => b.length - a.length);

  // Try multi-word matches first
  for (const key of sortedColorKeys) {
    if (key.includes(' ') && working.toLowerCase().includes(key)) {
      const val = COLOR_SYNONYMS[key];
      if (!result.colors.includes(val)) result.colors.push(val);
      working = working.replace(new RegExp(key, 'gi'), ' ').trim();
    }
  }
  for (const key of sortedFabricKeys) {
    if (key.includes(' ') && working.toLowerCase().includes(key)) {
      const val = FABRIC_SYNONYMS[key];
      if (!result.fabrics.includes(val)) result.fabrics.push(val);
      working = working.replace(new RegExp(key, 'gi'), ' ').trim();
    }
  }
  for (const key of sortedOccasionKeys) {
    if (key.includes(' ') && working.toLowerCase().includes(key)) {
      const val = OCCASION_SYNONYMS[key];
      if (!result.occasions.includes(val)) result.occasions.push(val);
      working = working.replace(new RegExp(key, 'gi'), ' ').trim();
    }
  }
  for (const key of sortedCategoryKeys) {
    if (key.includes(' ') && working.toLowerCase().includes(key)) {
      const val = CATEGORY_SYNONYMS[key];
      if (!result.categories.includes(val)) result.categories.push(val);
      working = working.replace(new RegExp(key, 'gi'), ' ').trim();
    }
  }

  // 4. Token-by-token synonym matching
  const tokens = working.split(/\s+/).filter(Boolean);
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    const ltoken = token.toLowerCase();
    let consumed = false;

    // Color check
    if (COLOR_SYNONYMS[ltoken]) {
      const val = COLOR_SYNONYMS[ltoken];
      if (!result.colors.includes(val)) result.colors.push(val);
      consumed = true;
    }
    // Fabric check
    else if (FABRIC_SYNONYMS[ltoken]) {
      const val = FABRIC_SYNONYMS[ltoken];
      if (!result.fabrics.includes(val)) result.fabrics.push(val);
      consumed = true;
    }
    // Occasion check
    else if (OCCASION_SYNONYMS[ltoken]) {
      const val = OCCASION_SYNONYMS[ltoken];
      if (!result.occasions.includes(val)) result.occasions.push(val);
      consumed = true;
    }
    // Category check
    else if (CATEGORY_SYNONYMS[ltoken]) {
      const val = CATEGORY_SYNONYMS[ltoken];
      if (!result.categories.includes(val)) result.categories.push(val);
      consumed = true;
    }
    // Fuzzy fallback for colors
    else {
      const fuzzyColor = fuzzyMatch(ltoken, Object.keys(COLOR_SYNONYMS));
      if (fuzzyColor) {
        const val = COLOR_SYNONYMS[fuzzyColor];
        if (!result.colors.includes(val)) result.colors.push(val);
        consumed = true;
      } else {
        const fuzzyFabric = fuzzyMatch(ltoken, Object.keys(FABRIC_SYNONYMS));
        if (fuzzyFabric) {
          const val = FABRIC_SYNONYMS[fuzzyFabric];
          if (!result.fabrics.includes(val)) result.fabrics.push(val);
          consumed = true;
        } else {
          const fuzzyOccasion = fuzzyMatch(ltoken, Object.keys(OCCASION_SYNONYMS));
          if (fuzzyOccasion) {
            const val = OCCASION_SYNONYMS[fuzzyOccasion];
            if (!result.occasions.includes(val)) result.occasions.push(val);
            consumed = true;
          } else {
            const fuzzyCategory = fuzzyMatch(ltoken, Object.keys(CATEGORY_SYNONYMS));
            if (fuzzyCategory) {
              const val = CATEGORY_SYNONYMS[fuzzyCategory];
              if (!result.categories.includes(val)) result.categories.push(val);
              consumed = true;
            }
          }
        }
      }
    }

    if (!consumed) {
      remainingTokens.push(token);
    }
  }

  result.remainingQuery = remainingTokens.join(' ').trim();

  return result;
}

// ─── Scoring & Filtering ─────────────────────────────────────────────────────

interface ScoredProduct {
  product: Product;
  score: number;
}

/**
 * Score and filter products given a query + detected filters.
 * Returns products sorted by relevance score (highest first).
 */
export function scoreProducts(products: Product[], query: string, filters: DetectedFilters): Product[] {
  const qLower = query.toLowerCase().trim();
  const remaining = filters.remainingQuery.toLowerCase().trim();

  const scored: ScoredProduct[] = [];

  for (const product of products) {
    // ── Hard filter by detected filters ──
    if (filters.colors.length > 0) {
      const hasColor = filters.colors.some(c =>
        product.color.toLowerCase().includes(c.toLowerCase())
      );
      if (!hasColor) continue;
    }
    if (filters.fabrics.length > 0) {
      const hasFabric = filters.fabrics.some(f =>
        product.fabric.toLowerCase().includes(f.toLowerCase())
      );
      if (!hasFabric) continue;
    }
    if (filters.occasions.length > 0) {
      const hasOccasion = filters.occasions.some(o =>
        product.occasion.toLowerCase().includes(o.toLowerCase())
      );
      if (!hasOccasion) continue;
    }
    if (filters.categories.length > 0) {
      const hasCat = filters.categories.some(cat =>
        product.category.toLowerCase().includes(cat.toLowerCase())
      );
      if (!hasCat) continue;
    }
    if (filters.price) {
      const effectivePrice = product.salePrice ?? product.price;
      if (filters.price.min !== undefined && effectivePrice < filters.price.min) continue;
      if (filters.price.max !== undefined && effectivePrice > filters.price.max) continue;
    }
    if (filters.skuMatch) {
      if (!(product.sku || '').toUpperCase().includes(filters.skuMatch)) continue;
    }

    // ── Scoring for sort order ──
    let score = 0;

    if (remaining) {
      const nameLower = product.name.toLowerCase();
      const catLower = product.category.toLowerCase();
      const fabLower = product.fabric.toLowerCase();
      const colorLower = product.color.toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const skuLower = (product.sku || '').toLowerCase();

      // Exact name match
      if (nameLower === remaining) score += 100;
      // Name starts with
      else if (nameLower.startsWith(remaining)) score += 80;
      // Name contains
      else if (nameLower.includes(remaining)) score += 60;
      // Category exact
      else if (catLower === remaining) score += 70;
      // Category contains
      else if (catLower.includes(remaining)) score += 50;
      // Fabric contains
      else if (fabLower.includes(remaining)) score += 40;
      // Color contains
      else if (colorLower.includes(remaining)) score += 35;
      // SKU contains
      else if (skuLower.includes(remaining)) score += 90;
      // Description contains
      else if (descLower.includes(remaining)) score += 20;

      // Token-level scoring
      const queryTokens = remaining.split(/\s+/).filter(Boolean);
      let tokenScore = 0;
      for (const tok of queryTokens) {
        if (nameLower.includes(tok)) tokenScore += 15;
        else if (catLower.includes(tok)) tokenScore += 10;
        else if (fabLower.includes(tok)) tokenScore += 8;
        else if (descLower.includes(tok)) tokenScore += 4;
      }
      score += tokenScore;

      // If still 0 score after all checks, use fuzzy match as last resort
      if (score === 0) {
        const fuzzy = fuzzyMatch(remaining, [product.name, product.category, product.fabric]);
        if (fuzzy) score += 10;
      }

      // Skip if no match at all and we had a remaining query
      if (score === 0) continue;
    } else {
      // No remaining text query — all filter-matching products score equally
      score = 50;
    }

    // Boost featured/bestseller
    if (product.featured) score += 5;
    if (product.bestseller) score += 3;
    if (product.newArrival) score += 2;

    scored.push({ product, score });
  }

  return scored.sort((a, b) => b.score - a.score).map(s => s.product);
}

// ─── Suggestion Generation ───────────────────────────────────────────────────

export interface SearchSuggestion {
  type: 'product' | 'category' | 'fabric' | 'color' | 'occasion' | 'query';
  label: string;
  value: string;
  product?: Product;
  icon?: string;
}

export function generateSuggestions(query: string, products: Product[]): SearchSuggestion[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Product name matches
  const productMatches = products
    .filter(p => {
      const name = p.name.toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return name.includes(q) || sku.includes(q) ||
        (q.length >= 3 && fuzzyMatch(q, [name]) !== null);
    })
    .slice(0, 5);

  for (const p of productMatches) {
    suggestions.push({ type: 'product', label: p.name, value: p.name, product: p });
  }

  // 2. Category suggestions
  const allCats = Array.from(new Set(products.map(p => p.category)));
  for (const cat of allCats) {
    if (cat.toLowerCase().includes(q) && !seen.has(cat)) {
      suggestions.push({ type: 'category', label: `${cat} Sarees`, value: cat, icon: '🏷️' });
      seen.add(cat);
    }
  }

  // 3. Fabric suggestions
  const allFabrics = Array.from(new Set(products.map(p => p.fabric)));
  for (const fab of allFabrics) {
    if (fab.toLowerCase().includes(q) && !seen.has(fab)) {
      suggestions.push({ type: 'fabric', label: `${fab} Sarees`, value: fab, icon: '✨' });
      seen.add(fab);
    }
  }

  // 4. Color suggestions
  const allColors = Array.from(new Set(products.map(p => p.color)));
  for (const col of allColors) {
    if (col.toLowerCase().includes(q) && !seen.has(col)) {
      suggestions.push({ type: 'color', label: `${col} Sarees`, value: col, icon: '🎨' });
      seen.add(col);
    }
  }

  // 5. Synonym-based suggestions
  const filters = parseSearchQuery(query);
  if (filters.colors.length > 0 && !seen.has(filters.colors[0])) {
    suggestions.push({ type: 'color', label: `${filters.colors[0]} Sarees`, value: filters.colors[0], icon: '🎨' });
  }
  if (filters.occasions.length > 0 && !seen.has(filters.occasions[0])) {
    suggestions.push({ type: 'occasion', label: `${filters.occasions[0]} Sarees`, value: filters.occasions[0], icon: '🎉' });
  }
  if (filters.fabrics.length > 0 && !seen.has(filters.fabrics[0])) {
    suggestions.push({ type: 'fabric', label: `${filters.fabrics[0]} Sarees`, value: filters.fabrics[0], icon: '✨' });
  }

  return suggestions.slice(0, 8);
}

// ─── Filter Chip Label Formatters ────────────────────────────────────────────

export function formatPriceFilter(price?: PriceFilter): string {
  if (!price) return '';
  if (price.min !== undefined && price.max !== undefined) return `₹${price.min.toLocaleString('en-IN')}–₹${price.max.toLocaleString('en-IN')}`;
  if (price.max !== undefined) return `Under ₹${price.max.toLocaleString('en-IN')}`;
  if (price.min !== undefined) return `Above ₹${price.min.toLocaleString('en-IN')}`;
  return '';
}

export function buildSearchUrl(
  query: string,
  filters: DetectedFilters,
  extraParams?: Record<string, string>
): string {
  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (filters.colors.length) params.set('color', filters.colors.join(','));
  if (filters.fabrics.length) params.set('fabric', filters.fabrics.join(','));
  if (filters.occasions.length) params.set('occasion', filters.occasions.join(','));
  if (filters.categories.length) params.set('category', filters.categories.join(','));
  if (filters.price?.min !== undefined) params.set('minPrice', String(filters.price.min));
  if (filters.price?.max !== undefined) params.set('maxPrice', String(filters.price.max));
  if (filters.skuMatch) params.set('sku', filters.skuMatch);
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v);
    }
  }
  return `/sarees?${params.toString()}`;
}
