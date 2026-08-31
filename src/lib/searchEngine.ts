/**
 * Advanced Search Engine for Shree Banarasi Sarees
 * Supports: fuzzy matching, synonyms, Hindi/English variations,
 * natural language filter detection (color, fabric, price, occasion, category, SKU)
 */

import { Product } from '../data/products';

// ─── Stop Words (consumed silently, not treated as product keywords) ──────────
// These are words that should be ignored when building the remaining query
const STOP_WORDS = new Set([
  // English
  'saree', 'sarees', 'sari', 'saris', 'the', 'a', 'an', 'in', 'for', 'with',
  'and', 'or', 'buy', 'shop', 'show', 'find', 'get', 'me', 'my',
  'best', 'good', 'nice', 'beautiful', 'pure', 'original', 'genuine',
  'indian', 'traditional', 'ethnic', 'designer', 'handwoven', 'handloom', 'woven',
  'new', 'latest', 'trending', 'cheap', 'affordable', 'premium', 'luxury',
  // Hindi connectors & common words
  'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'par', 'aur', 'ya', 'liye', 'lekin',
  'bhi', 'sirf', 'koi', 'kuch', 'wala', 'wali', 'wale', 'ek', 'iske', 'uske',
  'mujhe', 'chahiye', 'dikhao', 'batao', 'dedo', 'dekhna', 'lena',
]);

// ─── Synonym / Alias Maps ───────────────────────────────────────────────────

export const COLOR_SYNONYMS: Record<string, string> = {
  lal: 'Red', red: 'Red', rouge: 'Red',
  peela: 'Yellow', yellow: 'Yellow', pila: 'Yellow',
  nila: 'Blue', blue: 'Blue', neela: 'Blue',
  hara: 'Green', green: 'Green', hari: 'Green', sabz: 'Green',
  kala: 'Black', black: 'Black',
  safed: 'White', white: 'White', ivory: 'White',
  maroon: 'Maroon', dark: 'Maroon', darkred: 'Maroon',
  gulabi: 'Pink', pink: 'Pink', rose: 'Pink',
  purple: 'Purple', baingani: 'Purple', violet: 'Purple',
  orange: 'Orange', narangi: 'Orange', kesariya: 'Orange',
  gold: 'Gold', golden: 'Gold', sona: 'Gold', sone: 'Gold',
  silver: 'Silver', chandi: 'Silver', chandni: 'Silver',
  beige: 'Beige', cream: 'Beige',
  grey: 'Grey', gray: 'Grey',
  brown: 'Brown', bhura: 'Brown',
  navy: 'Blue', teal: 'Green',
};

export const FABRIC_SYNONYMS: Record<string, string> = {
  silk: 'Silk', resham: 'Silk', silken: 'Silk',
  cotton: 'Cotton', suthi: 'Cotton', sutti: 'Cotton',
  georgette: 'Georgette',
  organza: 'Organza',
  chanderi: 'Chanderi Silk', chandari: 'Chanderi Silk',
  katan: 'Silk', kataan: 'Silk',
  chiffon: 'Chiffon',
  net: 'Net', netting: 'Net',
  linen: 'Linen',
  tussar: 'Tussar Silk', tasar: 'Tussar Silk', tussah: 'Tussar Silk',
  kanjivaram: 'Silk', kanjeevaram: 'Silk', kanchipuram: 'Silk',
  'raw silk': 'Raw Silk', raw: 'Raw Silk',
  crepe: 'Crepe',
  tanchui: 'Tanchui Silk', tanchoi: 'Tanchui Silk', 'tanchui silk': 'Tanchui Silk',
  tissue: 'Tissue Silk', 'tissue silk': 'Tissue Silk',
};

