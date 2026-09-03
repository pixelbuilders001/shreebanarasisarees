"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { ProductCard } from './ProductCard';
import { Product, PRODUCTS } from '../data/products';
import { SlidersHorizontal, ArrowUpDown, X, Search, ChevronDown, Check, Zap, Tag, RefreshCw, Filter } from 'lucide-react';
import { parseSearchQuery, scoreProducts, formatPriceFilter, type DetectedFilters } from '../lib/searchEngine';

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

const WEAVE_PILLS = [
  'Banarasi Katan',
  'Banarasi Silk',
  'Organza',
  'Bandhani Silk',
  'Bridal Silk',
  'Rangkaat Silk',
  'Shikargarh',
  'Satan Buti',
  'Tikli Viscose',
];

const OCCASION_PILLS = [
  'Wedding',
  'Reception',
  'Festive',
  'Party',
  'Daily',
];

const PRICE_PILLS = [
  { label: 'Under ₹3,000', value: 'under_3000' },
  { label: '₹3,000 – ₹5,000', value: '3000_5000' },
  { label: '₹5,000 – ₹8,000', value: '5000_8000' },
  { label: 'Above ₹8,000', value: 'above_8000' },
];

const COLOR_PILLS = [
  'Maroon',
  'Ivory',
  'Lavender',
  'Turquoise',
  'Red',
  'Pink',
  'Green',
  'Blue',
  'Yellow',
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'Newest' },
  { label: 'Price: low to high', value: 'Price Low to High' },
  { label: 'Price: high to low', value: 'Price High to Low' },
  { label: 'Bestselling', value: 'Best Selling' },
];

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
  const [is20MinOnly, setIs20MinOnly] = useState<boolean>(false);

  // Sort State
  const [sortBy, setSortBy] = useState<string>('Newest');

  // Modal / Bottom Sheet States (Mobile)
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  const urlFilters = useMemo<DetectedFilters>(() => {
    const parsed = urlSearch ? parseSearchQuery(urlSearch) : null;
    const colors    = urlColor    ? urlColor.split(',').filter(Boolean)    : (parsed?.colors    ?? []);
    const fabrics   = urlFabric   ? urlFabric.split(',').filter(Boolean)   : (parsed?.fabrics   ?? []);
    const occasions = urlOccasion ? urlOccasion.split(',').filter(Boolean) : (parsed?.occasions ?? []);
    const categories= urlCategory ? urlCategory.split(',').filter(Boolean) : (parsed?.categories?? []);

    const hasExplicitPrice = urlMinPrice !== undefined || urlMaxPrice !== undefined;
    const price = hasExplicitPrice
      ? { min: urlMinPrice, max: urlMaxPrice }
      : parsed?.price;

    const skuMatch = urlSku || parsed?.skuMatch;
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
    if (priceParam) setSelectedPriceRange(priceParam);

    const expressParam = searchParams.get('express');
    if (expressParam === 'true') setIs20MinOnly(true);
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
      params.delete('minPrice');
      params.delete('maxPrice');
      params.delete('search');
    } else if (type === 'skuMatch') {
      params.delete('sku');
    } else if (type === 'remainingQuery') {
      params.delete('search');
    }
    router.push(`/sarees?${params.toString()}`);
  };

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

  const handlePriceToggle = (val: string) => {
    setSelectedPriceRange(prev => prev === val ? 'All' : val);
  };

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange('All');
    setSelectedColors([]);
    setSelectedOccasions([]);
    setSelectedFabrics([]);
    setIs20MinOnly(false);
    setSortBy('Newest');
    router.push('/sarees');
  };

  // Check if any filters are active
  const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) +
    (selectedPriceRange !== 'All' ? 1 : 0) +
    selectedColors.length +
    selectedOccasions.length +
    selectedFabrics.length +
    (is20MinOnly ? 1 : 0);

  // ── Filter & Sort Logic ──
  let filteredProducts: Product[];

  if (hasAdvancedSearch) {
    filteredProducts = scoreProducts(allProducts, urlSearch, urlFilters);
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
    filteredProducts = allProducts.filter(product => {
      // 0. 20-min delivery filter
      if (is20MinOnly && product.stock <= 0) return false;

      // 1. Category Filter
      if (selectedCategory !== 'All') {
        const normalizeCat = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const selNorm = normalizeCat(selectedCategory);
        const catNorm = normalizeCat(product.category);

        let isMatch = catNorm === selNorm || catNorm.includes(selNorm) || selNorm.includes(catNorm);

        if (!isMatch) {
          const knownCategories = ['banarasi', 'chikankari', 'chikan', 'bandhani', 'bandhej', 'organza', 'chanderi', 'bridal', 'kanjivaram'];
          const selKeyword = knownCategories.find(k => selNorm.includes(k));
          const catKeyword = knownCategories.find(k => catNorm.includes(k));

          if (selKeyword && catKeyword) {
            const root = (k: string) => (k === 'chikan' ? 'chikankari' : k === 'bandhej' ? 'bandhani' : k);
            isMatch = root(selKeyword) === root(catKeyword);
          }
        }

        if (!isMatch) return false;
      }

      // 2. Price Filter
      const finalPrice = product.salePrice ?? product.price;
      if (selectedPriceRange !== 'All') {
        if (selectedPriceRange === 'under_3000' && finalPrice > 3000) return false;
        if (selectedPriceRange === '3000_5000' && (finalPrice < 3000 || finalPrice > 5000)) return false;
        if (selectedPriceRange === '5000_8000' && (finalPrice < 5000 || finalPrice > 8000)) return false;
        if (selectedPriceRange === 'above_8000' && finalPrice < 8000) return false;
        // Legacy range support
        if (selectedPriceRange === 'under_999' && finalPrice > 999) return false;
        if (selectedPriceRange === 'under_1499' && finalPrice > 1499) return false;
        if (selectedPriceRange === 'under_2000' && finalPrice > 2000) return false;
        if (selectedPriceRange === '5000_plus' && finalPrice < 5000) return false;
      }

      // 3. Color Filter
      if (selectedColors.length > 0) {
        const colorMatch = selectedColors.some(c => 
          product.color.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(product.color.toLowerCase())
        );
        if (!colorMatch) return false;
      }

      // 4. Occasion Filter
      if (selectedOccasions.length > 0) {
        const occMatch = selectedOccasions.some(o => 
          product.occasion.toLowerCase().includes(o.toLowerCase()) || o.toLowerCase().includes(product.occasion.toLowerCase())
        );
        if (!occMatch) return false;
      }

      // 5. Fabric Filter (Weave)
      if (selectedFabrics.length > 0) {
        const fabMatch = selectedFabrics.some(f => 
          product.fabric.toLowerCase().includes(f.toLowerCase()) ||
          product.name.toLowerCase().includes(f.toLowerCase()) ||
          product.category.toLowerCase().includes(f.toLowerCase())
        );
        if (!fabMatch) return false;
      }

      return true;
    });

    // Sort Logic
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const aPrice = a.salePrice ?? a.price;
      const bPrice = b.salePrice ?? b.price;
      if (sortBy === 'Price Low to High') return aPrice - bPrice;
      if (sortBy === 'Price High to Low') return bPrice - aPrice;
      if (sortBy === 'Newest') return (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0);
      if (sortBy === 'Best Selling') return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
      return 0;
    });
  }

  // ── Client-side Pagination (Load More) ──
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  const filterSignature = [
    selectedCategory,
    selectedPriceRange,
    selectedColors.join('~'),
    selectedOccasions.join('~'),
    selectedFabrics.join('~'),
    is20MinOnly ? '20min' : 'all',
    sortBy,
    hasAdvancedSearch ? `${urlSearch}|${urlColor}|${urlFabric}|${urlOccasion}|${urlCategory}|${urlMinPrice}|${urlMaxPrice}|${urlSku}` : '',
  ].join('|');

  const [lastSignature, setLastSignature] = useState<string>(filterSignature);
  if (lastSignature !== filterSignature) {
    setLastSignature(filterSignature);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  // Helper for Sidebar UI Elements
  const renderFilterSidebar = () => (
    <div className="space-y-6 text-[#292524]">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
        <h2 className="font-serif text-lg font-bold flex items-center gap-2">
          <Filter size={16} className="text-[#6B1725]" />
          <span>Filter Collection</span>
        </h2>
        {activeFiltersCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-xs font-bold text-[#6B1725] hover:underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. CATEGORY ACCORDION */}
      <div>
        <h3 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif mb-2.5">
          Category
        </h3>
        <div className="space-y-1">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF6EE] text-[#6B1725] font-bold border border-[#E5DEC9]'
                    : 'text-[#292524] hover:bg-[#FAF7F0]'
                }`}
              >
                <span>{cat} Sarees</span>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#6B1725]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. WEAVE / FABRIC SECTION */}
      <div>
        <h3 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif mb-2.5">
          Weave / Fabric
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {WEAVE_PILLS.map((weave) => {
            const isSelected = selectedFabrics.includes(weave);
            return (
              <button
                key={weave}
                onClick={() => handleFabricToggle(weave)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#6B1725] text-white border-[#6B1725] font-semibold shadow-xs'
                    : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                }`}
              >
                {weave}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. OCCASION SECTION */}
      <div>
        <h3 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif mb-2.5">
          Occasion
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {OCCASION_PILLS.map((occ) => {
            const isSelected = selectedOccasions.includes(occ);
            return (
              <button
                key={occ}
                onClick={() => handleOccasionToggle(occ)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#6B1725] text-white border-[#6B1725] font-semibold shadow-xs'
                    : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                }`}
              >
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PRICE RANGE SECTION */}
      <div>
        <h3 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif mb-2.5">
          Price Range
        </h3>
        <div className="space-y-1.5">
          {PRICE_PILLS.map((p) => {
            const isSelected = selectedPriceRange === p.value;
            return (
              <button
                key={p.value}
                onClick={() => handlePriceToggle(p.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans transition-all text-left cursor-pointer border ${
                  isSelected
                    ? 'bg-[#FAF6EE] border-[#6B1725] text-[#6B1725] font-bold shadow-xs'
                    : 'bg-white border-[#E5DEC9] text-[#292524] hover:border-[#6B1725]'
                }`}
              >
                <span>{p.label}</span>
                {isSelected && <Check size={14} className="text-[#6B1725]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. COLOR SWATCHES */}
      <div>
        <h3 className="text-xs font-bold text-[#7A6E65] uppercase tracking-wider font-serif mb-2.5">
          Color
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PILLS.map((color) => {
            const isSelected = selectedColors.includes(color);
            return (
              <button
                key={color}
                onClick={() => handleColorToggle(color)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#6B1725] text-white border-[#6B1725] font-semibold shadow-xs'
                    : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />

      <main className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24">

        {/* Breadcrumbs */}
        <nav className="text-xs text-[#7A6E65] font-medium mb-2 flex items-center gap-1 select-none">
          <Link href="/" className="hover:text-[#6B1725] transition-colors">Home</Link>
          <span>/</span>
          {selectedCategory !== 'All' ? (
            <>
              <Link href="/sarees" className="hover:text-[#6B1725] transition-colors">Sarees</Link>
              <span>/</span>
              <span className="text-[#292524] font-semibold">{selectedCategory}</span>
            </>
          ) : selectedOccasions.length === 1 ? (
            <>
              <Link href="/sarees" className="hover:text-[#6B1725] transition-colors">Sarees</Link>
              <span>/</span>
              <span className="text-[#292524] font-semibold">{selectedOccasions[0]}</span>
            </>
          ) : (
            <span className="text-[#292524] font-semibold">Sarees</span>
          )}
        </nav>

        {/* Category Header Title & Filter Count */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5DEC9] pb-3 mb-6">
          <div className="min-w-0">
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#292524] flex items-baseline gap-2 flex-wrap">
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
              <span className="text-xs font-semibold text-[#7A6E65] font-sans">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'saree' : 'sarees'})
              </span>
            </h1>

            {/* Active Filter Badges (Advanced Search) */}
            {hasAdvancedSearch && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {urlFilters.remainingQuery && (
                  <span className="inline-flex items-center gap-1 bg-[#292524]/5 text-[#292524] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#292524]/10">
                    <Search size={10} />
                    &quot;{urlFilters.remainingQuery}&quot;
                    <button onClick={() => removeFilterChip('remainingQuery')} className="ml-0.5 hover:text-[#6B1725] transition-colors" aria-label="Remove search">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {urlFilters.categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 bg-[#6B1725]/10 text-[#6B1725] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#6B1725]/20">
                    <Tag size={10} /> {cat}
                    <button onClick={() => removeFilterChip('categories', cat)} className="ml-0.5 hover:text-[#52111C]" aria-label={`Remove ${cat}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.fabrics.map(fab => (
                  <span key={fab} className="inline-flex items-center gap-1 bg-[#B08A3C]/10 text-[#292524] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#B08A3C]/20">
                    ✨ {fab}
                    <button onClick={() => removeFilterChip('fabrics', fab)} className="ml-0.5 hover:text-[#6B1725]" aria-label={`Remove ${fab}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.colors.map(col => (
                  <span key={col} className="inline-flex items-center gap-1 bg-[#FAF6EE] text-[#292524] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#E5DEC9]">
                    🎨 {col}
                    <button onClick={() => removeFilterChip('colors', col)} className="ml-0.5 hover:text-[#6B1725]" aria-label={`Remove ${col}`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {urlFilters.price && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                    💰 {formatPriceFilter(urlFilters.price)}
                    <button onClick={() => removeFilterChip('price')} className="ml-0.5 hover:text-emerald-950" aria-label="Remove price filter">
                      <X size={10} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => router.push('/sarees')}
                  className="text-[11px] font-bold text-[#6B1725] hover:underline px-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Desktop Sort Dropdown Bar */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs font-serif font-bold text-[#7A6E65] uppercase tracking-wider">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAF6EE] border border-[#E5DEC9] text-[#292524] text-xs font-sans font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#6B1725] transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 2-COLUMN RESPONSIVE LAYOUT (SIDEBAR FILTER ON DESKTOP + GRID) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-8 items-start">
          
          {/* Desktop Sidebar (Left Column - hidden on mobile) */}
          <aside className="hidden lg:block lg:col-span-1 border-r border-[#E5DEC9] pr-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
            {renderFilterSidebar()}
          </aside>

          {/* Main Product Grid Area (Right Column on desktop) */}
          <div className="col-span-1 lg:col-span-3 xl:col-span-4 w-full">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-[#E5DEC9] rounded-2xl shadow-2xs px-4">
                <Search size={48} className="text-[#7A6E65]/30 mb-4 animate-pulse" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#292524] mb-2">
                  No matching sarees found
                </h3>
                <p className="text-sm text-[#7A6E65] max-w-sm mb-6 leading-relaxed">
                  We couldn&apos;t find any sarees matching your selected filters. Try adjusting your selections or reset.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 bg-[#6B1725] text-white rounded-full font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] active:scale-95 transition-all shadow"
                >
                  RESET FILTERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-5">
                {visibleProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}

            {filteredProducts.length > 0 && visibleCount < filteredProducts.length && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="text-xs font-medium text-[#7A6E65]">
                  Showing {visibleProducts.length} of {filteredProducts.length} sarees
                </div>
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="px-8 py-3 bg-[#6B1725] text-white rounded-full font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Load More ({filteredProducts.length - visibleCount} left)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── 1. FLOATING PILL BAR (SORT & FILTER) - MOBILE ONLY (lg:hidden) ── */}
      <div className="lg:hidden fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[45]">
        <div className="bg-white/95 backdrop-blur-md border border-[#E5DEC9] rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 text-sm font-sans font-semibold text-[#292524] select-none transition-all hover:scale-105 active:scale-95">
          {/* SORT BUTTON */}
          <button
            onClick={() => setIsSortModalOpen(true)}
            className="flex items-center gap-2 hover:text-[#6B1725] transition-colors cursor-pointer"
          >
            <ArrowUpDown size={16} className="text-[#292524]" />
            <span>Sort</span>
          </button>

          {/* DIVIDER */}
          <div className="w-px h-5 bg-[#E5DEC9]" />

          {/* FILTER BUTTON */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 hover:text-[#6B1725] transition-colors cursor-pointer relative"
          >
            <SlidersHorizontal size={16} className="text-[#292524]" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#6B1725] absolute -top-1 -right-2 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* ── 2. "SORT BY" BOTTOM SHEET / MODAL (MOBILE ONLY) ── */}
      {isSortModalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center p-0 animate-fadeIn">
          {/* BACKDROP CLICK */}
          <div className="absolute inset-0" onClick={() => setIsSortModalOpen(false)} />

          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3 mb-2">
              <h2 className="font-serif text-xl font-bold text-[#292524]">Sort by</h2>
              <button
                onClick={() => setIsSortModalOpen(false)}
                className="p-1 text-[#7A6E65] hover:text-[#292524] rounded-full transition-colors cursor-pointer"
                aria-label="Close sort modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Options List */}
            <div className="divide-y divide-[#F3ECE0]">
              {SORT_OPTIONS.map((option) => {
                const isSelected = sortBy === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortModalOpen(false);
                    }}
                    className="py-3.5 px-2 flex items-center justify-between text-sm font-sans font-medium text-[#292524] hover:bg-[#FAF6EE] rounded-xl transition-colors cursor-pointer"
                  >
                    <span className={isSelected ? 'font-bold text-[#6B1725]' : ''}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={18} className="text-[#6B1725] stroke-[2.5]" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. "FILTERS" BOTTOM SHEET / DRAWER (MOBILE ONLY) ── */}
      {isFilterModalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center p-0 animate-fadeIn">
          {/* BACKDROP CLICK */}
          <div className="absolute inset-0" onClick={() => setIsFilterModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-[#FAF7F0] rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl z-10 overflow-hidden animate-slideUp">
            
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-[#E5DEC9] flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold text-[#292524]">Filters</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 text-[#7A6E65] hover:text-[#292524] rounded-full transition-colors cursor-pointer"
                aria-label="Close filters modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* 2. WEAVE SECTION */}
              <div>
                <span className="text-[11px] font-sans font-bold tracking-widest text-[#B08A3C] uppercase mb-3 block">
                  WEAVE
                </span>
                <div className="flex flex-wrap gap-2">
                  {WEAVE_PILLS.map((weave) => {
                    const isSelected = selectedFabrics.includes(weave);
                    return (
                      <button
                        key={weave}
                        onClick={() => handleFabricToggle(weave)}
                        className={`rounded-full px-4 py-2 text-xs font-sans font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-2xs'
                            : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                        }`}
                      >
                        {weave}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. OCCASION SECTION */}
              <div>
                <span className="text-[11px] font-sans font-bold tracking-widest text-[#B08A3C] uppercase mb-3 block">
                  OCCASION
                </span>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_PILLS.map((occ) => {
                    const isSelected = selectedOccasions.includes(occ);
                    return (
                      <button
                        key={occ}
                        onClick={() => handleOccasionToggle(occ)}
                        className={`rounded-full px-4 py-2 text-xs font-sans font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-2xs'
                            : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                        }`}
                      >
                        {occ}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. PRICE SECTION */}
              <div>
                <span className="text-[11px] font-sans font-bold tracking-widest text-[#B08A3C] uppercase mb-3 block">
                  PRICE
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRICE_PILLS.map((p) => {
                    const isSelected = selectedPriceRange === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => handlePriceToggle(p.value)}
                        className={`rounded-full px-4 py-2 text-xs font-sans font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-2xs'
                            : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. COLOR SECTION */}
              <div>
                <span className="text-[11px] font-sans font-bold tracking-widest text-[#B08A3C] uppercase mb-3 block">
                  COLOR
                </span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PILLS.map((color) => {
                    const isSelected = selectedColors.includes(color);
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorToggle(color)}
                        className={`rounded-full px-4 py-2 text-xs font-sans font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6B1725] text-white border-[#6B1725] shadow-2xs'
                            : 'bg-white text-[#292524] border-[#E5DEC9] hover:border-[#6B1725]'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 bg-white border-t border-[#E5DEC9] flex items-center gap-3 shadow-md shrink-0">
              <button
                onClick={resetAllFilters}
                className="py-3 px-6 rounded-full border border-[#E5DEC9] text-[#292524] hover:border-[#6B1725] text-xs font-sans font-bold transition-all cursor-pointer flex-1 text-center"
              >
                Clear all
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="py-3 px-6 rounded-full bg-[#6B1725] hover:bg-[#52111C] text-white text-xs font-sans font-bold transition-all cursor-pointer flex-[1.5] text-center shadow-md"
              >
                Show {filteredProducts.length} {filteredProducts.length === 1 ? 'saree' : 'sarees'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};
