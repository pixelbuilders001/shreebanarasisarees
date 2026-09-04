"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, Search, X, Clock, TrendingUp, Mic, Sparkles, Tag, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  parseSearchQuery,
  generateSuggestions,
  buildSearchUrl,
  formatPriceFilter,
  type SearchSuggestion,
  type DetectedFilters,
} from '../lib/searchEngine';
import { Product } from '../data/products';

interface SearchViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchViewModal: React.FC<SearchViewModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const {
    products,
    categories,
    isCategoriesLoading,
    searchQuery,
    setSearchQuery,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [detectedFilters, setDetectedFilters] = useState<DetectedFilters | null>(null);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic browse categories derived from DB categories & products API
  const dynamicBrowseCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(c => {
        const matchedProduct = products?.find(
          p => p.category.toLowerCase() === c.name.toLowerCase() ||
            p.fabric.toLowerCase().includes(c.name.toLowerCase())
        );
        return {
          name: c.name,
          image: c.image_url || matchedProduct?.images?.[0] || '',
          query: c.name,
        };
      });
    }

    if (products && products.length > 0) {
      const uniqueCats = Array.from(new Set(products.map(p => p.category)));
      return uniqueCats.map(catName => {
        const prod = products.find(p => p.category === catName);
        return {
          name: catName,
          image: prod?.images?.[0] || '',
          query: catName,
        };
      });
    }

    return [];
  }, [categories, products]);

  // Dynamic trending search chips derived from API categories and products
  const trendingChips = useMemo(() => {
    const chips: { label: string; query: string }[] = [];
    if (categories && categories.length > 0) {
      categories.slice(0, 4).forEach(c => {
        chips.push({ label: `${c.name} Sarees`, query: c.name });
      });
    } else if (products && products.length > 0) {
      const uniqueCats = Array.from(new Set(products.map(p => p.category)));
      uniqueCats.slice(0, 4).forEach(cat => {
        chips.push({ label: `${cat} Sarees`, query: cat });
      });
    }
    chips.push({ label: 'Under ₹3,000', query: 'under 3000' });
    chips.push({ label: '20-min delivery', query: '20 min delivery' });
    return chips;
  }, [categories, products]);

  // Display at most 8 category slots; if more than 8, show top 7 categories and 1 "Explore All" card
  const displayedCategories = useMemo(() => {
    if (dynamicBrowseCategories.length > 8) {
      return [
        ...dynamicBrowseCategories.slice(0, 7).map(item => ({ ...item, isExploreAll: false })),
        {
          name: 'Explore All',
          image: '',
          query: 'EXPLORE_ALL',
          isExploreAll: true,
        },
      ];
    }
    return dynamicBrowseCategories.map(item => ({ ...item, isExploreAll: false }));
  }, [dynamicBrowseCategories]);

  // Focus input when modal opens & handle Escape key
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Voice Search Setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setSearchQuery(text);
      setIsListening(false);
      processQuery(text);
    };
    recognitionRef.current = rec;
  }, [setSearchQuery]);

  const processQuery = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!value.trim()) {
          setSuggestions([]);
          setDetectedFilters(null);
          return;
        }
        const dynamicCatNames = (categories || []).map(c => c.name);
        const filters = parseSearchQuery(value, dynamicCatNames);
        setDetectedFilters(filters);
        const suggs = generateSuggestions(value, products as Product[], dynamicCatNames);
        setSuggestions(suggs);
      }, 150);
    },
    [products, categories]
  );

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    processQuery(val);
  };

  const handleSearchSubmit = (e?: React.FormEvent, customTerm?: string) => {
    if (e) e.preventDefault();
    const q = (customTerm !== undefined ? customTerm : searchQuery).trim();
    if (!q) return;

    addRecentSearch(q);
    const dynamicCatNames = (categories || []).map(c => c.name);
    const filters = parseSearchQuery(q, dynamicCatNames);
    router.push(buildSearchUrl(q, filters));
    onClose();
  };

  const handleChipClick = (term: string) => {
    setSearchQuery(term);
    handleSearchSubmit(undefined, term);
  };

  const handleWeaveClick = (catName: string) => {
    if (catName === 'EXPLORE_ALL') {
      router.push('/sarees');
      onClose();
      return;
    }
    addRecentSearch(catName);
    router.push(`/sarees?category=${encodeURIComponent(catName)}`);
    onClose();
  };

  const handleSuggestionClick = (sugg: SearchSuggestion) => {
    addRecentSearch(sugg.label);
    if (sugg.type === 'product' && sugg.product) {
      router.push(`/product/${sugg.product.slug}`);
    } else {
      const dynamicCatNames = (categories || []).map(c => c.name);
      const filters = parseSearchQuery(sugg.value, dynamicCatNames);
      if (sugg.type === 'category') {
        const catVal = sugg.value.replace(/ Sarees$/i, '');
        if (!filters.categories.includes(catVal)) {
          filters.categories.push(catVal);
        }
      }
      router.push(buildSearchUrl(sugg.value, filters));
    }
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const hasDetectedFilters = !!(
    detectedFilters &&
    (detectedFilters.colors.length > 0 ||
      detectedFilters.fabrics.length > 0 ||
      detectedFilters.occasions.length > 0 ||
      detectedFilters.categories.length > 0 ||
      detectedFilters.price)
  );

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-[#FAF7F0] md:bg-black/60 md:backdrop-blur-sm overflow-y-auto flex flex-col md:items-center md:justify-start md:p-4 md:pt-16 animate-fadeIn">
      {/* ── MODAL CONTAINER (Full-screen on Mobile / Centered Floating Card on Desktop) ── */}
      <div className="w-full h-full md:h-auto md:max-w-4xl bg-[#FAF7F0] md:border md:border-[#B08A3C]/40 md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col md:max-h-[85vh]">

        {/* ── 1. SEARCH HEADER BAR ── */}
        <div className="sticky top-0 z-20 bg-[#FAF7F0] px-4 md:px-6 py-3.5 border-b border-[#E5DEC9] flex items-center gap-3 shadow-2xs">
          {/* Mobile Chevron Back Arrow */}
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 text-[#292524] hover:bg-[#E5DEC9]/40 rounded-full transition-colors cursor-pointer md:hidden"
            aria-label="Back"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Search Input Container */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
            <div className="w-full bg-[#FAF6EE] border border-[#E5DEC9] rounded-full px-4 py-2.5 md:py-3 flex items-center gap-3 focus-within:border-[#6B1725] transition-colors shadow-2xs">
              <Search size={18} className="text-[#292524]/50 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search Katan, Organza, Bridal..."
                className="w-full bg-transparent text-sm md:text-base font-sans font-medium text-[#292524] placeholder-[#7A6E65] outline-none pr-14"
              />

              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setDetectedFilters(null);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-12 p-1 text-[#7A6E65] hover:text-[#292524] transition-colors cursor-pointer"
                  aria-label="Clear text"
                >
                  <X size={16} />
                </button>
              )}

              {/* Mic button */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    recognitionRef.current?.stop();
                  } else if (recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch (_) { }
                  }
                }}
                className={`absolute right-3.5 p-1 rounded-full transition-colors cursor-pointer ${isListening ? 'text-[#6B1725] animate-pulse' : 'text-[#7A6E65] hover:text-[#292524]'
                  }`}
                title={isListening ? 'Listening...' : 'Voice Search'}
              >
                <Mic size={18} />
              </button>
            </div>
          </form>

          {/* Desktop Close ESC Button */}
          <button
            onClick={onClose}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5DEC9]/40 hover:bg-[#6B1725] hover:text-white text-[#292524] text-xs font-semibold transition-all cursor-pointer border border-[#E5DEC9]"
            title="Close (ESC)"
          >
            <span>Close</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-[#292524] font-mono border border-black/10">ESC</span>
          </button>
        </div>

        {/* ── 2. MODAL BODY (SCROLLABLE AREA) ── */}
        <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full pb-10 px-4 md:px-8 pt-4">
          {!searchQuery.trim() ? (
            <>
              {/* ── SECTION 1: RECENT SEARCHES ── */}
              {recentSearches.length > 0 && (
                <div className="mt-2">
                  <span className="text-[11px] font-sans font-bold tracking-widest text-[#7A6E65] uppercase px-1 py-2 block">
                    RECENT SEARCHES
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {recentSearches.slice(0, 4).map((term, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2.5 bg-white md:bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl flex items-center justify-between hover:border-[#6B1725] hover:shadow-2xs transition-all group cursor-pointer"
                      >
                        <div
                          onClick={() => handleChipClick(term)}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <Clock size={15} className="text-[#7A6E65] shrink-0" />
                          <span className="text-xs md:text-sm font-sans font-medium text-[#292524] group-hover:text-[#6B1725] transition-colors truncate">
                            {term}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="p-1 text-[#7A6E65] hover:text-red-700 transition-colors cursor-pointer"
                          aria-label={`Remove ${term}`}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SECTION 2: TRENDING IN SAMASTIPUR ── */}
              {trendingChips.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-sans font-bold tracking-widest text-[#7A6E65] uppercase mb-3">
                    <TrendingUp size={15} className="text-[#B08A3C]" />
                    <span>TRENDING IN SAMASTIPUR</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {trendingChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(chip.query)}
                        className="px-4 py-2 bg-white border border-[#E5DEC9] rounded-full text-xs font-sans font-medium text-[#292524] hover:border-[#6B1725] hover:text-[#6B1725] hover:shadow-2xs transition-all cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SECTION 3: BROWSE CATEGORIES & WEAVES ── */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-sans font-bold tracking-widest text-[#7A6E65] uppercase block">
                    BROWSE CATEGORIES
                  </span>
                  <button
                    onClick={() => {
                      router.push('/sarees');
                      onClose();
                    }}
                    className="text-xs font-serif font-bold text-[#6B1725] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Explore All</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {isCategoriesLoading ? (
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-y-6 gap-x-3 text-center animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#E5DEC9]/40" />
                        <div className="w-12 h-3 bg-[#E5DEC9]/40 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-y-6 gap-x-3 text-center">
                    {displayedCategories.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleWeaveClick(item.query)}
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                      >
                        <div
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 p-0.5 group-hover:scale-105 transition-all shadow-2xs ${item.isExploreAll
                            ? 'border-[#6B1725] bg-[#6B1725] flex items-center justify-center text-white'
                            : 'border-[#D4B870] group-hover:border-[#6B1725] bg-white'
                            }`}
                        >
                          {item.isExploreAll ? (
                            <div className="flex flex-col items-center justify-center">
                              {/* <Sparkles size={18} className="text-[#D4B870] mb-0.5 animate-pulse" /> */}
                              <span className="text-[10px] font-sans font-bold tracking-tight text-white uppercase">
                                All
                              </span>
                            </div>
                          ) : item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-[#E5DEC9] animate-pulse" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-sans truncate w-full ${item.isExploreAll
                            ? 'font-bold text-[#6B1725] group-hover:underline'
                            : 'font-medium text-[#292524] group-hover:text-[#6B1725] transition-colors'
                            }`}
                        >
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── LIVE SEARCH RESULTS WHEN USER TYPES ── */
            <div className="space-y-4">
              {/* Detected Filters */}
              {hasDetectedFilters && (
                <div className="bg-white border border-[#E5DEC9] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B1725] uppercase tracking-wider">
                    <Sparkles size={13} className="text-[#B08A3C]" /> Detected Filters
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detectedFilters!.categories.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 bg-[#6B1725]/10 text-[#6B1725] text-xs font-semibold px-3 py-1 rounded-full border border-[#6B1725]/20">
                        <Tag size={11} /> {cat}
                      </span>
                    ))}
                    {detectedFilters!.fabrics.map(fab => (
                      <span key={fab} className="inline-flex items-center gap-1 bg-[#FAF6EE] text-[#292524] text-xs font-semibold px-3 py-1 rounded-full border border-[#E5DEC9]">
                        ✨ {fab}
                      </span>
                    ))}
                    {detectedFilters!.colors.map(col => (
                      <span key={col} className="inline-flex items-center gap-1 bg-[#FAF6EE] text-[#292524] text-xs font-semibold px-3 py-1 rounded-full border border-[#E5DEC9]">
                        🎨 {col}
                      </span>
                    ))}
                    {detectedFilters!.price && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
                        💰 {formatPriceFilter(detectedFilters!.price)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions grid: 2 columns on desktop */}
              {suggestions.length > 0 ? (
                <div className="bg-white border border-[#E5DEC9] rounded-2xl divide-y md:divide-y-0 divide-[#F3ECE0] overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F3ECE0]">
                    {suggestions.map((sugg, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSuggestionClick(sugg)}
                        className="p-3.5 flex items-center gap-3.5 hover:bg-[#FAF6EE] transition-colors cursor-pointer border-b border-[#F3ECE0]"
                      >
                        {sugg.type === 'product' && sugg.product ? (
                          <>
                            <img
                              src={sugg.product.images[0]}
                              alt={sugg.product.name}
                              className="w-12 h-14 object-cover rounded-lg bg-[#FAF6EE] shrink-0 border border-[#E5DEC9]"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs md:text-sm font-serif font-bold text-[#292524] truncate">
                                {sugg.product.name}
                              </h4>
                              <p className="text-xs font-sans text-[#7A6E65] mt-0.5">
                                {sugg.product.fabric} · ₹{(sugg.product.salePrice ?? sugg.product.price).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-base leading-none">{sugg.icon || '🔍'}</span>
                            <span className="text-xs md:text-sm font-sans font-medium text-[#292524] flex-1">{sugg.label}</span>
                          </>
                        )}
                        <ChevronRight size={16} className="text-[#7A6E65] shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Footer Submit Button */}
                  <button
                    onClick={() => handleSearchSubmit()}
                    className="w-full p-4 bg-[#FAF6EE] text-[#6B1725] font-serif font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-[#F3ECE0] transition-colors cursor-pointer border-t border-[#E5DEC9]"
                  >
                    <Search size={16} />
                    Search all results for &quot;{searchQuery.trim()}&quot;
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-sm font-sans text-[#7A6E65] bg-white rounded-2xl border border-[#E5DEC9]">
                  No direct matches found — press Enter to search all sarees.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
