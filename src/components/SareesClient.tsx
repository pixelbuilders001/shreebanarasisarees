"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProductCard } from './ProductCard';
import { Product, PRODUCTS } from '../data/products';
import { Filter, SlidersHorizontal, X, Search, ChevronDown, BookOpen, Sparkles, Tag } from 'lucide-react';
import { parseSearchQuery, scoreProducts, formatPriceFilter, buildSearchUrl, type DetectedFilters } from '../lib/searchEngine';

const PAGE_SIZE = 24;
const INITIAL_VISIBLE_COUNT = PAGE_SIZE;

interface SareesClientProps {
  initialCategory: string;
  initialOccasion: string;
  h1Title: string;
  introductoryContent: string;
  allProducts?: Product[];
  categoriesList?: string[];
}

export const SareesClient: React.FC<SareesClientProps> = ({
  initialCategory,
  initialOccasion,
  h1Title,
  introductoryContent,
  allProducts = PRODUCTS,
  categoriesList = ['All', 'Banarasi', 'Chikankari', 'Bandhani', 'Organza', 'Chanderi', 'Bridal', 'Offers'],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    initialOccasion !== 'All' ? [initialOccasion] : []
  );
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);

  // Sort State
  const [sortBy, setSortBy] = useState<string>('Recommended');

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ── Advanced search params from URL ──
  const urlSearch   = searchParams.get('search')   || '';
  const urlColor    = searchParams.get('color')    || '';
  const urlFabric   = searchParams.get('fabric')   || '';
  const urlOccasion = searchParams.get('occasion') || '';
  const urlCategory = searchParams.get('category') || '';
  const rawMinPrice = searchParams.get('minPrice');
  const rawMaxPrice = searchParams.get('maxPrice');
  const parsedMin = rawMinPrice ? Number(rawMinPrice) : undefined;
  const parsedMax = rawMaxPrice ? Number(rawMaxPrice) : undefined;
  const urlMinPrice = parsedMin !== undefined && !isNaN(parsedMin) && parsedMin >= 0 ? parsedMin : undefined;
  const urlMaxPrice = parsedMax !== undefined && !isNaN(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;
  const urlSku      = searchParams.get('sku')      || '';

  /**
   * KEY FIX: Re-parse the raw urlSearch to get the proper CLEANED remainingQuery.
   * Without this, "under 2000" stays as remainingQuery and fails to match any product name.
   *
   * Priority:
   *  • Explicit URL params (color=, fabric=, minPrice=, etc.) WIN over parsed-from-text.
   *  • remainingQuery always comes from the cleaned parse of urlSearch.
   */
  const urlFilters = useMemo<DetectedFilters>(() => {
    // Parse the raw search string to extract its cleaned remaining text + any implicit filters
    const parsed = urlSearch ? parseSearchQuery(urlSearch) : null;

    // Explicit URL params take precedence; fall back to what was parsed from the search text
    const colors    = urlColor    ? urlColor.split(',').filter(Boolean)    : (parsed?.colors    ?? []);
    const fabrics   = urlFabric   ? urlFabric.split(',').filter(Boolean)   : (parsed?.fabrics   ?? []);
    const occasions = urlOccasion ? urlOccasion.split(',').filter(Boolean) : (parsed?.occasions ?? []);
    const categories= urlCategory ? urlCategory.split(',').filter(Boolean) : (parsed?.categories?? []);

    const hasExplicitPrice = urlMinPrice !== undefined || urlMaxPrice !== undefined;
    const price = hasExplicitPrice
      ? { min: urlMinPrice, max: urlMaxPrice }
      : parsed?.price;

    const skuMatch = urlSku || parsed?.skuMatch;

    // THE FIX: use the CLEANED remaining query from parsing, not the raw urlSearch
    const remainingQuery = parsed?.remainingQuery ?? '';

    return { colors, fabrics, occasions, categories, price, skuMatch, remainingQuery };
  }, [urlSearch, urlColor, urlFabric, urlOccasion, urlCategory, urlMinPrice, urlMaxPrice, urlSku]);

  const hasAdvancedSearch = !!(
    urlSearch || urlColor || urlFabric || urlOccasion || urlCategory ||
    urlMinPrice !== undefined || urlMaxPrice !== undefined || urlSku
  );

  // Sync state if server props change (navigation)
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setSelectedOccasions(initialOccasion !== 'All' ? [initialOccasion] : []);
    
    const priceParam = searchParams.get('priceRange');
    setSelectedPriceRange(priceParam || 'All');
  }, [initialCategory, initialOccasion, searchParams]);

  // Helper: remove a filter chip and re-push URL
  const removeFilterChip = (type: keyof DetectedFilters, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'colors') {
      const remaining = urlColor.split(',').filter(c => c !== value).join(',');
      remaining ? params.set('color', remaining) : params.delete('color');
    } else if (type === 'fabrics') {
      const remaining = urlFabric.split(',').filter(f => f !== value).join(',');
      remaining ? params.set('fabric', remaining) : params.delete('fabric');
    } else if (type === 'occasions') {
      const remaining = urlOccasion.split(',').filter(o => o !== value).join(',');
      remaining ? params.set('occasion', remaining) : params.delete('occasion');
    } else if (type === 'categories') {
      const remaining = urlCategory.split(',').filter(c => c !== value).join(',');
      remaining ? params.set('category', remaining) : params.delete('category');
    } else if (type === 'price') {
      // Remove explicit price params
      params.delete('minPrice');
      params.delete('maxPrice');
      // Also clear the raw search since it may have contained the price phrase
      // (re-search without the price part would be ambiguous, so clear it too)
      params.delete('search');
    } else if (type === 'skuMatch') {
      params.delete('sku');
    } else if (type === 'remainingQuery') {
      params.delete('search');
      // Keep structured filter params; they were extracted and stored separately
    }
    router.push(`/sarees?${params.toString()}`);
  };

  // Categories & attributes list
  const colorsList = ['Red', 'Pink', 'Green', 'Blue', 'Yellow', 'Black', 'White', 'Maroon', 'Purple'];
  const occasionsList = ['Wedding', 'Festive', 'Party', 'Daily Wear', 'Office', 'Gift'];
  const fabricsList = ['Silk', 'Cotton', 'Organza', 'Chanderi Silk', 'Georgette', 'Banarasi Silk'];

  // Toggle Filters
  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const handleOccasionToggle = (occ: string) => {
    setSelectedOccasions(prev => prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ]);
  };

  const handleFabricToggle = (fab: string) => {
    setSelectedFabrics(prev => prev.includes(fab) ? prev.filter(f => f !== fab) : [...prev, fab]);
  };

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange('All');
    setSelectedColors([]);
    setSelectedOccasions([]);
    setSelectedFabrics([]);
    setSortBy('Recommended');
    router.push('/sarees');
  };

  // ── Filter & Sort Logic ──
  let filteredProducts: Product[];

  if (hasAdvancedSearch) {
    // Advanced search: use search engine for scoring + filtering
    filteredProducts = scoreProducts(allProducts, urlSearch, urlFilters);
    // Sort (if not Recommended)
    if (sortBy !== 'Recommended') {
      filteredProducts = [...filteredProducts].sort((a, b) => {
        const aP = a.salePrice ?? a.price;
        const bP = b.salePrice ?? b.price;
        if (sortBy === 'Price Low to High') return aP - bP;
        if (sortBy === 'Price High to Low') return bP - aP;
        if (sortBy === 'Newest') return (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0);
        if (sortBy === 'Best Selling') return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
        return 0;
      });
    }
  } else {
    // Classic sidebar filter logic
    filteredProducts = allProducts.filter(product => {
      // 1. Category Filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;

      // 2. Price Filter
      const finalPrice = product.salePrice ?? product.price;
      if (selectedPriceRange !== 'All') {
        if (selectedPriceRange === 'under_999' && finalPrice > 999) return false;
        if (selectedPriceRange === 'under_1499' && finalPrice > 1499) return false;
        if (selectedPriceRange === 'under_2000' && finalPrice > 2000) return false;
        if (selectedPriceRange === 'under_1000' && finalPrice > 1000) return false;
        if (selectedPriceRange === '1000_2000' && (finalPrice < 1000 || finalPrice > 2000)) return false;
        if (selectedPriceRange === '2000_5000' && (finalPrice < 2000 || finalPrice > 5000)) return false;
        if (selectedPriceRange === '5000_plus' && finalPrice < 5000) return false;
      }

      // 3. Color Filter
      if (selectedColors.length > 0 && !selectedColors.includes(product.color)) return false;

      // 4. Occasion Filter
      if (selectedOccasions.length > 0 && !selectedOccasions.includes(product.occasion)) return false;

      // 5. Fabric Filter
      if (selectedFabrics.length > 0 && !selectedFabrics.includes(product.fabric)) return false;

      return true;
    });

    // Sort Logic
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const aPrice = a.salePrice ?? a.price;
      const bPrice = b.salePrice ?? b.price;
      if (sortBy === 'Price Low to High') return aPrice - bPrice;
      if (sortBy === 'Price High to Low') return bPrice - aPrice;
      if (sortBy === 'Newest') return b.newArrival ? 1 : -1;
      if (sortBy === 'Best Selling') return b.bestseller ? 1 : -1;
      return 0;
    });
  }

  // ── Client-side Pagination (Load More) ──
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Filter signature — changing any filter/sort/search resets pagination back to page 1
  const filterSignature = [
    selectedCategory,
    selectedPriceRange,
    selectedColors.join('~'),
    selectedOccasions.join('~'),
    selectedFabrics.join('~'),
    sortBy,
    hasAdvancedSearch ? `${urlSearch}|${urlColor}|${urlFabric}|${urlOccasion}|${urlCategory}|${urlMinPrice}|${urlMaxPrice}|${urlSku}` : '',
  ].join('|');

  const [lastSignature, setLastSignature] = useState<string>(filterSignature);
  if (lastSignature !== filterSignature) {
    setLastSignature(filterSignature);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <>
      <Header />

      <main className="max-w-[1650px] mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">

        {/* Breadcrumbs */}
        <nav className="text-xs text-dark-brown/50 font-medium mb-2 flex items-center gap-1 select-none">
          <Link href="/" className="hover:text-maroon">Home</Link>
          <span>/</span>
          {selectedCategory !== 'All' ? (
            <>
              <Link href="/sarees" className="hover:text-maroon">Sarees</Link>
              <span>/</span>
              <span className="text-dark-brown font-semibold">{selectedCategory}</span>
            </>
          ) : selectedOccasions.length === 1 ? (
            <>
              <Link href="/sarees" className="hover:text-maroon">Sarees</Link>
              <span>/</span>
              <span className="text-dark-brown font-semibold">{selectedOccasions[0]}</span>
            </>
          ) : (
            <span className="text-dark-brown font-semibold">Sarees</span>
          )}
        </nav>

        {/* Category Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cream pb-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-serif text-lg sm:text-xl lg:text-2xl font-extrabold text-dark-brown flex items-baseline gap-2 flex-wrap">
              {hasAdvancedSearch
                ? urlSearch
                  ? `Results for "${urlSearch}"`
                  : urlFilters.price
                    ? `Sarees ${formatPriceFilter(urlFilters.price)}`
                    : urlFilters.categories.length
                      ? `${urlFilters.categories.join(', ')} Sarees`
                      : urlFilters.fabrics.length
                        ? `${urlFilters.fabrics.join(', ')} Sarees`
                        : urlFilters.colors.length
                          ? `${urlFilters.colors.join(', ')} Sarees`
                          : urlFilters.occasions.length
                            ? `${urlFilters.occasions.join(', ')} Sarees`
                            : h1Title
                : h1Title
              }
              <span className="text-xs font-semibold text-dark-brown/40 font-sans">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'})
              </span>
            </h1>

            {/* ── Active Filter Chips (Advanced Search) ── */}
            {hasAdvancedSearch && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {urlFilters.remainingQuery && (
                  <span className="inline-flex items-center gap-1 bg-dark-brown/5 text-dark-brown text-[11px] font-semibold px-2.5 py-1 rounded-full border border-dark-brown/10">
                    <Search size={10} />
                    &quot;{urlFilters.remainingQuery}&quot;
                    <button onClick={() => removeFilterChip('remainingQuery')} className="ml-0.5 hover:text-maroon transition-colors" aria-label="Remove search">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {urlFilters.categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 bg-maroon/10 text-maroon text-[11px] font-semibold px-2.5 py-1 rounded-full border border-maroon/20">
                    <Tag size={10} /> {cat}
                    <button onClick={() => removeFilterChip('categories', cat)} className="ml-0.5 hover:text-maroon-dark" aria-label={`Remove ${cat}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.fabrics.map(fab => (
                  <span key={fab} className="inline-flex items-center gap-1 bg-gold/10 text-dark-brown text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gold/20">
                    ✨ {fab}
                    <button onClick={() => removeFilterChip('fabrics', fab)} className="ml-0.5 hover:text-maroon" aria-label={`Remove ${fab}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.colors.map(col => (
                  <span key={col} className="inline-flex items-center gap-1 bg-cream text-dark-brown text-[11px] font-semibold px-2.5 py-1 rounded-full border border-cream">
                    🎨 {col}
                    <button onClick={() => removeFilterChip('colors', col)} className="ml-0.5 hover:text-maroon" aria-label={`Remove ${col}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.occasions.map(occ => (
                  <span key={occ} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-green-100">
                    🎉 {occ}
                    <button onClick={() => removeFilterChip('occasions', occ)} className="ml-0.5 hover:text-green-900" aria-label={`Remove ${occ}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.price && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                    💰 {formatPriceFilter(urlFilters.price)}
                    <button onClick={() => removeFilterChip('price')} className="ml-0.5 hover:text-blue-900" aria-label="Remove price filter">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {urlFilters.skuMatch && (
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-purple-100">
                    SKU: {urlFilters.skuMatch}
                    <button onClick={() => removeFilterChip('skuMatch')} className="ml-0.5 hover:text-purple-900" aria-label="Remove SKU filter">
                      <X size={10} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => router.push('/sarees')}
                  className="text-[11px] font-bold text-maroon hover:underline px-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Sorting Dropdown & Mobile Filter Trigger */}
          <div className="flex items-center gap-3 justify-between md:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden py-2 px-4 border border-cream text-dark-brown text-xs font-bold rounded flex items-center gap-2 bg-white hover:bg-cream/10 active:scale-95 transition-all"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dark-brown/50 hidden sm:inline">SORT BY:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-cream rounded py-2 pl-4 pr-10 text-xs font-bold text-dark-brown cursor-pointer outline-none focus:border-gold"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Newest">Newest Arrivals</option>
                  <option value="Price Low to High">Price: Low to High</option>
                  <option value="Price High to Low">Price: High to Low</option>
                  <option value="Best Selling">Best Selling</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-brown/50 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* SEO Informative Introductory Content - Visible to users and search bots */}
        {/* {introductoryContent && (
          <div className="mb-8 p-5 bg-cream/15 rounded-lg border border-cream/50 max-w-4xl">
            <div className="flex items-start gap-3">
              <BookOpen size={18} className="text-gold mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-dark-brown/80 leading-relaxed font-light">
                {introductoryContent}
              </p>
            </div>
          </div>
        )} */}

        <div className="flex gap-4 xl:gap-5 items-start">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0 bg-white border border-cream p-4 rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-cream pb-2">
              <h2 className="font-serif font-bold text-dark-brown text-sm flex items-center gap-2">
                <Filter size={16} className="text-maroon" />
                Filters
              </h2>
              <button
                onClick={resetAllFilters}
                className="text-xs text-maroon hover:underline font-bold"
              >
                Reset All
              </button>
            </div>

            {/* Filter Group: Category */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Category</h3>
              <div className="space-y-1.5">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat !== 'All') {
                        router.push(`/sarees/${cat.toLowerCase()}`);
                      } else {
                        router.push('/sarees');
                      }
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium transition-colors ${selectedCategory === cat
                        ? 'bg-maroon text-ivory font-bold'
                        : 'text-dark-brown/85 hover:bg-cream/30'
                      }`}
                  >
                    {cat === 'All' ? 'All Sarees' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group: Price */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Price</h3>
              <div className="space-y-1.5 text-xs text-dark-brown/85 font-medium">
                {[
                  { label: 'All Prices', value: 'All' },
                  { label: 'Under ₹999', value: 'under_999' },
                  { label: 'Under ₹1,499', value: 'under_1499' },
                  { label: 'Under ₹2,000', value: 'under_2000' },
                  { label: '₹2,000 – ₹5,000', value: '2000_5000' },
                  { label: '₹5,000+', value: '5000_plus' }
                ].map((range) => (
                  <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === range.value}
                      onChange={() => setSelectedPriceRange(range.value)}
                      className="accent-maroon"
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Color */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Color</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-dark-brown/85 font-medium">
                {colorsList.map((color) => (
                  <label key={color} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={() => handleColorToggle(color)}
                      className="rounded text-maroon accent-maroon"
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Occasion */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Occasion</h3>
              <div className="space-y-1.5 text-xs text-dark-brown/85 font-medium">
                {occasionsList.map((occ) => (
                  <label key={occ} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(occ)}
                      onChange={() => handleOccasionToggle(occ)}
                      className="rounded text-maroon accent-maroon"
                    />
                    {occ}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Fabric */}
            <div className="space-y-2 border-t border-cream/50 pt-4">
              <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Fabric</h3>
              <div className="space-y-1.5 text-xs text-dark-brown/85 font-medium">
                {fabricsList.map((fab) => (
                  <label key={fab} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(fab)}
                      onChange={() => handleFabricToggle(fab)}
                      className="rounded text-maroon accent-maroon"
                    />
                    {fab}
                  </label>
                ))}
              </div>
            </div>

          </aside>

          {/* Product Grid Area */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-lg shadow-sm px-4">
                <Search size={48} className="text-dark-brown/25 mb-4 animate-pulse" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown mb-2">
                  No matching sarees found
                </h3>
                <p className="text-sm text-dark-brown/60 max-w-sm mb-6 leading-relaxed">
                  We couldn't find any sarees matching your selected filters. Try adjusting your selections or reset.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-105 active:scale-95 transition-all shadow"
                >
                  RESET FILTERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 sm:gap-1.5 lg:gap-2">
                {visibleProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
            {filteredProducts.length > 0 && visibleCount < filteredProducts.length && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="text-xs font-medium text-dark-brown/50">
                  Showing {visibleProducts.length} of {filteredProducts.length} sarees
                </div>
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="px-8 py-3 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-105 active:scale-95 transition-all shadow"
                >
                  Load More ({filteredProducts.length - visibleCount} left)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Slideout Menu */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />

          <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-[#FFF9F0] shadow-2xl flex flex-col z-50 animate-slide-in-left">
            <div className="px-5 py-6 bg-white border-b border-cream flex items-center justify-between">
              <span className="font-serif text-lg font-bold text-maroon">Filters</span>
              <div className="flex items-center gap-3">
                <button onClick={resetAllFilters} className="text-xs text-maroon font-bold underline">Reset</button>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 rounded-full text-dark-brown/60 hover:text-maroon hover:bg-cream/40">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Category */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Category</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsMobileFilterOpen(false);
                        if (cat !== 'All') {
                          router.push(`/sarees/${cat.toLowerCase()}`);
                        } else {
                          router.push('/sarees');
                        }
                      }}
                      className={`text-center py-2 px-1 border rounded text-xs font-medium transition-colors ${selectedCategory === cat
                          ? 'bg-maroon border-maroon text-ivory font-bold'
                          : 'bg-white border-cream text-dark-brown/80'
                        }`}
                    >
                      {cat === 'All' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Price</h3>
                <div className="space-y-2 text-xs text-dark-brown/80">
                  {[
                    { label: 'All Prices', value: 'All' },
                    { label: 'Under ₹999', value: 'under_999' },
                    { label: 'Under ₹1,499', value: 'under_1499' },
                    { label: 'Under ₹2,000', value: 'under_2000' },
                    { label: '₹2,000 – ₹5,000', value: '2000_5000' },
                    { label: '₹5,000+', value: '5000_plus' }
                  ].map((range) => (
                    <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mobilePrice"
                        checked={selectedPriceRange === range.value}
                        onChange={() => setSelectedPriceRange(range.value)}
                        className="accent-maroon"
                      />
                      {range.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Color</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-dark-brown/80 font-medium">
                  {colorsList.map((color) => (
                    <label key={color} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => handleColorToggle(color)}
                        className="accent-maroon rounded"
                      />
                      {color}
                    </label>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Occasion</h3>
                <div className="space-y-2 text-xs text-dark-brown/85 font-medium">
                  {occasionsList.map((occ) => (
                    <label key={occ} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOccasions.includes(occ)}
                        onChange={() => handleOccasionToggle(occ)}
                        className="accent-maroon rounded"
                      />
                      {occ}
                    </label>
                  ))}
                </div>
              </div>

              {/* Fabric */}
              <div className="space-y-2 border-t border-cream/50 pt-4">
                <h3 className="text-xs font-bold text-dark-brown/70 uppercase tracking-wide">Fabric</h3>
                <div className="space-y-2 text-xs text-dark-brown/85 font-medium">
                  {fabricsList.map((fab) => (
                    <label key={fab} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFabrics.includes(fab)}
                        onChange={() => handleFabricToggle(fab)}
                        className="accent-maroon rounded"
                      />
                      {fab}
                    </label>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 bg-white border-t border-cream flex gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 bg-maroon text-ivory text-center rounded font-serif font-bold text-xs uppercase tracking-wider"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};
