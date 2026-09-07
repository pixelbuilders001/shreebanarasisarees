"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronRight,
  User,
  Package,
  Heart,
  MessageCircle,
  MapPin,
  Flame,
  Star
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose }) => {
  const {
    user,
    userProfile,
    wishlist,
    logoutUser,
    setIsAuthModalOpen
  } = useStore();

  const [isRendered, setIsRendered] = useState(false);
  const [isOpenState, setIsOpenState] = useState(false);

  // Swipe-to-dismiss gesture tracking
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const isDragging = touchDeltaX < 0;

  const drawerRef = useRef<HTMLElement | null>(null);
  const wishlistCount = wishlist.length;

  // Ultra-smooth mount/unmount animation lifecycle
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';

      // Double requestAnimationFrame guarantees DOM layout is painted before starting transition
      const rAF1 = requestAnimationFrame(() => {
        const rAF2 = requestAnimationFrame(() => {
          setIsOpenState(true);
        });
        return () => cancelAnimationFrame(rAF2);
      });

      return () => {
        cancelAnimationFrame(rAF1);
      };
    } else {
      setIsOpenState(false);
      setTouchDeltaX(0);
      document.body.style.overflow = '';

      // Allow 340ms for the exit slide animation to complete before unmounting
      timer = setTimeout(() => {
        setIsRendered(false);
      }, 340);
    }

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff < 0) {
      setTouchDeltaX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaX < -60) {
      onClose();
    } else {
      setTouchDeltaX(0);
    }
    setTouchStartX(null);
  };

  if (!isRendered) return null;

  // Curated weave list (essential core navigation)
  const navCategories = [
    { name: 'Banarasi Silk Sarees', href: '/sarees/banarasi' },
    { name: 'Lucknowi Chikankari', href: '/sarees/chikankari' },
    { name: 'Bandhani & Patola', href: '/sarees/bandhani' },
    { name: 'Glass Organza', href: '/sarees/organza' },
    { name: 'Chanderi Silk', href: '/sarees/chanderi' },
    { name: 'Bridal & Wedding Sarees', href: '/sarees?occasion=Wedding' },
  ];

  // Drawer transform & transition styles
  const drawerTransform = isDragging
    ? `translateX(${touchDeltaX}px)`
    : isOpenState
    ? 'translateX(0%)'
    : 'translateX(-100%)';

  const drawerTransition = isDragging
    ? 'none'
    : 'transform 340ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 340ms ease-out';

  // Backdrop opacity styles
  const backdropOpacity = isDragging
    ? Math.max(0, 1 + touchDeltaX / 300)
    : isOpenState
    ? 1
    : 0;

  const backdropTransition = isDragging
    ? 'none'
    : 'opacity 300ms ease-out';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden lg:hidden font-sans pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Drawer"
    >
      {/* Backdrop */}
      <div
        style={{
          opacity: backdropOpacity,
          transition: backdropTransition
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Drawer Sheet */}
      <aside
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: drawerTransform,
          transition: drawerTransition,
          willChange: 'transform'
        }}
        className="fixed top-0 bottom-0 left-0 w-[82vw] max-w-[320px] bg-[#FAF7F0] shadow-2xl flex flex-col z-50 transform-gpu pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-[#E5DEC9] flex items-center justify-between shrink-0">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center"
            aria-label="Shree Banarasi Sarees Home"
          >
            <img
              src="/brand_logo.webp"
              alt="Shree Banarasi Sarees Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6B625D] hover:text-[#6B1725] hover:bg-[#FAF7F0] active:scale-90 transition-all cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 no-scrollbar">

          {/* Account Bar */}
          {user ? (
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5DEC9]">
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div className="w-8 h-8 rounded-full bg-[#6B1725] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {userProfile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#292524] truncate">
                    {userProfile?.full_name || 'My Account'}
                  </p>
                  <p className="text-[10px] text-[#7A6E65] truncate">
                    View Orders &amp; Profile
                  </p>
                </div>
              </Link>
              <button
                onClick={() => {
                  onClose();
                  logoutUser();
                }}
                className="text-[11px] font-medium text-rose-700 hover:underline shrink-0 ml-2 cursor-pointer"
                title="Log Out"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                setIsAuthModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                  <User size={15} className="text-white" />
                </div>
                <span className="text-xs font-semibold">Sign In / Register</span>
              </div>
              <ChevronRight size={16} className="text-white/70" />
            </button>
          )}

          {/* Featured Filters: New Arrivals & Bestsellers */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/sarees?filter=new"
              onClick={onClose}
              className="p-2.5 bg-white rounded-xl border border-[#E5DEC9] hover:border-[#6B1725] flex items-center justify-between transition-colors active:scale-98"
            >
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-[#6B1725]" />
                <span className="text-xs font-semibold text-[#292524]">New In</span>
              </div>
              <span className="text-[9px] font-bold bg-[#6B1725] text-white px-1.5 py-0.2 rounded-full">NEW</span>
            </Link>
            <Link
              href="/sarees?filter=bestseller"
              onClick={onClose}
              className="p-2.5 bg-white rounded-xl border border-[#E5DEC9] hover:border-[#6B1725] flex items-center justify-between transition-colors active:scale-98"
            >
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-[#292524]">Bestsellers</span>
              </div>
              <ChevronRight size={14} className="text-[#7A6E65]" />
            </Link>
          </div>

          {/* Saree Weaves Navigation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10px] font-bold text-[#B08A3C] uppercase tracking-wider">
                Shop by Weave
              </span>
              <Link
                href="/sarees"
                onClick={onClose}
                className="text-[11px] font-semibold text-[#6B1725] hover:underline"
              >
                All Sarees &rarr;
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-[#E5DEC9] divide-y divide-[#F3ECE0] overflow-hidden">
              {navCategories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0]"
                >
                  <span>{cat.name}</span>
                  <ChevronRight size={14} className="text-[#7A6E65]/60" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#B08A3C] uppercase tracking-wider px-1">
              Quick Links
            </span>
            <div className="bg-white rounded-xl border border-[#E5DEC9] divide-y divide-[#F3ECE0] overflow-hidden">
              {user ? (
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0]"
                >
                  <div className="flex items-center gap-2.5">
                    <Package size={15} className="text-[#6B1725]" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight size={14} className="text-[#7A6E65]/60" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Package size={15} className="text-[#6B1725]" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight size={14} className="text-[#7A6E65]/60" />
                </button>
              )}

              {user ? (
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0]"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart size={15} className="text-[#6B1725]" />
                    <span>Saved Wishlist</span>
                  </div>
                  {wishlistCount > 0 ? (
                    <span className="text-[10px] font-bold bg-[#6B1725] text-white px-2 py-0.2 rounded-full">
                      {wishlistCount}
                    </span>
                  ) : (
                    <ChevronRight size={14} className="text-[#7A6E65]/60" />
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart size={15} className="text-[#6B1725]" />
                    <span>Saved Wishlist</span>
                  </div>
                  <ChevronRight size={14} className="text-[#7A6E65]/60" />
                </button>
              )}

              <Link
                href="/our-store"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0]"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin size={15} className="text-[#6B1725]" />
                  <span>Our Showroom</span>
                </div>
                <ChevronRight size={14} className="text-[#7A6E65]/60" />
              </Link>

              <a
                href="https://wa.me/+916203909946?text=Namaste!%20I%20would%20like%20assistance%20with%20a%20saree."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#FAF7F0] text-xs font-medium text-[#292524] transition-colors active:bg-[#F3ECE0]"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle size={15} className="text-[#2EBE5D] fill-[#2EBE5D]" />
                  <span>Chat on WhatsApp</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Live
                </span>
              </a>
            </div>
          </div>

          {/* Correct Showroom Address & Contact */}
          <div className="pt-2 pb-4 border-t border-[#E5DEC9] space-y-1.5 text-center">
            <p className="text-xs font-bold text-[#6B1725]">Shree Banarasi Sarees</p>
            <p className="text-[11px] text-[#7A6E65] leading-relaxed">
              Rudauli Chowk, Harpur Aloth, Samastipur, Bihar &ndash; 848103
            </p>
            <p className="text-[11px] text-[#7A6E65]">
              <a href="tel:+916203909946" className="font-semibold text-[#292524] hover:text-[#6B1725]">
                +91 62039 09946
              </a>
              {' '}&bull;{' '}
              <Link href="/contact" onClick={onClose} className="hover:underline">
                Contact
              </Link>
            </p>
          </div>

        </div>
      </aside>
    </div>
  );
};
