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
  /** If true, renders as the compact header inline bar */
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

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice search
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
      handleQueryChange(text);
    };
    recognitionRef.current = rec;
  }, []);

  // Debounced suggestion generation
  const handleQueryChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setActiveSuggestionIndex(-1);
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
      }, 180);
    },
    [products, setSearchQuery]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const filters = parseSearchQuery(q);
    addRecentSearch(q);
    setIsFocused(false);
    const url = buildSearchUrl(q, filters);
    router.push(url);
    onClose?.();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setIsFocused(false);
    addRecentSearch(suggestion.label);
    if (suggestion.type === 'product' && suggestion.product) {
      router.push(`/product/${suggestion.product.slug}`);
    } else {
      const filters = parseSearchQuery(suggestion.value);
      const url = buildSearchUrl(suggestion.value, filters);
      router.push(url);
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
    const totalItems = suggestions.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i - 1 + totalItems) % totalItems);
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
    inputRef.current?.focus();
  };

  // Filter pills to show above input when typing
  const hasDetectedFilters = detectedFilters && (
    detectedFilters.colors.length > 0 ||
    detectedFilters.fabrics.length > 0 ||
    detectedFilters.occasions.length > 0 ||
    detectedFilters.categories.length > 0 ||
    detectedFilters.price
  );

  const showDropdown = isFocused && (searchQuery.trim() ? suggestions.length > 0 : recentSearches.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Input */}
        <div className={`
          relative flex items-center bg-white border rounded-full transition-all duration-200
          ${isFocused
            ? 'border-[#C9A45C] ring-2 ring-[#C9A45C]/20 shadow-md'
            : 'border-[#C9A45C]/40 shadow-sm hover:border-[#C9A45C]/70'
          }
        `}>
          <Search
            size={16}
            className="absolute left-4 text-dark-brown/40 pointer-events-none shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder='Search sarees, colors, fabrics, "red Banarasi under ₹5000"…'
            className="w-full bg-transparent text-sm text-dark-brown placeholder-dark-brown/35 rounded-full py-2.5 pl-10 pr-16 outline-none font-medium"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-10 p-1 text-dark-brown/40 hover:text-maroon transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {/* Mic / Submit */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                recognitionRef.current?.stop();
              } else if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (_) {}
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

        {/* Detected Filter Pills (shown while typing) */}
        {isFocused && hasDetectedFilters && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 pt-1.5 z-50">
            <div className="bg-white border border-[#C9A45C]/25 rounded-xl shadow-xl overflow-hidden">
              <div className="px-3 pt-2.5 pb-1.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={11} className="text-gold" />
                  <span className="text-[10px] font-bold text-dark-brown/50 uppercase tracking-wider">Detected Filters</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detectedFilters.categories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 bg-maroon/10 text-maroon text-[11px] font-semibold px-2 py-0.5 rounded-full border border-maroon/20">
                      <Tag size={9} /> {cat}
                    </span>
                  ))}
                  {detectedFilters.fabrics.map(fab => (
                    <span key={fab} className="inline-flex items-center gap-1 bg-gold/10 text-dark-brown text-[11px] font-semibold px-2 py-0.5 rounded-full border border-gold/20">
                      ✨ {fab}
                    </span>
                  ))}
                  {detectedFilters.colors.map(col => (
                    <span key={col} className="inline-flex items-center gap-1 bg-cream text-dark-brown text-[11px] font-semibold px-2 py-0.5 rounded-full border border-cream">
                      🎨 {col}
                    </span>
                  ))}
                  {detectedFilters.occasions.map(occ => (
                    <span key={occ} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-green-100">
                      🎉 {occ}
                    </span>
                  ))}
                  {detectedFilters.price && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                      💰 {formatPriceFilter(detectedFilters.price)}
                    </span>
                  )}
                </div>
              </div>
              {/* Suggestions below pills */}
              <div className="border-t border-cream/60 py-1">
                {suggestions.slice(0, 5).map((sugg, idx) => (
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
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-dark-brown truncate">{sugg.product.name}</div>
                          <div className="text-[10px] text-dark-brown/50">{sugg.product.fabric} · ₹{(sugg.product.salePrice ?? sugg.product.price).toLocaleString('en-IN')}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-base leading-none flex-shrink-0">{sugg.icon || '🔍'}</span>
                        <span className="text-xs font-semibold text-dark-brown">{sugg.label}</span>
                      </>
                    )}
                    <ChevronRight size={12} className="ml-auto text-dark-brown/30 flex-shrink-0" />
                  </button>
                ))}
                <button
                  type="submit"
                  className="w-full text-left px-3.5 py-2.5 flex items-center gap-2 text-maroon font-bold text-xs hover:bg-cream/35 transition-colors border-t border-cream/60"
                >
                  <Search size={12} />
                  Search all results for &quot;{searchQuery.trim()}&quot;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dropdown without detected filters */}
        {!hasDetectedFilters && showDropdown && (
          <div className="absolute left-0 right-0 top-full pt-1.5 z-50">
            <div className="bg-white border border-cream shadow-xl rounded-xl overflow-hidden">
              {/* Recent searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <div className="p-3 border-b border-cream">
                  <div className="flex justify-between items-center text-[10px] font-bold text-dark-brown/45 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1"><Clock size={10} /> Recent Searches</span>
                    <button onClick={clearRecentSearches} className="text-maroon hover:underline">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentClick(s)}
                        className="bg-cream/50 hover:bg-cream text-dark-brown/80 text-[11px] font-medium px-2.5 py-1 rounded-full border border-cream/80 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions while typing */}
              {searchQuery && (
                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold text-dark-brown/40 uppercase tracking-wider">
                    Suggestions
                  </div>
                  {suggestions.length > 0 ? (
                    suggestions.map((sugg, idx) => (
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
                            <div className="min-w-0">
                              <div className="text-xs font-serif font-bold text-dark-brown truncate">{sugg.product.name}</div>
                              <div className="text-[10px] text-dark-brown/50">{sugg.product.fabric} · ₹{(sugg.product.salePrice ?? sugg.product.price).toLocaleString('en-IN')}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-base leading-none flex-shrink-0">{sugg.icon || '🔍'}</span>
                            <span className="text-xs font-semibold text-dark-brown">{sugg.label}</span>
                          </>
                        )}
                        <ChevronRight size={12} className="ml-auto text-dark-brown/30 flex-shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="px-3.5 py-3 text-xs text-dark-brown/45 italic">
                      No suggestions — press Enter to search all products
                    </div>
                  )}
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
