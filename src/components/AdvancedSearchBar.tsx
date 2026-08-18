"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mic, X, Clock, Tag, Sparkles, ChevronRight } from 'lucide-react';
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

interface AdvancedSearchBarProps {
  variant?: 'header' | 'mobile-overlay';
  onClose?: () => void;
  autoFocus?: boolean;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  variant = 'header',
  onClose,
  autoFocus = false,
}) => {
  const router = useRouter();
  const { products, searchQuery, setSearchQuery, recentSearches, addRecentSearch, clearRecentSearches } = useStore();

  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [detectedFilters, setDetectedFilters] = useState<DetectedFilters | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Voice search setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';
    rec.onstart = () => setIsListening(true);
    rec.onend   = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setSearchQuery(text);
      setIsListening(false);
      processQuery(text);
    };
    recognitionRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced query processing
  const processQuery = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!value.trim()) {
          setSuggestions([]);
          setDetectedFilters(null);
          return;
        }
        const filters = parseSearchQuery(value);
        setDetectedFilters(filters);
        const suggs = generateSuggestions(value, products as Product[]);
        setSuggestions(suggs);
      }, 150);
    },
    [products]
  );

  const handleQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    setActiveSuggestionIndex(-1);
    processQuery(value);
  }, [setSearchQuery, processQuery]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const filters = parseSearchQuery(q);
    addRecentSearch(q);
    setIsFocused(false);
    setActiveSuggestionIndex(-1);
    router.push(buildSearchUrl(q, filters));
    onClose?.();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setIsFocused(false);
    setActiveSuggestionIndex(-1);
    addRecentSearch(suggestion.label);
    if (suggestion.type === 'product' && suggestion.product) {
      router.push(`/product/${suggestion.product.slug}`);
    } else {
      // The suggestion.value is the raw query string — parse it and build URL
      const filters = parseSearchQuery(suggestion.value);
      router.push(buildSearchUrl(suggestion.value, filters));
    }
    onClose?.();
  };

  const handleRecentClick = (term: string) => {
    setSearchQuery(term);
    const filters = parseSearchQuery(term);
    addRecentSearch(term);
    setIsFocused(false);
    router.push(buildSearchUrl(term, filters));
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      onClose?.();
    }
  };

  const clearQuery = () => {
    setSearchQuery('');
    setSuggestions([]);
    setDetectedFilters(null);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Derived booleans
  const hasDetectedFilters = !!(detectedFilters && (
    detectedFilters.colors.length > 0 ||
    detectedFilters.fabrics.length > 0 ||
    detectedFilters.occasions.length > 0 ||
    detectedFilters.categories.length > 0 ||
    detectedFilters.price
  ));

  // Never show the dropdown on mobile-overlay — the full-screen modal handles its own UI
  const showDropdown = variant !== 'mobile-overlay' && isFocused && (
    searchQuery.trim()
      ? (hasDetectedFilters || suggestions.length > 0)
      : recentSearches.length > 0
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} autoComplete="off">
        {/* ── Input Row ── */}
        <div className={`
          relative flex items-center bg-white border rounded-full transition-all duration-200
          ${isFocused
            ? 'border-[#C9A45C] ring-2 ring-[#C9A45C]/20 shadow-md'
            : 'border-[#C9A45C]/40 shadow-sm hover:border-[#C9A45C]/70'
          }
        `}>
          <Search size={16} className="absolute left-4 text-dark-brown/40 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              // Re-generate suggestions when focused with existing text
              if (searchQuery.trim()) processQuery(searchQuery);
            }}
            onKeyDown={handleKeyDown}
            placeholder='Search: "red silk", "banarasi under 3000", "wedding saree"…'
            className="w-full bg-transparent text-sm text-dark-brown placeholder-dark-brown/35 rounded-full py-2.5 pl-10 pr-20 outline-none font-medium"
            spellCheck={false}
          />

          {/* Clear */}
          {searchQuery && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-11 p-1 text-dark-brown/40 hover:text-maroon transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {/* Mic */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                recognitionRef.current?.stop();
              } else if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (_) {}
              } else {
                // no voice support
              }
            }}
            className={`absolute right-3.5 p-1.5 rounded-full transition-all duration-200 ${
              isListening
                ? 'text-maroon bg-maroon/10 animate-pulse'
                : 'text-dark-brown/40 hover:text-maroon hover:bg-cream/60'
            }`}
            title={isListening ? 'Listening…' : 'Voice search'}
            aria-label="Voice search"
          >
            <Mic size={15} />
          </button>
        </div>

        {/* ── Dropdown ── */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full pt-1.5 z-[60]">
            <div className="bg-white border border-[#C9A45C]/25 rounded-xl shadow-2xl overflow-hidden">

              {/* ── No query: Recent searches ── */}
              {!searchQuery.trim() && recentSearches.length > 0 && (
                <div className="p-3 border-b border-cream">
                  <div className="flex justify-between items-center text-[10px] font-bold text-dark-brown/45 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1"><Clock size={10} /> Recent</span>
                    <button type="button" onClick={clearRecentSearches} className="text-maroon hover:underline">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleRecentClick(s)}
                        className="bg-cream/50 hover:bg-cream text-dark-brown/80 text-[11px] font-medium px-2.5 py-1 rounded-full border border-cream/80 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── With query: filter pills ── */}
              {searchQuery.trim() && hasDetectedFilters && (
                <div className="px-3 pt-2.5 pb-2 border-b border-cream/60">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={10} className="text-gold" />
                    <span className="text-[9px] font-bold text-dark-brown/45 uppercase tracking-wider">Detected Filters</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedFilters!.categories.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 bg-maroon/10 text-maroon text-[11px] font-semibold px-2 py-0.5 rounded-full border border-maroon/15">
                        <Tag size={9} /> {cat}
                      </span>
                    ))}
                    {detectedFilters!.fabrics.map(fab => (
                      <span key={fab} className="inline-flex items-center gap-1 bg-gold/10 text-dark-brown text-[11px] font-semibold px-2 py-0.5 rounded-full border border-gold/20">
                        ✨ {fab}
                      </span>
                    ))}
                    {detectedFilters!.colors.map(col => (
                      <span key={col} className="inline-flex items-center gap-1 bg-cream text-dark-brown text-[11px] font-semibold px-2 py-0.5 rounded-full border border-cream">
                        🎨 {col}
                      </span>
                    ))}
                    {detectedFilters!.occasions.map(occ => (
                      <span key={occ} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-green-100">
                        🎉 {occ}
                      </span>
                    ))}
                    {detectedFilters!.price && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                        💰 {formatPriceFilter(detectedFilters!.price)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── With query: product/category suggestions ── */}
              {searchQuery.trim() && (
                <div className="py-1">
                  {suggestions.length > 0 ? (
                    <>
                      {suggestions.slice(0, 6).map((sugg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(sugg)}
                          className={`w-full text-left px-3.5 py-2 flex items-center gap-3 transition-colors ${
                            activeSuggestionIndex === idx ? 'bg-cream/60' : 'hover:bg-cream/35'
                          }`}
                        >
                          {sugg.type === 'product' && sugg.product ? (
                            <>
                              <img
                                src={sugg.product.images[0]}
                                alt={sugg.product.name}
                                className="w-8 aspect-[3/4] object-cover rounded bg-cream flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-serif font-bold text-dark-brown truncate">{sugg.product.name}</div>
                                <div className="text-[10px] text-dark-brown/50">
                                  {sugg.product.fabric} · {sugg.product.color} ·{' '}
                                  ₹{(sugg.product.salePrice ?? sugg.product.price).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-sm leading-none flex-shrink-0">{sugg.icon || '🔍'}</span>
                              <span className="text-xs font-semibold text-dark-brown flex-1">{sugg.label}</span>
                            </>
                          )}
                          <ChevronRight size={12} className="ml-auto text-dark-brown/30 flex-shrink-0" />
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3.5 py-2.5 text-xs text-dark-brown/45 italic">
                      No direct matches — press Enter to search all products
                    </div>
                  )}
                  {/* "Search all" footer */}
                  <button
                    type="submit"
                    className="w-full text-left px-3.5 py-2.5 flex items-center gap-2 text-maroon font-bold text-xs hover:bg-cream/35 transition-colors border-t border-cream/60"
                  >
                    <Search size={12} />
                    Search all results for &quot;{searchQuery.trim()}&quot;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
