"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight, LogOut, FileText, Home, Grid, Mic, ArrowLeft, Trash2, MapPin, Phone, MessageCircle, Store, Tag, Sparkles, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AnnouncementBar } from './AnnouncementBar';
import { AdvancedSearchBar } from './AdvancedSearchBar';
import { parseSearchQuery, buildSearchUrl, generateSuggestions, formatPriceFilter } from '../lib/searchEngine';


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

  // Sync search input with URL search params
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams, setSearchQuery]);

  const handleMobileSearchSubmit = () => {
    if (searchQuery.trim()) {
      const filters = parseSearchQuery(searchQuery.trim());
      addRecentSearch(searchQuery.trim());
      setIsMobileSearchOpen(false);
      router.push(buildSearchUrl(searchQuery.trim(), filters));
    }
  };

  // ── Mobile search: live suggestions computed from current searchQuery ──
  const mobileSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !isMobileSearchOpen) return [];
    return generateSuggestions(searchQuery, products as any[]);
  }, [searchQuery, products, isMobileSearchOpen]);

  const mobileDetectedFilters = useMemo(() => {
    if (!searchQuery.trim() || !isMobileSearchOpen) return null;
    return parseSearchQuery(searchQuery);
  }, [searchQuery, isMobileSearchOpen]);

  const mobileHasFilters = !!(mobileDetectedFilters && (
    mobileDetectedFilters.colors.length > 0 ||
    mobileDetectedFilters.fabrics.length > 0 ||
    mobileDetectedFilters.occasions.length > 0 ||
    mobileDetectedFilters.categories.length > 0 ||
    mobileDetectedFilters.price
  ));

  // Auth Operations
  // OTP forms are removed since only Google OAuth is active

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

            {/* Center: Advanced Search Bar */}
            <div className="hidden md:block flex-1 max-w-lg">
              <AdvancedSearchBar variant="header" />
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
              className="p-1 text-dark-brown/70 hover:text-maroon flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1">
              <AdvancedSearchBar
                variant="mobile-overlay"
                autoFocus
                onClose={() => setIsMobileSearchOpen(false)}
              />
            </div>
          </div>

          {/* ── Mobile body: suggestions when typing, static content when empty ── */}
          {searchQuery.trim() ? (
            <div className="flex-1 overflow-y-auto">
              {/* Detected filter pills */}
              {mobileHasFilters && (
                <div className="px-4 pt-3 pb-2 border-b border-cream/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={10} className="text-gold" />
                    <span className="text-[9px] font-bold text-dark-brown/45 uppercase tracking-widest">Detected Filters</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mobileDetectedFilters!.categories.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 bg-maroon/10 text-maroon text-[11px] font-semibold px-2.5 py-1 rounded-full border border-maroon/15">
                        <Tag size={9} /> {cat}
                      </span>
                    ))}
                    {mobileDetectedFilters!.fabrics.map(fab => (
                      <span key={fab} className="inline-flex items-center gap-1 bg-gold/10 text-dark-brown text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gold/20">
                        ✨ {fab}
                      </span>
                    ))}
                    {mobileDetectedFilters!.colors.map(col => (
                      <span key={col} className="inline-flex items-center gap-1 bg-cream text-dark-brown text-[11px] font-semibold px-2.5 py-1 rounded-full border border-cream">
                        🎨 {col}
                      </span>
                    ))}
                    {mobileDetectedFilters!.occasions.map(occ => (
                      <span key={occ} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-green-100">
                        🎉 {occ}
                      </span>
                    ))}
                    {mobileDetectedFilters!.price && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                        💰 {formatPriceFilter(mobileDetectedFilters!.price)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestion list */}
              {mobileSuggestions.length > 0 ? (
                <div className="divide-y divide-cream/40">
                  {mobileSuggestions.map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        addRecentSearch(sugg.label);
                        setIsMobileSearchOpen(false);
                        if (sugg.type === 'product' && sugg.product) {
                          router.push(`/product/${sugg.product.slug}`);
                        } else {
                          const filters = parseSearchQuery(sugg.value);
                          router.push(buildSearchUrl(sugg.value, filters));
                        }
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-cream/35 active:bg-cream/60 transition-colors"
                    >
                      {sugg.type === 'product' && sugg.product ? (
                        <>
                          <img
                            src={sugg.product.images[0]}
                            alt={sugg.product.name}
                            className="w-12 aspect-[3/4] object-cover rounded-lg bg-cream flex-shrink-0 border border-cream"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-serif font-bold text-dark-brown truncate">{sugg.product.name}</div>
                            <div className="text-[11px] text-dark-brown/50 mt-0.5">
                              {sugg.product.fabric} · {sugg.product.color}
                            </div>
                            <div className="text-xs font-bold text-maroon mt-0.5">
                              ₹{(sugg.product.salePrice ?? sugg.product.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xl w-10 text-center flex-shrink-0">{sugg.icon || '🔍'}</span>
                          <span className="text-sm font-semibold text-dark-brown flex-1">{sugg.label}</span>
                        </>
                      )}
                      <ChevronRight size={16} className="text-dark-brown/30 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Search size={32} className="text-dark-brown/15 mb-3" />
                  <p className="text-sm font-semibold text-dark-brown/50">No suggestions found</p>
                  <p className="text-xs text-dark-brown/35 mt-1">Press Search to see all matching results</p>
                </div>
              )}

              {/* Search all CTA */}
              <div className="sticky bottom-0 px-4 py-3 bg-white border-t border-cream">
                <button
                  onClick={handleMobileSearchSubmit}
                  className="w-full py-3 bg-maroon text-white text-sm font-bold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Search size={15} />
                  Search all results for &quot;{searchQuery.trim()}&quot;
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-dark-brown/50 tracking-widest uppercase">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Recent
                    </span>
                    <button onClick={clearRecentSearches} className="text-maroon hover:underline flex items-center gap-1">
                      <Trash2 size={11} /> Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const filters = parseSearchQuery(s);
                          addRecentSearch(s);
                          setIsMobileSearchOpen(false);
                          router.push(buildSearchUrl(s, filters));
                        }}
                        className="bg-white border border-cream text-dark-brown/80 hover:bg-cream/30 text-xs px-3.5 py-1.5 rounded-full transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip banner */}
              <div className="bg-gradient-to-r from-maroon/5 to-gold/5 rounded-2xl p-4 border border-gold/15">
                <p className="text-xs font-bold text-dark-brown mb-1">💡 Smart Search Tips</p>
                <ul className="text-[11px] text-dark-brown/60 space-y-1 list-disc list-inside">
                  <li>Try &quot;red Banarasi saree under 5000&quot;</li>
                  <li>Search by fabric like &quot;silk&quot; or &quot;organza&quot;</li>
                  <li>Search occasion: &quot;wedding saree&quot; or &quot;shaadi&quot;</li>
                </ul>
              </div>

              {/* Popular Categories */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-dark-brown/50 tracking-widest uppercase">Popular Categories</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Banarasi Silk', query: 'Banarasi' },
                    { name: 'Bridal Collection', query: 'Bridal' },
                    { name: 'Organza Sarees', query: 'Organza' },
                    { name: 'Chikankari Craft', query: 'Chikankari' },
                    { name: 'New Arrivals', href: '/sarees?filter=new' },
                    { name: 'Offers & Discounts', href: '/sarees?category=Offers' },
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        router.push((tag as any).href || `/sarees?category=${(tag as any).query}`);
                      }}
                      className="bg-white border border-cream hover:border-gold/50 text-dark-brown text-xs font-semibold py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                    >
                      {tag.name}
                      <ChevronRight size={14} className="text-gold" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
