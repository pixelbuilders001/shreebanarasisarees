"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight, LogOut, FileText, Home, Grid, Mic, ArrowLeft, Trash2, MapPin, Phone, MessageCircle, Store, Tag, Sparkles, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AnnouncementBar } from './AnnouncementBar';


const HeaderInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {
    products,
    cart,
    wishlist,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    userPhone,
    loginUser,
    logoutUser,
    categories,
    user,
    userProfile,
    loginWithGoogle,
    isHydrated,
    isAuthModalOpen,
    setIsAuthModalOpen
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    // Let the browser paint the initial (off-screen) state first, then animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsMenuAnimating(true));
    });
  };

  const closeMobileMenu = () => {
    setIsMenuAnimating(false);
    setTimeout(() => setIsMobileMenuOpen(false), 320);
  };

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError('');
        };

        recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setSearchQuery(resultText);
          setIsListening(false);
          addRecentSearch(resultText.trim());
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setSpeechError('Could not recognize voice. Please try again.');
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [router, setSearchQuery, addRecentSearch]);

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Voice search is not supported in this browser. Please use Chrome or Safari.");
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Auth Form State
  const [authError, setAuthError] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);

  // Sync search input with URL search params
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams, setSearchQuery]);

  // Click outside listener for search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setIsSearchFocused(false);
      router.push(`/sarees?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    addRecentSearch(suggestion);
    setIsSearchFocused(false);
    router.push(`/sarees?search=${encodeURIComponent(suggestion)}`);
  };

  // Auth Operations
  // OTP forms are removed since only Google OAuth is active

  // Filter products for suggestions (up to 5 matches)
  const searchSuggestions = searchQuery.trim()
    ? products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabric.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
    : [];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Sarees', href: '/sarees' },
    { name: 'New Arrivals', href: '/sarees?filter=new' },
    ...categories.map((c) => ({
      name: c.name,
      href: `/sarees?category=${encodeURIComponent(c.name)}`
    }))
  ];

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-[#FFF9F0]/95 backdrop-blur-md shadow-sm border-b border-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-20 gap-4">

            {/* Left: Mobile Hamburger */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={openMobileMenu}
                className="p-2 text-dark-brown hover:text-maroon transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Center/Left Logo & Title */}
            <Link 
              href="/" 
              className="flex items-center justify-center select-none lg:static absolute left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 z-10"
            >
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees Logo"
                className="h-10 sm:h-11 md:h-14 w-auto object-contain rounded-full border border-gold/25"
              />
              <div className="hidden sm:flex flex-col ml-2">
                <span className="font-serif text-base md:text-xl font-extrabold text-maroon tracking-wider leading-none">
                  Shree
                </span>
                <span className="text-[8px] md:text-[10px] text-gold font-bold tracking-[0.15em] uppercase mt-0.5 font-serif leading-none">
                  Banarasi Sarees
                </span>
              </div>
            </Link>

            {/* Center: Search Bar */}
            <div ref={searchRef} className="hidden md:block flex-1 max-w-lg relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search sarees, fabrics, colors..."
                  className="w-full bg-[#FFFFFF] border border-[#C9A45C]/40 focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] text-sm text-dark-brown placeholder-dark-brown/40 rounded-full py-2.5 pl-5 pr-16 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-dark-brown/50 hover:text-maroon transition-colors"
                  title="Voice search"
                  aria-label="Voice search"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="submit"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-dark-brown/50 hover:text-maroon transition-colors"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {isSearchFocused && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-cream shadow-xl rounded-lg overflow-hidden z-50 animate-fade-in">
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="p-3 border-b border-cream">
                      <div className="flex justify-between items-center text-xs font-semibold text-dark-brown/50 mb-1">
                        <span>RECENT SEARCHES</span>
                        <button onClick={clearRecentSearches} className="text-maroon hover:underline">Clear</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {recentSearches.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(s)}
                            className="bg-cream/40 text-dark-brown/80 hover:bg-cream text-[11px] font-medium px-2.5 py-1 rounded"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchQuery && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[10px] font-bold text-dark-brown/40 uppercase tracking-wider">
                        Suggested Products
                      </div>
                      {searchSuggestions.length > 0 ? (
                        searchSuggestions.map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              router.push(`/product/${prod.slug}`);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-cream/35 flex items-center gap-3 transition-colors"
                          >
                            <img src={prod.images[0]} alt={prod.name} className="w-8 aspect-[3/4] object-cover rounded bg-cream" />
                            <div>
                              <div className="text-xs font-serif font-bold text-dark-brown">{prod.name}</div>
                              <div className="text-[10px] text-dark-brown/50">{prod.fabric} &bull; ₹{prod.price}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-dark-brown/50 italic">
                          No suggestions found. Press Enter to search all products.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 text-dark-brown hover:text-maroon md:hidden transition-colors"
                aria-label="Search"
              >
                <Search size={22} />
              </button>

              {(isHydrated && (userPhone || user)) ? (
                <div className="relative group hidden md:block">
                  <Link
                    href="/account"
                    className="p-2 text-dark-brown hover:text-maroon transition-colors flex items-center gap-1 lg:pointer-events-none"
                    aria-label="User account"
                  >
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover border border-[#C9A45C]/40"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={22} className="text-maroon" />
                    )}
                    <span className="hidden lg:inline text-xs font-semibold text-dark-brown max-w-[120px] truncate">
                      {userProfile?.full_name || user?.user_metadata?.full_name || user?.email || userPhone}
                    </span>
                  </Link>
                  <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50">
                    <div className="bg-white border border-cream shadow-lg rounded-md py-2 w-48 animate-fadeIn">
                      <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-dark-brown hover:bg-cream/40 transition-colors">
                        <ShoppingBag size={14} className="text-maroon" />
                        My Orders
                      </Link>
                      <Link href="/account/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-dark-brown hover:bg-cream/40 transition-colors">
                        <User size={14} className="text-maroon" />
                        My Profile
                      </Link>
                      <Link href="/account/addresses" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-dark-brown hover:bg-cream/40 transition-colors">
                        <MapPin size={14} className="text-maroon" />
                        My Addresses
                      </Link>
                      <div className="border-t border-cream my-1"></div>
                      <button
                        onClick={() => logoutUser()}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-2 text-dark-brown hover:text-maroon transition-colors hidden md:block"
                  aria-label="Login"
                >
                  <User size={22} />
                </button>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 text-dark-brown hover:text-maroon transition-colors relative hidden md:block"
                aria-label="Wishlist"
              >
                <Heart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 bg-maroon text-ivory text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FFF9F0] shadow-sm animate-pulse">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Shopping Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-dark-brown hover:text-maroon transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag size={22} />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-maroon text-ivory text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-ivory shadow-sm">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-center border-t border-cream/60 py-3 gap-4 xl:gap-6 flex-wrap">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-[11px] xl:text-[12px] font-serif font-bold text-dark-brown hover:text-maroon tracking-wider uppercase transition-colors whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Slideout Shopping Drawer */}
      {(isMobileMenuOpen) && (
        <div className="fixed inset-0 z-[60] lg:hidden" aria-modal="true" role="dialog">
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-[#2D211D]/70 backdrop-blur-sm transition-opacity duration-300 ${
              isMenuAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className={`absolute inset-y-0 left-0 w-[88vw] max-w-[360px] bg-[#FFF9F0] shadow-2xl flex flex-col z-10 transition-transform duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isMenuAnimating ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-cream/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/brand_logo.webp"
                  alt="Shree Banarasi Sarees Logo"
                  className="h-9 w-9 object-contain rounded-full border border-gold/20"
                />
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-sm font-extrabold text-maroon tracking-wide">Shree</span>
                  <span className="text-[9px] text-gold font-bold tracking-[0.15em] uppercase font-serif">Banarasi Sarees</span>
                </div>
              </div>
              <button
                onClick={closeMobileMenu}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-cream/50 text-dark-brown/60 hover:bg-cream hover:text-maroon transition-all active:scale-95"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-6">

              {/* ─── SHOP Section ─── */}
              <div className="pt-5 pb-1 px-5">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gold/80 mb-3">Shop</p>
                <nav className="space-y-0.5">
                  {/* New Arrivals */}
                  <Link
                    href="/sarees?filter=new"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">New Arrivals</span>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Banarasi Sarees */}
                  <Link
                    href="/sarees?category=Banarasi+Sarees"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">Banarasi Sarees</span>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Silk Sarees */}
                  <Link
                    href="/sarees?category=Silk+Sarees"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">Silk Sarees</span>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Chanderi Sarees */}
                  <Link
                    href="/sarees?category=Chanderi+Sarees"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">Chanderi Sarees</span>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Bandhani Sarees */}
                  <Link
                    href="/sarees?category=Bandhani+Sarees"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">Bandhani Sarees</span>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Wedding Collection */}
                  <Link
                    href="/sarees?category=Wedding+Collection"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">Wedding Collection</span>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Sarees Under ₹1,999 */}
                  <Link
                    href="/sarees?maxPrice=1999"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors leading-tight">Sarees Under ₹1,999</span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Value</span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors shrink-0" />
                  </Link>

                  {/* Offers */}
                  <Link
                    href="/sarees?filter=offers"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-maroon leading-tight">Offers</span>
                      <span className="text-[9px] font-bold bg-maroon text-ivory px-1.5 py-0.5 rounded-full uppercase tracking-wide">Hot</span>
                    </div>
                    <ChevronRight size={16} className="text-maroon/40 group-hover:text-gold transition-colors shrink-0" />
                  </Link>
                </nav>
              </div>

              {/* ─── Divider ─── */}
              <div className="mx-5 my-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cream to-transparent" />
                <div className="w-1 h-1 rounded-full bg-gold/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cream to-transparent" />
              </div>

              {/* ─── MY ACCOUNT Section ─── */}
              <div className="pb-1 px-5">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gold/80 mb-3">My Account</p>
                <nav className="space-y-0.5">
                  <Link
                    href={user || userPhone ? '/account' : '#'}
                    onClick={(e) => {
                      if (!user && !userPhone) {
                        e.preventDefault();
                        closeMobileMenu();
                        setTimeout(() => setIsAuthModalOpen(true), 350);
                      } else {
                        closeMobileMenu();
                      }
                    }}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0">
                        <FileText size={15} className="text-dark-brown/70" />
                      </div>
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors">My Orders</span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors" />
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0 relative">
                        <Heart size={15} className="text-dark-brown/70" />
                        {wishlist.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-maroon text-ivory text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                            {wishlist.length}
                          </span>
                        )}
                      </div>
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors">Wishlist</span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors" />
                  </Link>

                  <Link
                    href={user || userPhone ? '/account/profile' : '#'}
                    onClick={(e) => {
                      if (!user && !userPhone) {
                        e.preventDefault();
                        closeMobileMenu();
                        setTimeout(() => setIsAuthModalOpen(true), 350);
                      } else {
                        closeMobileMenu();
                      }
                    }}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0 overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={15} className="text-dark-brown/70" />
                        )}
                      </div>
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors">
                        {user || userPhone ? (userProfile?.full_name || user?.user_metadata?.full_name || 'Account') : 'Sign In'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors" />
                  </Link>
                </nav>
              </div>

              {/* ─── Divider ─── */}
              <div className="mx-5 my-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cream to-transparent" />
                <div className="w-1 h-1 rounded-full bg-gold/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cream to-transparent" />
              </div>

              {/* ─── HELP & STORE Section ─── */}
              <div className="pb-1 px-5">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gold/80 mb-3">Help &amp; Store</p>
                <nav className="space-y-0.5">
                  <Link
                    href="/contact"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0">
                        <Phone size={15} className="text-dark-brown/70" />
                      </div>
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors">Contact Us</span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors" />
                  </Link>

                  <a
                    href="https://wa.me/916203909946"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <MessageCircle size={15} className="text-green-600" />
                      </div>
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-green-600 transition-colors">WhatsApp Us</span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors" />
                  </a>

                  <Link
                    href="/store"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-white active:bg-cream/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0">
                        <Store size={15} className="text-dark-brown/70" />
                      </div>
                      <span className="text-[15px] font-semibold text-dark-brown group-hover:text-maroon transition-colors">Visit Our Store</span>
                    </div>
                    <ChevronRight size={16} className="text-dark-brown/30 group-hover:text-gold transition-colors" />
                  </Link>
                </nav>
              </div>

              {/* Store Info Footer */}
              <div className="mx-5 mt-5 p-4 rounded-2xl bg-gradient-to-br from-maroon/5 via-cream/40 to-gold/5 border border-cream">
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-dark-brown leading-tight">Shree Banarasi Sarees</p>
                    <p className="text-[10px] text-dark-brown/55 mt-0.5 leading-relaxed">Samastipur, Bihar · +91 62039 09946</p>
                  </div>
                </div>
              </div>

              {/* Logout — only when signed in */}
              {(user || userPhone) && (
                <div className="mx-5 mt-3">
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      setTimeout(() => logoutUser(), 320);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 bg-red-50/60 text-red-600 text-[13px] font-semibold hover:bg-red-100 active:bg-red-200 transition-all duration-150"
                  >
                    <LogOut size={15} />
                    Log Out
                  </button>
                </div>
              )}

            </div>{/* end scrollable */}
          </div>{/* end panel */}
        </div>
      )}

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#2D211D]/70 backdrop-blur-sm animate-fade-in"
            onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }}
          />

          {/* ── MOBILE: Full-screen bottom sheet ── */}
          <div className="md:hidden relative w-full z-10 animate-slide-in-up flex flex-col max-h-[92dvh] rounded-t-3xl overflow-hidden shadow-2xl">

            {/* Hero Image — top half */}
            <div className="relative h-56 shrink-0 overflow-hidden">
              <img
                src="/login_banner.jpg"
                alt="Shree Banarasi Sarees"
                className="w-full h-full object-cover object-top"
              />
              {/* Layered gradient: dark at bottom for legibility, subtle vignette at top */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0e0b] via-[#1a0e0b]/60 to-transparent" />
              {/* Close button */}
              <button
                onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white/80 hover:bg-black/50 transition-all"
                aria-label="Close"
              >
                <X size={16} />
              </button>
              {/* Brand overlay text */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/brand_logo.webp"
                    alt="Logo"
                    className="w-10 h-10 rounded-full border border-gold/40 object-contain"
                  />
                  <div>
                    <p className="font-serif text-sm font-extrabold text-white tracking-wide leading-none">Shree Banarasi Sarees</p>
                    <p className="text-[10px] text-gold font-semibold tracking-widest uppercase mt-0.5">Est. Samastipur, Bihar</p>
                  </div>
                </div>
                <h2 className="font-serif text-2xl font-black text-white leading-tight">
                  Your wardrobe<br />
                  <span className="text-gold">deserves the best.</span>
                </h2>
                <p className="text-white/65 text-xs mt-1.5 leading-relaxed max-w-[280px]">
                  Track orders, save favourites & unlock exclusive offers.
                </p>
              </div>
            </div>

            {/* Action panel — white bottom sheet */}
            <div className="bg-white px-6 pt-6 pb-10 flex flex-col gap-4">
              {/* Benefit pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {['Track Orders', 'Save Wishlist', 'Exclusive Offers'].map((b) => (
                  <span key={b} className="text-[10px] font-semibold text-dark-brown/70 bg-cream/70 border border-cream px-2.5 py-1 rounded-full">
                    {b}
                  </span>
                ))}
              </div>

              {authError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {authError}
                </div>
              )}

              {/* Google CTA */}
              <button
                type="button"
                onClick={() => {
                  loginWithGoogle().catch(err => {
                    setAuthError(err.message || 'Failed to initialize Google Login');
                  });
                }}
                className="w-full py-4 px-5 bg-maroon hover:bg-maroon-dark text-ivory rounded-2xl font-serif font-bold text-sm tracking-wide transition-all shadow-lg shadow-maroon/20 flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#fff" fillOpacity=".9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fff" fillOpacity=".9" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fff" fillOpacity=".9" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#fff" fillOpacity=".9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-[10px] text-dark-brown/40 leading-relaxed">
                By continuing, you agree to our Terms of Service &amp; Privacy Policy.
              </p>
            </div>
          </div>

          {/* ── DESKTOP: original side-by-side card (unchanged) ── */}
          <div className="hidden md:flex bg-white border border-[#C9A45C]/35 shadow-2xl rounded-2xl w-full max-w-3xl h-[480px] flex-row overflow-hidden z-10 relative animate-scale-up">
            {/* Close Button */}
            <button
              onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }}
              className="absolute top-4 right-4 z-25 p-1.5 text-dark-brown/65 hover:text-maroon hover:bg-cream/40 rounded-full transition-all"
              aria-label="Close Modal"
            >
              <X size={22} />
            </button>

            {/* Left Side: Saree Workshop Image */}
            <div
              className="w-1/2 relative bg-cover bg-center h-full min-h-[480px]"
              style={{ backgroundImage: `url('/login_banner.jpg')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-dark-brown/40 via-transparent to-transparent" />
            </div>

            {/* Right Side: Google Login Actions */}
            <div className="w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-white h-full min-h-[480px] text-center space-y-6">
              <div className="flex justify-center">
                <img
                  src="/brand_logo.webp"
                  alt="Shree Banarasi Sarees Logo"
                  className="h-16 w-auto object-contain rounded-full border border-gold/20 p-1"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl sm:text-2xl font-black text-dark-brown leading-snug">
                  Customer Account
                </h3>
                <p className="text-xs text-dark-brown/60 max-w-xs mx-auto leading-relaxed">
                  Log in to track orders, manage your wishlist, and request custom saree designs.
                </p>
              </div>
              <div className="w-16 h-0.5 bg-gold/45 mx-auto rounded-full"></div>
              {authError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100 w-full max-w-[280px] sm:max-w-xs mx-auto">
                  {authError}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  loginWithGoogle().catch(err => {
                    setAuthError(err.message || 'Failed to initialize Google Login');
                  });
                }}
                className="w-full max-w-[280px] sm:max-w-xs mx-auto py-3.5 px-5 border border-[#C9A45C]/35 hover:border-gold/60 bg-white hover:bg-cream/10 text-dark-brown rounded-xl font-serif font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Floating Bottom Nav for Mobile */}
      {!pathname.startsWith('/product/') && (
        <div className="fixed bottom-4 inset-x-4 z-40 lg:hidden flex justify-center pointer-events-none">
          <nav className="pointer-events-auto bg-[#FFF9F0]/95 backdrop-blur-md border border-[#C9A45C]/40 shadow-[0_10px_25px_rgba(45,33,29,0.1)] flex items-center justify-around py-2.5 px-3 rounded-2xl w-full max-w-md mx-auto transition-all duration-300">
            {/* Home */}
            <Link 
              href="/" 
              className="flex flex-col items-center justify-center flex-1 py-1 relative"
            >
              <Home 
                size={20} 
                className={`transition-all duration-300 ${
                  pathname === '/' ? 'text-maroon scale-110' : 'text-dark-brown/65 hover:text-maroon'
                }`} 
              />
              <span className={`text-[9px] font-serif uppercase tracking-wider mt-1 transition-all duration-300 ${
                pathname === '/' ? 'text-maroon font-bold' : 'text-dark-brown/60'
              }`}>
                Home
              </span>
              <span className={`absolute bottom-0 w-1 h-1 rounded-full bg-maroon transition-all duration-300 ${
                pathname === '/' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`} />
            </Link>

            {/* Categories */}
            <Link 
              href="/sarees" 
              className="flex flex-col items-center justify-center flex-1 py-1 relative"
            >
              <Grid 
                size={20} 
                className={`transition-all duration-300 ${
                  (pathname.startsWith('/sarees') && !searchParams.get('search') && !searchParams.get('focusSearch')) 
                    ? 'text-maroon scale-110' 
                    : 'text-dark-brown/65 hover:text-maroon'
                }`} 
              />
              <span className={`text-[9px] font-serif uppercase tracking-wider mt-1 transition-all duration-300 ${
                (pathname.startsWith('/sarees') && !searchParams.get('search') && !searchParams.get('focusSearch')) 
                  ? 'text-maroon font-bold' 
                  : 'text-dark-brown/60'
              }`}>
                Shop
              </span>
              <span className={`absolute bottom-0 w-1 h-1 rounded-full bg-maroon transition-all duration-300 ${
                (pathname.startsWith('/sarees') && !searchParams.get('search') && !searchParams.get('focusSearch')) 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-0'
              }`} />
            </Link>

            {/* Profile */}
            <Link 
              href="/account" 
              onClick={(e) => {
                if (!user && !userPhone) {
                  e.preventDefault();
                  setIsAuthModalOpen(true);
                }
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 relative"
            >
              <div className="relative">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className={`w-5 h-5 rounded-full object-cover border transition-all duration-300 ${
                      pathname.startsWith('/account') ? 'border-maroon scale-110' : 'border-[#C9A45C]/40 hover:border-maroon'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User 
                    size={20} 
                    className={`transition-all duration-300 ${
                      pathname.startsWith('/account') ? 'text-maroon scale-110' : 'text-dark-brown/65 hover:text-maroon'
                    }`} 
                  />
                )}
              </div>
              <span className={`text-[9px] font-serif uppercase tracking-wider mt-1 transition-all duration-300 ${
                pathname.startsWith('/account') ? 'text-maroon font-bold' : 'text-dark-brown/60'
              }`}>
                Profile
              </span>
              <span className={`absolute bottom-0 w-1 h-1 rounded-full bg-maroon transition-all duration-300 ${
                pathname.startsWith('/account') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`} />
            </Link>
            {/* Wishlist */}
            <Link 
              href="/wishlist" 
              className="flex flex-col items-center justify-center flex-1 py-1 relative"
            >
              <div className="relative">
                <Heart 
                  size={20} 
                  className={`transition-all duration-300 ${
                    pathname === '/wishlist' ? 'text-maroon scale-110' : 'text-dark-brown/65 hover:text-maroon'
                  }`} 
                />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-[#FFF9F0] shadow-md animate-pulse">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-serif uppercase tracking-wider mt-1 transition-all duration-300 ${
                pathname === '/wishlist' ? 'text-maroon font-bold' : 'text-dark-brown/60'
              }`}>
                Wishlist
              </span>
              <span className={`absolute bottom-0 w-1 h-1 rounded-full bg-maroon transition-all duration-300 ${
                pathname === '/wishlist' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`} />
            </Link>

            {/* Cart */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 relative group"
            >
              <div className="relative">
                <ShoppingBag 
                  size={20} 
                  className="text-dark-brown/65 group-hover:text-maroon group-hover:scale-110 transition-all duration-300" 
                />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-maroon text-[#FFF9F0] text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#FFF9F0] shadow-md">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-serif uppercase tracking-wider mt-1 text-dark-brown/60 group-hover:text-maroon transition-all duration-300">
                Cart
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Full Screen Search Sheet */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-[#FFF9F0] flex flex-col animate-slide-in-up">
          {/* Header of Search Sheet */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-cream">
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-1 text-dark-brown/70 hover:text-maroon"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sarees, fabrics, colors..."
                className="w-full bg-[#FFF9F0] border border-[#C9A45C]/40 focus:border-[#C9A45C] text-sm text-dark-brown placeholder-dark-brown/40 rounded-full py-2.5 pl-4 pr-16 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-dark-brown/40 hover:text-maroon"
                  aria-label="Clear text"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={startVoiceSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-dark-brown/50 hover:text-maroon"
                title="Voice search"
                aria-label="Voice search"
              >
                <Mic size={18} />
              </button>
            </form>
          </div>

          {/* Results/Suggestions Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {speechError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100 flex items-center gap-2">
                <span>{speechError}</span>
              </div>
            )}

            {!searchQuery.trim() ? (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-dark-brown/50 tracking-wider">
                      <span>RECENT SEARCHES</span>
                      <button 
                        onClick={clearRecentSearches}
                        className="text-maroon hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(s);
                            addRecentSearch(s);
                            setIsMobileSearchOpen(false);
                            router.push(`/sarees?search=${encodeURIComponent(s)}`);
                          }}
                          className="bg-white border border-cream text-dark-brown/80 hover:bg-cream/30 text-xs px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-dark-brown/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Categories */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-dark-brown/50 tracking-wider">
                    POPULAR CATEGORIES
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Banarasi Silk', query: 'Banarasi' },
                      { name: 'Bridal Collection', query: 'Bridal' },
                      { name: 'Organza Sarees', query: 'Organza' },
                      { name: 'Chikankari Craft', query: 'Chikankari' },
                      { name: 'New Arrivals', filter: 'new' },
                      { name: 'Offers & Discounts', category: 'Offers' }
                    ].map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsMobileSearchOpen(false);
                          if (tag.filter) {
                            router.push('/sarees?filter=new');
                          } else if (tag.category) {
                            router.push(`/sarees?category=${tag.category}`);
                          } else {
                            router.push(`/sarees?category=${tag.query}`);
                          }
                        }}
                        className="bg-white border border-cream hover:border-gold/50 text-dark-brown text-xs font-semibold py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                      >
                        {tag.name}
                        <ChevronRight size={14} className="text-gold" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promotional banner or tip */}
                <div className="bg-gradient-to-r from-cream/35 to-gold/10 rounded-2xl p-4 border border-gold/15 flex items-center gap-3">
                  <div className="bg-gold/20 p-2 rounded-full text-gold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-dark-brown">Try Voice Search!</h4>
                    <p className="text-[10px] text-dark-brown/60 mt-0.5">Tap the microphone icon and say "Red Banarasi Saree" or "Organza" to search hands-free.</p>
                  </div>
                </div>
              </>
            ) : (
              /* Realtime search suggestions list */
              <div className="space-y-4">
                <div className="text-xs font-bold text-dark-brown/40 uppercase tracking-wider">
                  Suggested Products
                </div>
                {searchSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {searchSuggestions.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setIsMobileSearchOpen(false);
                          router.push(`/product/${prod.slug}`);
                        }}
                        className="w-full text-left bg-white border border-cream rounded-xl p-3 flex items-center gap-3 transition-colors hover:border-gold/30"
                      >
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name} 
                          className="w-12 aspect-[3/4] object-cover rounded bg-cream border border-cream" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-serif font-bold text-dark-brown truncate">{prod.name}</div>
                          <div className="text-[10px] text-dark-brown/50 mt-0.5">{prod.fabric} &bull; {prod.category}</div>
                          <div className="text-xs font-bold text-maroon mt-1">₹{prod.price}</div>
                        </div>
                        <ChevronRight size={16} className="text-gold" />
                      </button>
                    ))}
                    
                    <button
                      onClick={() => {
                        addRecentSearch(searchQuery.trim());
                        setIsMobileSearchOpen(false);
                        router.push(`/sarees?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="w-full py-3 bg-maroon text-[#FFF9F0] text-xs font-semibold rounded-xl text-center shadow-md hover:bg-maroon-dark transition-all mt-4"
                    >
                      View All Results for "{searchQuery}"
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-cream rounded-xl p-8 text-center">
                    <svg className="w-10 h-10 text-dark-brown/20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-xs font-bold text-dark-brown">No direct matches found</div>
                    <p className="text-[10px] text-dark-brown/50 mt-1">Try spelling differently or click search below to search our catalog.</p>
                    <button
                      onClick={() => {
                        addRecentSearch(searchQuery.trim());
                        setIsMobileSearchOpen(false);
                        router.push(`/sarees?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="mt-4 px-4 py-2 bg-cream text-maroon border border-gold/30 text-xs font-semibold rounded-full"
                    >
                      Search catalog for "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Search Listening Full-screen overlay */}
      {isListening && (
        <div className="fixed inset-0 z-50 bg-[#2D211D]/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto animate-fade-in">
          <div className="absolute top-4 right-4">
            <button 
              onClick={stopVoiceSearch}
              className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all"
              aria-label="Cancel voice search"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-[#C9A45C]/30 animate-ping" />
            <div className="absolute w-32 h-32 rounded-full bg-[#C9A45C]/15 animate-pulse" />
            
            <button 
              onClick={stopVoiceSearch}
              className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-maroon to-red-700 text-white flex items-center justify-center shadow-2xl border-2 border-gold"
            >
              <Mic size={36} className="animate-bounce" />
            </button>
          </div>
          
          <h3 className="text-white font-serif text-lg font-bold mt-8 tracking-wider">
            Listening...
          </h3>
          <p className="text-white/60 text-xs mt-2 max-w-xs text-center px-4">
            Speak now. Try saying "Banarasi Silk Saree" or "Bridal collection".
          </p>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-in-up {
          animation: slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export const Header: React.FC = () => {
  return (
    <Suspense fallback={<div className="h-20 bg-[#FFF9F0] border-b border-cream animate-pulse" />}>
      <HeaderInner />
    </Suspense>
  );
};
