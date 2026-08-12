"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight, LogOut, FileText, Home, Grid, Mic, ArrowLeft, Trash2 } from 'lucide-react';
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
    logoutUser
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<any>(null);

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
          setIsMobileSearchOpen(false);
          router.push(`/sarees?search=${encodeURIComponent(resultText.trim())}`);
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

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
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phoneNumber)) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setIsOtpSent(true);
    setAuthSuccess('OTP sent successfully (Use 123456 to log in)');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === '123456') {
      loginUser(phoneNumber);
      setAuthSuccess('Successfully logged in!');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setIsOtpSent(false);
        setPhoneNumber('');
        setOtpCode('');
        setAuthSuccess('');
      }, 1000);
    } else {
      setAuthError('Invalid OTP. Please enter 123456.');
    }
  };

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
    { name: 'Banarasi', href: '/sarees?category=Banarasi' },
    { name: 'Chikankari', href: '/sarees?category=Chikankari' },
    { name: 'Bandhani', href: '/sarees?category=Bandhani' },
    { name: 'Organza', href: '/sarees?category=Organza' },
    { name: 'Chanderi', href: '/sarees?category=Chanderi' },
    { name: 'Bridal', href: '/sarees?category=Bridal' },
    { name: 'Offers', href: '/sarees?category=Offers' }
  ];

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-[#FFF9F0]/95 backdrop-blur-md shadow-sm border-b border-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">

            {/* Left: Mobile Hamburger & Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-dark-brown hover:text-maroon lg:hidden transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>

              <Link href="/" className="flex items-center gap-2 sm:gap-3 select-none">
                <img
                  src="/brand_logo.png"
                  alt="Shree Banarasi Sarees Logo"
                  className="h-10 md:h-14 w-auto object-contain rounded-full border border-gold/25"
                />
                <div className="hidden md:flex flex-col">
                  <span className="font-serif text-lg sm:text-xl font-extrabold text-maroon tracking-wider">
                    Shree
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-gold font-bold tracking-[0.2em] uppercase -mt-1 font-serif">
                    Banarasi Sarees
                  </span>
                </div>
              </Link>
            </div>

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

              {/* User Account */}
              {userPhone ? (
                <div className="relative group">
                  <button
                    className="p-2 text-dark-brown hover:text-maroon transition-colors flex items-center gap-1"
                    aria-label="User account"
                  >
                    <User size={22} className="text-maroon" />
                    <span className="hidden lg:inline text-xs font-semibold text-dark-brown max-w-[80px] truncate">
                      {userPhone}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-1 bg-white border border-cream shadow-lg rounded-md py-2 w-48 hidden group-hover:block z-50">
                    <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-dark-brown hover:bg-cream/40 transition-colors">
                      <FileText size={14} className="text-gold" />
                      My Dashboard
                    </Link>
                    <button
                      onClick={() => logoutUser()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-2 text-dark-brown hover:text-maroon transition-colors"
                  aria-label="Login"
                >
                  <User size={22} />
                </button>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 text-dark-brown hover:text-maroon transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 bg-maroon text-ivory text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-ivory shadow-sm animate-pulse">
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
          <nav className="hidden lg:flex items-center justify-center border-t border-cream/60 py-3 gap-8">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-[13px] font-serif font-bold text-dark-brown hover:text-maroon tracking-wider uppercase transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Slideout Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />

          <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-[#FFF9F0] shadow-2xl flex flex-col z-50 animate-slide-in-left">
            <div className="px-5 py-6 bg-white border-b border-cream flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/brand_logo.png"
                  alt="Shree Banarasi Sarees Logo"
                  className="h-9 w-auto object-contain rounded-full"
                />
                <span className="font-serif text-base font-bold text-maroon tracking-wide">Shree Banarasi</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-full text-dark-brown/60 hover:text-maroon hover:bg-cream/40">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-md text-sm font-bold font-serif text-dark-brown hover:bg-cream/40 hover:text-maroon transition-all"
                >
                  {link.name}
                  <ChevronRight size={16} className="text-gold" />
                </Link>
              ))}
            </div>

            <div className="p-5 border-t border-cream bg-white">
              <div className="text-xs text-dark-brown/50 text-center font-medium">
                Samastipur, Bihar &bull; Call: +91 62039 09946
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)} />

          <div className="bg-white border border-gold/20 shadow-2xl rounded-lg max-w-sm w-full p-6 z-10 relative overflow-hidden animate-scale-up">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-dark-brown/65 hover:text-maroon rounded-full"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown text-center mb-1">
              Customer Account
            </h3>
            <p className="text-xs text-dark-brown/60 text-center mb-6">
              Access your orders, wishlist, and customization requests
            </p>

            {authError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-2.5 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-100">
                {authSuccess}
              </div>
            )}

            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                    Enter Mobile Number
                  </label>
                  <div className="flex border border-cream rounded overflow-hidden">
                    <span className="bg-cream/40 px-3 py-2 text-xs font-semibold text-dark-brown border-r border-cream flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      required
                      className="w-full px-3 py-2 text-sm text-dark-brown focus:outline-none placeholder-dark-brown/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-maroon text-ivory rounded font-semibold text-xs uppercase tracking-wider hover:bg-maroon-dark transition-colors shadow"
                >
                  GET OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-brown/70 uppercase tracking-wide mb-1.5">
                    Enter OTP sent to +91 {phoneNumber}
                  </label>
                  <input
                    type="password"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 123456"
                    required
                    maxLength={6}
                    className="w-full border border-cream px-3 py-2 text-center text-sm font-semibold tracking-[0.5em] text-dark-brown focus:outline-none focus:border-gold rounded placeholder:text-[10px] placeholder:tracking-normal"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-maroon text-ivory rounded font-semibold text-xs uppercase tracking-wider hover:bg-maroon-dark transition-colors shadow"
                >
                  VERIFY & LOGIN
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="w-full text-center text-xs text-maroon hover:underline mt-1 font-semibold"
                >
                  Back to Mobile Number
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Premium Floating Bottom Nav for Mobile */}
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

          {/* Search */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsMobileSearchOpen(true);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 relative cursor-pointer"
          >
            <Search 
              size={20} 
              className={`transition-all duration-300 ${
                isMobileSearchOpen ? 'text-maroon scale-110' : 'text-dark-brown/65 hover:text-maroon'
              }`} 
            />
            <span className={`text-[9px] font-serif uppercase tracking-wider mt-1 transition-all duration-300 ${
              isMobileSearchOpen ? 'text-maroon font-bold' : 'text-dark-brown/60'
            }`}>
              Search
            </span>
            <span className={`absolute bottom-0 w-1 h-1 rounded-full bg-maroon transition-all duration-300 ${
              isMobileSearchOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`} />
          </button>

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
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
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
        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-out forwards;
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
