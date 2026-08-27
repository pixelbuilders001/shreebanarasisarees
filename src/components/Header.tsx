"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Mic,
  MessageCircle,
  LogOut,
  Package,
  Sparkles,
  MapPin,
  Tag,
  Gift,
  HelpCircle,
  Phone
} from 'lucide-react';

import { useStore } from '../context/StoreContext';
import { AnnouncementBar } from './AnnouncementBar';
import { AdvancedSearchBar } from './AdvancedSearchBar';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  return <HeaderInner />;
};

const HeaderInner: React.FC = () => {
  const router = useRouter();
  const {
    cart,
    wishlist,
    setIsCartOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    userProfile,
    logoutUser
  } = useStore();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Scroll state for sticky header transition
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  const [drawerScreen, setDrawerScreen] = useState<'main' | 'categories'>('main');

  // Desktop collections dropdown state & hover timeout ref
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const collectionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCollectionsMouseEnter = () => {
    if (collectionsTimeoutRef.current) {
      clearTimeout(collectionsTimeoutRef.current);
      collectionsTimeoutRef.current = null;
    }
    setIsCollectionsOpen(true);
  };

  const handleCollectionsMouseLeave = () => {
    if (collectionsTimeoutRef.current) {
      clearTimeout(collectionsTimeoutRef.current);
    }
    collectionsTimeoutRef.current = setTimeout(() => {
      setIsCollectionsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (collectionsTimeoutRef.current) {
        clearTimeout(collectionsTimeoutRef.current);
      }
    };
  }, []);

  // Account dropdown state (desktop)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // Voice Search Modal state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Search focus state for mobile search overlay
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);

  // Track window scroll for compact header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle opening mobile menu drawer
  const openMobileMenu = () => {
    setDrawerScreen('main');
    setIsMobileMenuOpen(true);
    // Lock body scroll cleanly
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      setIsMenuAnimating(true);
    });
  };

  // Handle closing mobile menu drawer
  const closeMobileMenu = () => {
    setIsMenuAnimating(false);
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setDrawerScreen('main');
    }, 250);
  };

  // ESC key listener to close drawer & dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) closeMobileMenu();
        if (isCollectionsOpen) setIsCollectionsOpen(false);
        if (isAccountMenuOpen) setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isCollectionsOpen, isAccountMenuOpen]);

  const categories = [
    { name: 'Banarasi Sarees', slug: 'Banarasi', desc: 'Regal Katan & Zari Masterpieces' },
    { name: 'Silk Sarees', slug: 'Silk', desc: 'Lustrous Pure Silk Weaves' },
    { name: 'Chanderi', slug: 'Chanderi', desc: 'Lightweight Sheer Elegance' },
    { name: 'Bandhani', slug: 'Bandhani', desc: 'Hand-Tied Artisanal Craft' },
    { name: 'Organza', slug: 'Organza', desc: 'Contemporary Translucent Beauty' },
    { name: 'Chikankari', slug: 'Chikankari', desc: 'Intricate Lucknowi Embroidery' },
    { name: 'Georgette', slug: 'Georgette', desc: 'Fluid & Effortless Drapes' },
    { name: 'Bridal Collection', slug: 'Bridal', desc: 'Opulent Heirloom Trousseau' },
  ];

  return (
    <>
      {/* 1. ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. MAIN HEADER (STICKY ON DESKTOP & MOBILE) */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#F3ECE0] ${isScrolled ? 'shadow-sm py-1.5 sm:py-2' : 'py-2.5 sm:py-3.5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* DESKTOP / TABLET HEADER LAYOUT */}
          <div className="hidden lg:flex items-center justify-between gap-4">

            {/* BRAND LOGO ONLY */}
            <Link href="/" className="flex items-center group shrink-0" aria-label="Shree Banarasi Sarees Home">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees Logo"
                className={`w-auto object-contain transition-all duration-300 ${isScrolled ? 'h-7 sm:h-8' : 'h-8 sm:h-9'
                  }`}
              />
            </Link>

            {/* NAVIGATION LINKS */}
            <nav className="flex items-center gap-6 text-xs font-semibold tracking-wider text-[#292524] uppercase">
              <Link
                href="/sarees"
                className="hover:text-[#6B1725] transition-colors py-2"
              >
                Shop
              </Link>

              {/* COLLECTIONS DROPDOWN TRIGGER */}
              <div
                onMouseEnter={handleCollectionsMouseEnter}
                onMouseLeave={handleCollectionsMouseLeave}
              >
                <button
                  onClick={() => setIsCollectionsOpen(prev => !prev)}
                  className="flex items-center gap-1 hover:text-[#6B1725] transition-colors py-2 outline-none cursor-pointer"
                  aria-expanded={isCollectionsOpen}
                  aria-haspopup="true"
                >
                  Collections
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isCollectionsOpen ? 'rotate-180 text-[#6B1725]' : 'text-[#6B625D]'
                      }`}
                  />
                </button>
              </div>
            </nav>

            {/* SEARCH BAR (DESKTOP) */}
            <div className="flex-1 max-w-md mx-2">
              <AdvancedSearchBar />
            </div>

            {/* ACTION ICONS (WISHLIST, ACCOUNT, CART) */}
            <div className="flex items-center gap-4">

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 text-[#292524] hover:text-[#6B1725] transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={21} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#6B1725] text-[#FAF7F0] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#FAF7F0]">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                {user ? (
                  <button
                    onClick={() => setIsAccountMenuOpen(prev => !prev)}
                    className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-[#F3ECE0]/50 transition-colors text-xs font-semibold text-[#292524]"
                    aria-label="Account menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6B1725] text-[#FAF7F0] flex items-center justify-center font-bold text-xs">
                      {userProfile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown size={14} className="text-[#6B625D]" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="p-2 text-[#292524] hover:text-[#6B1725] transition-colors"
                    aria-label="Sign in"
                  >
                    <User size={21} />
                  </button>
                )}

                {/* Logged-in Account Dropdown Menu */}
                {isAccountMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#B08A3C]/30 rounded-2xl shadow-xl p-2 z-50 animate-scaleIn">
                    <div className="px-3 py-2 border-b border-[#F3ECE0]">
                      <p className="text-xs font-bold text-[#292524] truncate">
                        {userProfile?.full_name || 'Valued Customer'}
                      </p>
                      <p className="text-[10px] text-[#6B625D] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#292524] hover:bg-[#FAF7F0] rounded-xl transition-colors"
                    >
                      <Package size={15} className="text-[#6B1725]" />
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        logoutUser();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-[#6B1725] text-[#FAF7F0] hover:bg-[#52111C] rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center"
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B08A3C] text-[#292524] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F0]">
                    {cartCount}
                  </span>
                )}
              </button>

            </div>

          </div>

          {/* MOBILE HEADER LAYOUT */}
          <div className="lg:hidden flex flex-col gap-2">

            {/* MOBILE TOP BAR: MENU | LOGO | WISHLIST | CART */}
            <div className="flex items-center justify-between">

              {/* Menu Hamburger Button */}
              <button
                onClick={openMobileMenu}
                className="p-2 text-[#292524] hover:text-[#6B1725] active:scale-95 transition-all"
                aria-label="Open navigation menu"
              >
                <Menu size={24} />
              </button>

              {/* Mobile Brand Logo Only */}
              <Link href="/" className="flex items-center group" aria-label="Shree Banarasi Sarees Home">
                <img
                  src="/brand_logo.webp"
                  alt="Shree Banarasi Sarees Logo"
                  className="h-10 w-auto object-contain"
                />
              </Link>

              {/* Mobile Right Icons (Wishlist & Cart) */}
              <div className="flex items-center gap-2">

                <Link
                  href="/wishlist"
                  className="relative p-2 text-[#292524] hover:text-[#6B1725]"
                  aria-label="Wishlist"
                >
                  <Heart size={21} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-[#6B1725] text-[#FAF7F0] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FAF7F0]">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-[#6B1725] hover:text-[#52111C]"
                  aria-label="Shopping Cart"
                >
                  <ShoppingBag size={21} />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-[#B08A3C] text-[#292524] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FAF7F0]">
                      {cartCount}
                    </span>
                  )}
                </button>

              </div>

            </div>

            {/* MOBILE SEARCH BAR (ALWAYS VISIBLE IN MOBILE HEADER) */}
            <div className="w-full">
              <AdvancedSearchBar />
            </div>

          </div>

        </div>

        {/* FULL-WIDTH COLLECTIONS MEGA-MENU OVERLAY */}
        {isCollectionsOpen && (
          <div
            onMouseEnter={handleCollectionsMouseEnter}
            onMouseLeave={handleCollectionsMouseLeave}
            className="hidden lg:block absolute top-full left-0 right-0 w-full bg-white border-b border-[#B08A3C]/30 shadow-2xl z-50 animate-slideDown"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F3ECE0]">
                <div className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={15} className="text-[#6B1725]" />
                  Explore Our Collections
                </div>
                <Link
                  href="/sarees"
                  onClick={() => setIsCollectionsOpen(false)}
                  className="text-xs font-bold text-[#6B1725] hover:text-[#52111C] inline-flex items-center gap-1 hover:underline tracking-wide"
                >
                  VIEW ALL SAREES →
                </Link>
              </div>

              <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                {categories.map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/sarees?category=${cat.slug}`}
                    onClick={() => setIsCollectionsOpen(false)}
                    className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#FAF7F0]/70 border border-[#F3ECE0] hover:bg-[#6B1725] hover:border-[#6B1725] group transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-xs font-bold text-[#292524] group-hover:text-[#FAF7F0] transition-colors leading-tight">
                        {cat.name}
                      </span>
                      <ChevronRight size={13} className="text-[#6B625D]/40 group-hover:text-[#FAF7F0] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                    </div>
                    <span className="text-[10px] text-[#6B625D] group-hover:text-[#FAF7F0]/80 font-normal transition-colors leading-snug">
                      {cat.desc}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. MOBILE NAVIGATION DRAWER (85-90% VIEWPORT WIDTH WITH SLIDE ANIMATION) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 bg-[#292524]/60 backdrop-blur-xs transition-opacity duration-300 ${isMenuAnimating ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={closeMobileMenu}
          />

          {/* Drawer Container (85% Viewport Width, Max 360px) */}
          <aside
            className={`fixed top-0 bottom-0 left-0 w-[85vw] max-w-[360px] bg-[#FAF7F0] shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] rounded-r-3xl overflow-hidden ${isMenuAnimating ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            {/* DRAWER TOP HEADER */}
            <div className="p-4 bg-white border-b border-[#F3ECE0] flex items-center justify-between shrink-0">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center"
                aria-label="Shree Banarasi Sarees Home"
              >
                <img
                  src="/brand_logo.webp"
                  alt="Shree Banarasi Sarees Logo"
                  className="h-9 w-auto object-contain"
                />
              </Link>
              <button
                onClick={closeMobileMenu}
                className="p-1.5 rounded-full text-[#6B625D] hover:text-[#6B1725] hover:bg-[#F3ECE0]/50 transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* DRAWER BODY (SCROLLABLE & 2-SCREEN SUBMENU SLIDE) */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative">

              <div
                className={`w-[200%] h-full flex transition-transform duration-300 ease-in-out ${drawerScreen === 'categories' ? '-translate-x-1/2' : 'translate-x-0'
                  }`}
              >
                {/* ── SCREEN 1: MAIN NAVIGATION ── */}
                <div className="w-1/2 p-4 space-y-6 shrink-0">

                  {/* Drawer Search Input */}
                  <div>
                    <AdvancedSearchBar />
                  </div>

                  {/* SHOP SECTION */}
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-[#B08A3C] uppercase tracking-widest px-2 mb-1">
                      Shop
                    </h3>
                    <Link
                      href="/sarees"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524] transition-colors"
                    >
                      <span>All Sarees</span>
                      <ChevronRight size={16} className="text-[#6B625D]/50" />
                    </Link>
                    <Link
                      href="/sarees?filter=new"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span>New Arrivals</span>
                        <span className="text-[9px] bg-[#6B1725] text-[#FAF7F0] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                      </span>
                      <ChevronRight size={16} className="text-[#6B625D]/50" />
                    </Link>
                    <Link
                      href="/sarees?filter=bestseller"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524] transition-colors"
                    >
                      <span>Bestsellers</span>
                      <ChevronRight size={16} className="text-[#6B625D]/50" />
                    </Link>

                    {/* CATEGORIES TRIGGER (OPEN SCREEN 2) */}
                    <button
                      onClick={() => setDrawerScreen('categories')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#B08A3C]/20 text-xs font-bold text-[#6B1725] hover:bg-[#FAF7F0] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Tag size={14} className="text-[#B08A3C]" />
                        <span>Categories</span>
                      </span>
                      <ChevronRight size={16} className="text-[#6B1725]" />
                    </button>
                  </div>

                  {/* SHOP BY BUDGET */}
                  <div className="space-y-1 border-t border-[#F3ECE0] pt-4">
                    <h3 className="text-[10px] font-bold text-[#B08A3C] uppercase tracking-widest px-2 mb-1">
                      Shop by Budget
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <Link
                        href="/sarees?maxPrice=999"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Under ₹999
                      </Link>
                      <Link
                        href="/sarees?maxPrice=1499"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Under ₹1,499
                      </Link>
                      <Link
                        href="/sarees?maxPrice=1999"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Under ₹2,000
                      </Link>
                      <Link
                        href="/sarees?minPrice=2000"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Above ₹2,000
                      </Link>
                    </div>
                  </div>

                  {/* SHOP BY OCCASION */}
                  <div className="space-y-1 border-t border-[#F3ECE0] pt-4">
                    <h3 className="text-[10px] font-bold text-[#B08A3C] uppercase tracking-widest px-2 mb-1">
                      Shop by Occasion
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <Link
                        href="/sarees?occasion=Wedding"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Wedding
                      </Link>
                      <Link
                        href="/sarees?occasion=Festive"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Festive
                      </Link>
                      <Link
                        href="/sarees?occasion=Party"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Party
                      </Link>
                      <Link
                        href="/sarees?occasion=Daily+Wear"
                        onClick={closeMobileMenu}
                        className="p-2 rounded-xl bg-white border border-[#F3ECE0] text-center text-[#292524] hover:border-[#B08A3C] transition-colors"
                      >
                        Everyday
                      </Link>
                    </div>
                  </div>

                  {/* ACCOUNT SECTION */}
                  <div className="space-y-1 border-t border-[#F3ECE0] pt-4">
                    <h3 className="text-[10px] font-bold text-[#B08A3C] uppercase tracking-widest px-2 mb-1">
                      Account
                    </h3>
                    {user ? (
                      <>
                        <Link
                          href="/account"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524]"
                        >
                          <User size={16} className="text-[#6B1725]" />
                          <span>My Account ({userProfile?.full_name || 'Profile'})</span>
                        </Link>
                        <Link
                          href="/account"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524]"
                        >
                          <Package size={16} className="text-[#6B1725]" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          href="/wishlist"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524]"
                        >
                          <Heart size={16} className="text-[#6B1725]" />
                          <span>Wishlist ({wishlistCount})</span>
                        </Link>
                        <button
                          onClick={() => {
                            closeMobileMenu();
                            logoutUser();
                          }}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-red-50 text-xs font-bold text-red-700 text-left"
                        >
                          <LogOut size={16} />
                          <span>Log Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            closeMobileMenu();
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#6B1725] text-[#FAF7F0] text-xs font-bold text-left justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <User size={16} />
                            <span>Login / Register</span>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                        <Link
                          href="/wishlist"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white text-xs font-bold text-[#292524]"
                        >
                          <Heart size={16} className="text-[#6B1725]" />
                          <span>Wishlist ({wishlistCount})</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* WHATSAPP SUPPORT CTA */}
                  <div className="border-t border-[#F3ECE0] pt-4">
                    <p className="text-[11px] text-[#6B625D] mb-2 px-1">
                      Need help choosing a saree?
                    </p>
                    <a
                      href="https://wa.me/916203909946"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-[#2EBE5D] hover:bg-[#25A650] text-white rounded-xl font-serif font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                      <MessageCircle size={16} className="fill-current" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>

                  {/* STORE INFO & FOOTER LINKS */}
                  <div className="border-t border-[#F3ECE0] pt-4 space-y-3 pb-6">
                    <div className="bg-white p-3 rounded-xl border border-[#F3ECE0] text-xs text-[#292524] space-y-1">
                      <p className="font-serif font-bold text-[#6B1725]">Shree Banarasi Sarees</p>
                      <p className="text-[11px] text-[#6B625D]">Samastipur, Bihar • +91 62039 09946</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B625D] font-medium pt-1">
                      <Link href="/contact" onClick={closeMobileMenu} className="hover:text-[#6B1725]">Contact Us</Link>
                      <Link href="/faqs" onClick={closeMobileMenu} className="hover:text-[#6B1725]">FAQ</Link>
                      <Link href="/shipping" onClick={closeMobileMenu} className="hover:text-[#6B1725]">Shipping</Link>
                      <Link href="/returns" onClick={closeMobileMenu} className="hover:text-[#6B1725]">Returns</Link>
                      <Link href="/about-us" onClick={closeMobileMenu} className="hover:text-[#6B1725]">About Us</Link>
                      <Link href="/our-store" onClick={closeMobileMenu} className="hover:text-[#6B1725]">Our Showroom</Link>
                    </div>
                  </div>

                </div>

                {/* ── SCREEN 2: CATEGORIES SUBMENU ── */}
                <div className="w-1/2 p-4 space-y-3 shrink-0">

                  {/* Back to main menu header */}
                  <button
                    onClick={() => setDrawerScreen('main')}
                    className="flex items-center gap-2 text-xs font-bold text-[#6B1725] p-2 hover:bg-white rounded-xl transition-colors w-full"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Menu</span>
                  </button>

                  <div className="text-[11px] font-serif font-bold text-[#B08A3C] uppercase tracking-widest px-2 pt-2 border-t border-[#F3ECE0]">
                    Select Category
                  </div>

                  <div className="space-y-1">
                    {categories.map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/sarees?category=${cat.slug}`}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F3ECE0] hover:border-[#B08A3C] transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#292524]">{cat.name}</p>
                          <p className="text-[10px] text-[#6B625D] font-light">{cat.desc}</p>
                        </div>
                        <ChevronRight size={16} className="text-[#6B625D]/50" />
                      </Link>
                    ))}

                    <Link
                      href="/sarees"
                      onClick={closeMobileMenu}
                      className="block p-3 rounded-xl bg-[#6B1725] text-[#FAF7F0] text-xs font-bold text-center mt-4"
                    >
                      VIEW ALL SAREES →
                    </Link>
                  </div>

                </div>

              </div>

            </div>
          </aside>
        </div>
      )}

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
