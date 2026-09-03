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
import { SearchViewModal } from './SearchViewModal';

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(true); }} autoComplete="off">
          {/* ── Input Row ── */}
          <div
            onClick={() => setIsModalOpen(true)}
            className={`
              relative flex items-center bg-[#FAF6EE] border rounded-full transition-all duration-200 cursor-pointer
              ${isFocused
                ? 'border-[#6B1725] ring-2 ring-[#6B1725]/10 shadow-md'
                : 'border-[#E5DEC9] shadow-2xs hover:border-[#6B1725]/60'
              }
            `}
          >
            <Search size={16} className="absolute left-4 text-[#292524]/50 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              readOnly
              value={searchQuery}
              onClick={() => setIsModalOpen(true)}
              onFocus={() => setIsModalOpen(true)}
              placeholder="Search Katan, Organza, Bridal..."
              className="w-full bg-transparent text-sm text-[#292524] placeholder-[#7A6E65] rounded-full py-2.5 pl-10 pr-12 outline-none font-sans font-medium cursor-pointer"
              spellCheck={false}
            />

            {/* Mic */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="absolute right-3.5 p-1.5 rounded-full text-[#7A6E65] hover:text-[#6B1725] transition-colors"
              title="Voice search"
              aria-label="Voice search"
            >
              <Mic size={15} />
            </button>
          </div>
        </form>
      </div>

      {/* Full Screen Advance Search View Modal matching exact UX mockup */}
      <SearchViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