export const OCCASION_SYNONYMS: Record<string, string> = {
  wedding: 'Wedding', shaadi: 'Wedding', vivah: 'Wedding', bridal: 'Wedding',
  bride: 'Wedding', dulhan: 'Wedding', shadi: 'Wedding', 'wedding wear': 'Wedding',
  'wedding saree': 'Wedding', 'shaadi saree': 'Wedding',
  festive: 'Festive', festival: 'Festive', puja: 'Festive', pooja: 'Festive',
  durga: 'Festive', navratri: 'Festive', diwali: 'Festive', holi: 'Festive',
  party: 'Party', 'party wear': 'Party', cocktail: 'Party',
  evening: 'Party', reception: 'Party',
  daily: 'Daily Wear', casual: 'Daily Wear', 'daily wear': 'Daily Wear',
  everyday: 'Daily Wear', regular: 'Daily Wear',
  office: 'Office', work: 'Office', formal: 'Office', professional: 'Office',
  gift: 'Gift', gifting: 'Gift', present: 'Gift', uphar: 'Gift',
};

export const CATEGORY_SYNONYMS: Record<string, string> = {
  'banarasi silk': 'Banarasi', 'banarasi silk sarees': 'Banarasi', 'banarasi sarees': 'Banarasi', 'banarasi saree': 'Banarasi',
  banarasi: 'Banarasi', banaras: 'Banarasi', benares: 'Banarasi', varanasi: 'Banarasi', 'banarasi katan': 'Banarasi', 'banarasi satin': 'Banarasi', 'tissue banarasi': 'Banarasi',
  chikankari: 'Chikankari', chikan: 'Chikankari', lucknowi: 'Chikankari', lucknow: 'Chikankari', 'chickan-kari': 'Chikankari', 'chickan kari': 'Chikankari',
  bandhani: 'Bandhani', bandhej: 'Bandhani', bandhan: 'Bandhani', 'bandhani silk': 'Bandhani', 'assamese bandhej': 'Assamese Bandhej',
  organza: 'Organza',
  chanderi: 'Chanderi', chandari: 'Chanderi',
  'bridal collection': 'Bridal', bridal: 'Bridal',
  tanchui: 'Tanchui Silk', tanchoi: 'Tanchui Silk', 'tanchui white': 'Tanchui White', 'tanchui-white': 'Tanchui White',
  katan: 'Katan Silk', 'katan silk': 'Katan Silk', 'katan-silk': 'Katan Silk',
  'raw silk ada': 'Raw Silk Ada', 'raw-silk-ada': 'Raw Silk Ada',
  shikargarh: 'Shikargarh',
  'wedding wear': 'Wedding Wear',
  'party wear': 'Party Wear',
};

// ─── Price Pattern Detection ─────────────────────────────────────────────────

export interface PriceFilter {
  min?: number;
  max?: number;
}

