"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  LogOut,
  Package,
  Sparkles
} from 'lucide-react';

import { useStore } from '../context/StoreContext';
import { AnnouncementBar } from './AnnouncementBar';
import { AdvancedSearchBar } from './AdvancedSearchBar';
import { AuthModal } from './AuthModal';
import { DeliveryPincodeBar } from './DeliveryPincodeBar';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholder';

export interface HeaderProps {
  hideOnMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ hideOnMobile = false }) => {
  return <HeaderInner hideOnMobile={hideOnMobile} />;
};

const HeaderInner: React.FC<HeaderProps> = ({ hideOnMobile = false }) => {
  const router = useRouter();
  const {
    cart,
    wishlist,
    setIsCartOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    userProfile,
    logoutUser,
    categories: dbCategories
  } = useStore();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Scroll state for sticky header transition
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(true);
  };

  // Handle closing mobile menu drawer
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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

  const categories = useMemo<{ name: string; slug: string; desc: string; image_url: string | null }[]>(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map(c => ({
        name: c.name,
        slug: c.slug,
        desc: c.description || 'Collection',
        image_url: c.image_url || null
      }));
    }
    return [];
  }, [dbCategories]);

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT STRIP (SAMASTIPUR DELIVERY, STORE, WHATSAPP, TRACK ORDER) */}
      <div className={hideOnMobile ? "hidden lg:block" : ""}>
        <AnnouncementBar />
      </div>

      {/* 2. MAIN HEADER (STICKY ON DESKTOP & MOBILE) */}
      <header
        className={`${hideOnMobile ? "hidden lg:block" : ""} sticky top-0 z-40 w-full transition-all duration-300 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#F3ECE0] ${isScrolled ? 'shadow-sm py-1.5 sm:py-2' : 'py-2.5 sm:py-3.5'
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
              {user ? (
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
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="relative p-2 text-[#292524] hover:text-[#6B1725] transition-colors cursor-pointer"
                  aria-label="Wishlist (Sign in required)"
                >
                  <Heart size={21} />
                </button>
              )}

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
                className="p-2 text-[#292524] hover:text-[#6B1725] active:scale-90 transition-transform cursor-pointer"
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

                {user ? (
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
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="relative p-2 text-[#292524] hover:text-[#6B1725] cursor-pointer"
                    aria-label="Wishlist (Sign in required)"
                  >
                    <Heart size={21} />
                  </button>
                )}

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

            {/* MOBILE PINCODE DELIVERY BAR MATCHING IMAGE 2 */}
            <div className="w-full -mx-4 font-sans font-medium" style={{ width: 'calc(100% + 2rem)' }}>
              <DeliveryPincodeBar />
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
            className="hidden lg:block absolute top-full left-0 right-0 w-full bg-white border-b border-[#B08A3C]/30 shadow-xl z-50 animate-slideDown"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3ECE0]">
                <div className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-[#6B1725]" />
                  Curated Categories
                </div>
                <Link
                  href="/sarees"
                  onClick={() => setIsCollectionsOpen(false)}
                  className="text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] inline-flex items-center gap-1 hover:underline tracking-wider uppercase"
                >
                  View All Sarees →
                </Link>
              </div>

              {categories.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map(cat => (
                    <Link
                      key={cat.slug}
                      href={cat.slug ? `/sarees/${cat.slug}` : `/sarees?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsCollectionsOpen(false)}
                      className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF7F0]/70 border border-[#B08A3C]/15 hover:bg-[#6B1725] hover:border-[#6B1725] transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md min-w-0"
                    >
                      {/* Small Category Image Thumbnail */}
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#292524] border border-[#B08A3C]/30 group-hover:border-white/50 transition-colors">
                        <Image
                          src={cat.image_url || NO_IMAGE_PLACEHOLDER}
                          alt={cat.name}
                          fill
                          sizes="44px"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      {/* Text content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-serif font-bold text-[#292524] group-hover:text-[#FAF7F0] transition-colors leading-tight truncate">
                            {cat.name}
                          </h4>
                          <ChevronRight size={13} className="text-[#B08A3C] group-hover:text-[#FAF7F0] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-[10px] text-[#6B625D] group-hover:text-[#FAF7F0]/80 font-light transition-colors leading-tight line-clamp-1 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-[#6B625D]">
                  No categories available
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 3. MOBILE NAVIGATION DRAWER */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