const PRICE_PATTERNS: { regex: RegExp; extract: (m: RegExpMatchArray) => PriceFilter }[] = [
  // "under 5000" / "below 5000" / "less than 5000" / "upto 5000" / "budget 5000"
  {
    regex: /(?:under|below|less\s+than|upto|up\s+to|within|max|budget|atmost|at\s+most|se\s+kam|kam\s+se\s+kam|neeche)\s*(?:rs\.?|₹|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i,
    extract: (m) => ({ max: Math.round(parseFloat(m[1].replace(/,/g, ''))) }),
  },
  // "above 2000" / "more than 2000" / "over 2000" / "minimum 2000" / "2000 se upar"
  {
    regex: /(?:above|more\s+than|over|greater\s+than|minimum|atleast|at\s+least|from|zyada|se\s+jyada|upar)\s*(?:rs\.?|₹|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i,
    extract: (m) => ({ min: Math.round(parseFloat(m[1].replace(/,/g, ''))) }),
  },
  // "(number) se upar" – Hindi: "2000 se upar" = above 2000
  {
    regex: /(?:rs\.?|₹|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:se\s+upar|se\s+jyada|se\s+zyada)/i,
    extract: (m) => ({ min: Math.round(parseFloat(m[1].replace(/,/g, ''))) }),
  },
  // "between 1000 and 5000" / "1000 to 5000" / "1000 - 5000" / "₹1000-₹5000"
  {
    regex: /(?:between\s+)?(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:to|–|-|and|se)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i,
    extract: (m) => ({
      min: Math.round(parseFloat(m[1].replace(/,/g, ''))),
      max: Math.round(parseFloat(m[2].replace(/,/g, ''))),
    }),
  },
  // "₹5000" or "rs 5000" standalone (with currency marker)
  {
    regex: /(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?)\b/i,
    extract: (m) => ({ max: Math.round(parseFloat(m[1].replace(/,/g, ''))) }),
  },
  // "5000 rupees" standalone
  {
    regex: /(\d[\d,]*(?:\.\d+)?)\s*(?:rupees?|rs\.?)\b/i,
    extract: (m) => ({ max: Math.round(parseFloat(m[1].replace(/,/g, ''))) }),
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
  remainingQuery: string;  // keywords NOT consumed by filter detection
}

// ─── Levenshtein Distance (fuzzy matching) ────────────────────────────────────

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

function fuzzyMatch(token: string, candidates: string[], maxEdits = 2): string | null {
  const lower = token.toLowerCase();
  if (lower.length < 3) return null; // skip very short tokens
  for (const cand of candidates) {
    const cl = cand.toLowerCase();
    if (cl === lower) return cand;
    if (cl.startsWith(lower) || lower.startsWith(cl)) return cand;
    if (lower.length >= 4 && cl.includes(lower)) return cand;
    const threshold = lower.length <= 4 ? 1 : lower.length <= 7 ? 2 : maxEdits;
    if (levenshtein(lower, cl) <= threshold) return cand;
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

  // ── 1. Price detection (highest priority) ──
  for (const pattern of PRICE_PATTERNS) {
    const m = working.match(pattern.regex);
    if (m) {
      result.price = pattern.extract(m);
      working = working.replace(m[0], ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // ── 2. SKU detection ──
  const skuMatch = working.match(/\b([A-Z]{2,5}-[A-Z0-9]{3,10})\b/i);
  if (skuMatch) {
    result.skuMatch = skuMatch[1].toUpperCase();
    working = working.replace(skuMatch[0], ' ').replace(/\s+/g, ' ').trim();
  }

  // ── 3. Multi-word synonyms (longest match first) ──
  const multiWordMatch = (synonymMap: Record<string, string>, bucket: string[]) => {
    const keys = Object.keys(synonymMap)
      .filter(k => k.includes(' '))
      .sort((a, b) => b.length - a.length);
    for (const key of keys) {
      const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (re.test(working)) {
        const val = synonymMap[key];
        if (!bucket.includes(val)) bucket.push(val);
        working = working.replace(re, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  };

  multiWordMatch(CATEGORY_SYNONYMS, result.categories);
  multiWordMatch(COLOR_SYNONYMS, result.colors);
  multiWordMatch(FABRIC_SYNONYMS, result.fabrics);
  multiWordMatch(OCCASION_SYNONYMS, result.occasions);

  // ── 4. Token-by-token matching ──
  const tokens = working.split(/\s+/).filter(Boolean);
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    const ltoken = token.toLowerCase();

    // Stop words — silently drop
    if (STOP_WORDS.has(ltoken)) continue;

    let consumed = false;

    // Exact synonym checks
    if (!consumed && COLOR_SYNONYMS[ltoken]) {
      const val = COLOR_SYNONYMS[ltoken];
      if (!result.colors.includes(val)) result.colors.push(val);
      consumed = true;
    }
    if (!consumed && FABRIC_SYNONYMS[ltoken]) {
      const val = FABRIC_SYNONYMS[ltoken];
      if (!result.fabrics.includes(val)) result.fabrics.push(val);
      consumed = true;
    }
    if (!consumed && OCCASION_SYNONYMS[ltoken]) {
      const val = OCCASION_SYNONYMS[ltoken];
      if (!result.occasions.includes(val)) result.occasions.push(val);
      consumed = true;
    }
    if (!consumed && CATEGORY_SYNONYMS[ltoken]) {
      const val = CATEGORY_SYNONYMS[ltoken];
      if (!result.categories.includes(val)) result.categories.push(val);
      consumed = true;
    }

    // Fuzzy matching (only for longer tokens to avoid false positives)
    if (!consumed && ltoken.length >= 4) {
      const fc = fuzzyMatch(ltoken, Object.keys(COLOR_SYNONYMS));
      if (fc) { const v = COLOR_SYNONYMS[fc]; if (!result.colors.includes(v)) result.colors.push(v); consumed = true; }

      if (!consumed) {
        const ff = fuzzyMatch(ltoken, Object.keys(FABRIC_SYNONYMS));
        if (ff) { const v = FABRIC_SYNONYMS[ff]; if (!result.fabrics.includes(v)) result.fabrics.push(v); consumed = true; }
      }
      if (!consumed) {
        const fo = fuzzyMatch(ltoken, Object.keys(OCCASION_SYNONYMS));
        if (fo) { const v = OCCASION_SYNONYMS[fo]; if (!result.occasions.includes(v)) result.occasions.push(v); consumed = true; }
      }
      if (!consumed) {
        const fcat = fuzzyMatch(ltoken, Object.keys(CATEGORY_SYNONYMS));
        if (fcat) { const v = CATEGORY_SYNONYMS[fcat]; if (!result.categories.includes(v)) result.categories.push(v); consumed = true; }
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
 * Score and filter products given detected filters + remaining text query.
 * Hard filters (color, fabric, occasion, category, price, SKU) are applied first.
 * Surviving products are ranked by text relevance of the remaining query.
 * If no remaining text query, all filter-matched products are returned (score = base).
 */
export function scoreProducts(
  products: Product[],
  _rawQuery: string,           // kept for API compat, not used directly
  filters: DetectedFilters
): Product[] {
  const remaining = filters.remainingQuery.toLowerCase().trim();
  const scored: ScoredProduct[] = [];

  for (const product of products) {

    // ── Hard filters ──────────────────────────────────────────────────────────

    if (filters.colors.length > 0) {
      const colorStr = product.color.toLowerCase();
      const nameStr = product.name.toLowerCase();
      const descStr = (product.description || '').toLowerCase();
      const combinedColor = `${colorStr} ${nameStr} ${descStr}`;

      const match = filters.colors.some(c => {
        const cl = c.toLowerCase().trim();
        return combinedColor.includes(cl) || cl.includes(colorStr) ||
          fuzzyMatch(cl, [colorStr]) !== null;
      });
      if (!match) continue;
    }

    if (filters.fabrics.length > 0) {
      const fabStr = product.fabric.toLowerCase().trim();

      const match = filters.fabrics.some(f => {
        const fl = f.toLowerCase().trim();
        return fabStr === fl || fabStr.includes(fl) || (fl.includes(fabStr) && fabStr !== 'silk');
      });
      if (!match) continue;
    }

    if (filters.occasions.length > 0) {
      const occStr = product.occasion.toLowerCase();
      const match = filters.occasions.some(o => {
        const ol = o.toLowerCase().trim();
        return occStr.includes(ol) || ol.includes(occStr);
      });
      if (!match) continue;
    }

    if (filters.categories.length > 0) {
      const catNorm = product.category.toLowerCase().replace(/[^a-z0-9]/g, '');

      const match = filters.categories.some(cat => {
        const selNorm = cat.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (catNorm === selNorm || catNorm.includes(selNorm) || selNorm.includes(catNorm)) {
          return true;
        }

        const knownCategories = ['banarasi', 'chikankari', 'chikan', 'bandhani', 'bandhej', 'organza', 'chanderi', 'bridal', 'kanjivaram'];
        const selKeyword = knownCategories.find(k => selNorm.includes(k));
        const catKeyword = knownCategories.find(k => catNorm.includes(k));

        if (selKeyword && catKeyword) {
          const root = (k: string) => (k === 'chikan' ? 'chikankari' : k === 'bandhej' ? 'bandhani' : k);
          return root(selKeyword) === root(catKeyword);
        }

        return false;
      });
      if (!match) continue;
    }

    // Price filter — compare against the actual selling price
    if (filters.price) {
      const effectivePrice = product.salePrice ?? product.price;
      if (filters.price.min !== undefined && effectivePrice < filters.price.min) continue;
      if (filters.price.max !== undefined && effectivePrice > filters.price.max) continue;
    }

    // SKU filter
    if (filters.skuMatch) {
      const skuStr = (product.sku || '').toUpperCase();
      if (!skuStr.includes(filters.skuMatch)) continue;
    }

    // ── Relevance scoring ─────────────────────────────────────────────────────

    let score = 0;

    if (remaining) {
      const nameLower = product.name.toLowerCase();
      const catLower = product.category.toLowerCase();
      const fabLower = product.fabric.toLowerCase();
      const colorLower = product.color.toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const skuLower = (product.sku || '').toLowerCase();
      const occLower = product.occasion.toLowerCase();

      // Full phrase matches (highest priority)
      if (nameLower === remaining)         score += 200;
      else if (nameLower.startsWith(remaining)) score += 160;
      else if (nameLower.includes(remaining))   score += 120;
      else if (skuLower.includes(remaining))    score += 180;
      else if (catLower === remaining)           score += 140;
      else if (catLower.includes(remaining))    score += 100;
      else if (fabLower.includes(remaining))    score += 80;
      else if (colorLower.includes(remaining))  score += 70;
      else if (occLower.includes(remaining))    score += 60;
      else if (descLower.includes(remaining))   score += 30;

      // Token-level scoring (accumulates regardless of phrase match)
      const queryTokens = remaining.split(/\s+/).filter(t => t.length >= 2);
      for (const tok of queryTokens) {
        if (nameLower.includes(tok))  score += 25;
        if (catLower.includes(tok))   score += 15;
        if (fabLower.includes(tok))   score += 12;
        if (colorLower.includes(tok)) score += 10;
        if (occLower.includes(tok))   score += 8;
        if (descLower.includes(tok))  score += 4;
      }

      // Fuzzy name match as fallback (only if still 0)
      if (score === 0) {
        const fuzzy = fuzzyMatch(remaining, [product.name, product.category, product.fabric, product.color]);
        if (fuzzy) score += 15;
      }

      // Skip products with absolutely no text relevance
      if (score === 0) continue;

    } else {
      // No remaining text — all passing-filter products are shown, sorted by quality
      score = 50;
    }

    // Quality boosts
    if (product.featured)    score += 6;
    if (product.bestseller)  score += 4;
    if (product.newArrival)  score += 2;
    if (product.stock > 5)   score += 1;

    scored.push({ product, score });
  }

  return scored.sort((a, b) => b.score - a.score).map(s => s.product);
}

// ─── Suggestion Generation ───────────────────────────────────────────────────

export interface SearchSuggestion {
  type: 'product' | 'category' | 'fabric' | 'color' | 'occasion' | 'price' | 'query';
  label: string;
  value: string;
  product?: Product;
  icon?: string;
}

export function generateSuggestions(query: string, products: Product[]): SearchSuggestion[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();

  const suggestions: SearchSuggestion[] = [];
  const seenLabels = new Set<string>();

  const addSugg = (s: SearchSuggestion) => {
    if (!seenLabels.has(s.label)) {
      seenLabels.add(s.label);
      suggestions.push(s);
    }
  };

  // 1. Parse the query to detect what filters are present
  const filters = parseSearchQuery(query);

  // 2. Detected filter suggestions (show at top with smart labels)
  if (filters.categories.length > 0) {
    filters.categories.forEach(cat => addSugg({ type: 'category', label: `${cat} Sarees`, value: query, icon: '🏷️' }));
  }
  if (filters.fabrics.length > 0) {
    filters.fabrics.forEach(fab => addSugg({ type: 'fabric', label: `${fab} Sarees`, value: query, icon: '✨' }));
  }
  if (filters.colors.length > 0) {
    filters.colors.forEach(col => addSugg({ type: 'color', label: `${col} Sarees`, value: query, icon: '🎨' }));
  }
  if (filters.occasions.length > 0) {
    filters.occasions.forEach(occ => addSugg({ type: 'occasion', label: `${occ} Sarees`, value: query, icon: '🎉' }));
  }
  if (filters.price) {
    addSugg({ type: 'price', label: `Sarees ${formatPriceFilter(filters.price)}`, value: query, icon: '💰' });
  }

  // 3. Product name matches (direct + fuzzy)
  const productMatches = products
    .filter(p => {
      const name = p.name.toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || desc.includes(q) ||
        (q.length >= 4 && fuzzyMatch(q, [name, p.category.toLowerCase(), p.fabric.toLowerCase()]) !== null);
    })
    .slice(0, 5);

  for (const p of productMatches) {
    addSugg({ type: 'product', label: p.name, value: p.name, product: p });
  }

  // 4. Category, fabric, color suggestions from product data
  const allCats = Array.from(new Set(products.map(p => p.category)));
  for (const cat of allCats) {
    if (cat.toLowerCase().includes(q)) {
      addSugg({ type: 'category', label: `${cat} Sarees`, value: cat, icon: '🏷️' });
    }
  }

  const allFabrics = Array.from(new Set(products.map(p => p.fabric)));
  for (const fab of allFabrics) {
    if (fab.toLowerCase().includes(q)) {
      addSugg({ type: 'fabric', label: `${fab} Sarees`, value: fab, icon: '✨' });
    }
  }

  const allColors = Array.from(new Set(products.map(p => p.color)));
  for (const col of allColors) {
    if (col.toLowerCase().includes(q)) {
      addSugg({ type: 'color', label: `${col} Sarees`, value: col, icon: '🎨' });
    }
  }

  return suggestions.slice(0, 8);
}

// ─── Price Filter Formatters ──────────────────────────────────────────────────

export function formatPriceFilter(price?: PriceFilter): string {
  if (!price) return '';
  if (price.min !== undefined && price.max !== undefined)
    return `₹${price.min.toLocaleString('en-IN')} – ₹${price.max.toLocaleString('en-IN')}`;
  if (price.max !== undefined)
    return `Under ₹${price.max.toLocaleString('en-IN')}`;
  if (price.min !== undefined)
    return `Above ₹${price.min.toLocaleString('en-IN')}`;
  return '';
}

// ─── URL Builder ──────────────────────────────────────────────────────────────

/**
 * Build the /sarees search URL from a raw query + its detected filters.
 * Stores both the raw query (for display) and the extracted filter params (for filtering).
 */
export function buildSearchUrl(
  rawQuery: string,
  filters: DetectedFilters,
  extraParams?: Record<string, string>
): string {
  const params = new URLSearchParams();

  // Always store the raw query so the search bar shows the original text
  if (rawQuery.trim()) params.set('search', rawQuery.trim());

  // Store extracted structured filters as explicit params
  if (filters.colors.length)    params.set('color',    filters.colors.join(','));
  if (filters.fabrics.length)   params.set('fabric',   filters.fabrics.join(','));
  if (filters.occasions.length) params.set('occasion', filters.occasions.join(','));
  if (filters.categories.length) params.set('category', filters.categories.join(','));
  if (filters.price?.min !== undefined) params.set('minPrice', String(filters.price.min));
  if (filters.price?.max !== undefined) params.set('maxPrice', String(filters.price.max));
  if (filters.skuMatch)          params.set('sku', filters.skuMatch);

  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v);
    }
  }

  return `/sarees?${params.toString()}`;
}
