"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Trash2,
  Zap,
  Truck,
  Tag,
  Plus,
  Minus,
  RotateCcw,
  Check,
  X,
  MapPin,
  Heart,
  Loader2
} from 'lucide-react';
import { useStore, CartItem } from '../context/StoreContext';
import { getProductSlug } from '../data/supabase';
import { useCustomerLocation } from '../hooks/useCustomerLocation';

import { DeliveryPincodeBar, openPincodeSheet, getExpressTimingStatus } from './DeliveryPincodeBar';

interface CartViewProps {
  onBack?: () => void;
  isDrawer?: boolean;
}

const CartSkeleton: React.FC<{ isDrawer?: boolean }> = ({ isDrawer = false }) => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-between font-sans">
      {/* 1. TOP HEADER BAR SKELETON */}
      <header className="bg-white border-b border-[#E5DEC9] sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-stone-200 animate-pulse" />
          <div className="w-24 h-6 bg-stone-200 rounded-md animate-pulse" />
        </div>
        {isDrawer && <div className="w-5 h-5 rounded-full bg-stone-200 animate-pulse" />}
      </header>

      {/* 2. MAIN SKELETON CONTENT */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-4 pb-44 lg:pb-28">
        {/* Delivery Pincode Card Skeleton */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] p-3.5 sm:p-4 flex items-center justify-between shadow-2xs animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-stone-200" />
            <div className="w-36 h-4 bg-stone-200 rounded-md" />
          </div>
          <div className="w-12 h-4 bg-stone-200 rounded-md" />
        </div>

        {/* Cart Item Cards Skeletons */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E5DEC9] p-3.5 flex gap-3.5 shadow-2xs animate-pulse"
            >
              {/* Thumbnail Image Skeleton */}
              <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-stone-200 shrink-0" />

              {/* Details Column Skeleton */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                <div className="space-y-2">
                  <div className="w-20 h-3 bg-stone-200 rounded-md" />
                  <div className="w-3/4 h-4 bg-stone-200 rounded-md" />
                  <div className="w-1/2 h-4 bg-stone-200 rounded-md" />
                  <div className="w-24 h-5 bg-stone-200 rounded-md mt-2" />
                  <div className="w-32 h-3 bg-stone-100 rounded-md mt-1" />
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#F3ECE0]">
                  <div className="w-14 h-4 bg-stone-200 rounded-md" />
                  <div className="w-20 h-7 bg-stone-100 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Option Skeleton */}
        <div className="space-y-2 pt-1">
          <div className="w-16 h-3 bg-stone-200 rounded-md animate-pulse" />
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-3.5 flex items-center justify-between shadow-2xs animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="w-36 h-4 bg-stone-200 rounded-md" />
                <div className="w-48 h-3 bg-stone-200 rounded-md" />
              </div>
            </div>
            <div className="w-10 h-4 bg-stone-200 rounded-md" />
          </div>
        </div>

        {/* Coupon Box Skeleton */}
        <div className="bg-white rounded-2xl border border-dashed border-[#E5DEC9] p-3.5 h-12 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-4 h-4 rounded-full bg-stone-200" />
            <div className="w-24 h-4 bg-stone-200 rounded-md" />
          </div>
          <div className="w-14 h-6 bg-stone-200 rounded-full" />
        </div>

        {/* Bill Summary Skeleton */}
        <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 space-y-3 shadow-2xs animate-pulse">
          <div className="w-12 h-3 bg-stone-200 rounded-md" />
          <div className="space-y-2 pt-1">
            <div className="flex justify-between">
              <div className="w-20 h-4 bg-stone-200 rounded-md" />
              <div className="w-16 h-4 bg-stone-200 rounded-md" />
            </div>
            <div className="flex justify-between">
              <div className="w-24 h-4 bg-stone-200 rounded-md" />
              <div className="w-12 h-4 bg-stone-200 rounded-md" />
            </div>
          </div>
          <div className="border-t border-[#F3ECE0] pt-3 flex justify-between">
            <div className="w-16 h-5 bg-stone-200 rounded-md" />
            <div className="w-24 h-6 bg-stone-200 rounded-md" />
          </div>
        </div>
      </main>

      {/* 3. STICKY CHECKOUT BAR SKELETON */}
      <div className={`fixed left-0 right-0 z-30 bg-white border-t border-[#E5DEC9] p-3.5 sm:p-4 shadow-md animate-pulse ${
        isDrawer ? 'bottom-0 max-w-md sm:max-w-lg ml-auto' : 'bottom-[58px] lg:bottom-0'
      }`}>
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="w-24 h-6 bg-stone-200 rounded-md" />
            <div className="w-16 h-3 bg-stone-200 rounded-md" />
          </div>
          <div className="w-32 h-11 bg-stone-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const CartView: React.FC<CartViewProps> = ({ onBack, isDrawer = false }) => {
  const router = useRouter();
  const {
    cart,
    products,
    wishlist,
    toggleWishlist,
    isInWishlist,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    addToCart,
    user,
    setIsAuthModalOpen,
    isHydrated
  } = useStore();

  // Skeleton Loading & Navigation State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState<boolean>(false);

  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  // Pincode State synchronized with global location system
  const [pincode, setPincode] = useState<string>('848101');

  // Sync pincode from sessionStorage/localStorage & event listener
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem('selected_delivery_pincode') || localStorage.getItem('user_pincode') || '848101';
      setPincode(savedPin);

      const handlePincodeUpdate = (e: CustomEvent) => {
        if (e.detail?.pincode) {
          setPincode(e.detail.pincode);
        }
      };

      window.addEventListener('pincode-updated', handlePincodeUpdate as EventListener);
      return () => {
        window.removeEventListener('pincode-updated', handlePincodeUpdate as EventListener);
      };
    }
  }, []);

  // Location serviceability check hook
  const { result, checkPincode } = useCustomerLocation();

  useEffect(() => {
    if (pincode) {
      checkPincode(pincode);
    }
  }, [pincode, checkPincode]);

  const is20Min = useMemo(() => {
    if (result) {
      return !!(result.is20MinDelivery || (result.distanceKm !== undefined && result.distanceKm <= 20) || (result as any).eligible);
    }
    return pincode === '848101' || pincode === '848114';
  }, [result, pincode]);

  const timingStatus = useMemo(() => {
    return getExpressTimingStatus(result);
  }, [result]);

  // Delivery method choice: automatically synced with pincode serviceability
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'express_20min' | 'standard'>('express_20min');

  useEffect(() => {
    if (is20Min) {
      setSelectedDeliveryMethod('express_20min');
    } else {
      setSelectedDeliveryMethod('standard');
    }
  }, [is20Min]);

  // Coupon state
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Undo removal history & Wishlist confirm modal
  const [removedHistory, setRemovedHistory] = useState<{ item: CartItem; index: number } | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ item: CartItem; index: number } | null>(null);
  const [wishlistToastMsg, setWishlistToastMsg] = useState<string | null>(null);

  // Cart total calculations
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const originalTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product.salePrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const itemDiscount = Math.max(0, originalTotal - subtotal);

  // Delivery fee
  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (selectedDeliveryMethod === 'express_20min') return 49;
    return subtotal >= 1999 ? 0 : 99;
  }, [cart, selectedDeliveryMethod, subtotal]);

  // Coupon discount amount
  const couponDiscountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discount) / 100) : 0;
  const totalSavings = itemDiscount + couponDiscountAmount;

  // Final Payable
  const finalPayable = Math.max(0, subtotal - couponDiscountAmount + deliveryFee);

  // Handlers
  const handleRemoveItem = (item: CartItem, index: number) => {
    setRemovedHistory({ item, index });
    removeFromCart(item.product.id);
    setUndoToastVisible(true);
    setTimeout(() => {
      setUndoToastVisible(false);
    }, 5000);
  };

  const handleUndoRemove = () => {
    if (removedHistory) {
      addToCart(removedHistory.item.product, removedHistory.item.quantity);
      setRemovedHistory(null);
      setUndoToastVisible(false);
    }
  };

  const handleApplyCoupon = () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === 'SHREE10' || cleanCode === 'WELCOME10' || cleanCode === 'BANARASI10') {
      setAppliedCoupon({ code: cleanCode, discount: 10 });
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon code. Try SHREE10');
      setTimeout(() => setCouponError(null), 3000);
    }
  };

  const handleProceedToCheckout = () => {
    setIsNavigatingToCheckout(true);
    setIsCartOpen(false);
    if (!user) {
      setIsNavigatingToCheckout(false);
      setIsAuthModalOpen(true);
    } else {
      router.push('/checkout');
    }
  };

  const handleClose = () => {
    if (onBack) {
      onBack();
    } else {
      setIsCartOpen(false);
    }
  };

  if (isLoading) {
    return <CartSkeleton isDrawer={isDrawer} />;
  }

  return (
    <div className="min-h-full bg-[#FAF7F0] flex flex-col justify-between font-sans text-[#292524]">
      {/* 1. TOP HEADER BAR */}
      <header className="bg-white border-b border-[#E5DEC9] sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-[#292524] hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524] flex items-center gap-1.5">
            <span>Cart</span>
            <span className="text-base text-[#7A6E65] font-normal">&middot; {cartCount}</span>
          </h1>
        </div>

        {isDrawer && (
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-full text-[#7A6E65] hover:text-[#6B1725] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </header>

      {/* Global Delivery Pincode Bar Portal Host (Bar hidden in cart layout) */}
      <DeliveryPincodeBar hideBar={true} />

      {/* UNDO REMOVAL TOAST */}
      {undoToastVisible && removedHistory && (
        <div className="bg-[#292524] text-[#FAF7F0] px-4 py-2.5 text-xs flex items-center justify-between sticky top-14 z-30 animate-slideDown shadow-md">
          <span>Saree removed from cart.</span>
          <button
            onClick={handleUndoRemove}
            className="font-serif font-bold text-[#D4B870] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} /> UNDO
          </button>
        </div>
      )}

      {/* WISHLIST TOAST */}
      {wishlistToastMsg && (
        <div className="bg-[#6B1725] text-white px-4 py-2.5 text-xs font-sans font-medium flex items-center justify-between sticky top-14 z-30 animate-slideDown shadow-md">
          <span className="flex items-center gap-1.5">
            <Heart size={14} className="fill-white" />
            {wishlistToastMsg}
          </span>
          <button
            onClick={() => setWishlistToastMsg(null)}
            className="text-white hover:opacity-80 p-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-4 pb-44 lg:pb-28">
        {cart.length === 0 ? (
          /* PIXEL-PERFECT EMPTY CART VIEW MATCHING MOCKUP */
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] py-12 px-6 text-center">
            {/* Gold Circular Outline with Tag Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-[#D4C39D] bg-transparent flex items-center justify-center mx-auto mb-6 shrink-0">
              <Tag size={32} className="text-[#B08A3C] stroke-[1.5]" />
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl sm:text-3xl text-[#292524] font-normal tracking-tight mb-3">
              Your cart is empty
            </h2>

            {/* Description */}
            <p className="font-sans text-sm sm:text-base text-[#7A6E65] max-w-sm mx-auto leading-relaxed font-normal mb-8">
              Every saree we stock is one-of-one. If something caught your eye earlier, it may not wait.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                router.push('/sarees');
              }}
              className="py-3.5 px-8 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-sans font-semibold text-sm sm:text-base transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Browse {products && products.length > 0 ? products.length : 14} sarees
            </button>
          </div>
        ) : (
          <>
            {/* ── 2A. PINCODE / DELIVERY LOCATION CARD (TRIGGERS PINCODE SHEET) ── */}
            <div
              onClick={openPincodeSheet}
              className="bg-white rounded-2xl border border-[#E5DEC9] p-3.5 sm:p-4 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#6B1725]/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#292524]">
                <MapPin size={15} className="text-[#B08A3C] shrink-0" />
                <span className="text-[#7A6E65]">Delivering to</span>
                <strong className="font-bold text-[#292524]">{pincode}</strong>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPincodeSheet();
                }}
                className="text-xs font-semibold text-[#B08A3C] hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* ── 2B. CART ITEMS LIST ── */}
            <div className="space-y-3">
              {cart.map((item, index) => {
                const currentPrice = item.product.salePrice ?? item.product.price;
                const originalPrice = item.product.price;
                const hasDiscount = !!item.product.salePrice && item.product.salePrice < originalPrice;

                return (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-2xl border border-[#E5DEC9] p-3.5 flex gap-3.5 shadow-2xs relative"
                  >
                    {/* Item Thumbnail Image */}
                    <Link
                      href={`/product/${item.product.slug || getProductSlug(item.product.name, item.product.id)}`}
                      onClick={() => setIsCartOpen(false)}
                      className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-[#FAF7F0] border border-[#E5DEC9]/70 shrink-0 relative"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details Column */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Category Tag */}
                        <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider block mb-0.5">
                          {item.product.fabric || item.product.category || 'BANARASI SILK'}
                        </span>

                        {/* Title */}
                        <Link
                          href={`/product/${item.product.slug || getProductSlug(item.product.name, item.product.id)}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs sm:text-sm font-serif font-bold text-[#292524] hover:text-[#6B1725] line-clamp-2 leading-snug"
                        >
                          {item.product.name}
                        </Link>

                        {/* Price Line */}
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-sans text-sm sm:text-base font-bold text-[#292524]">
                            ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-[#A89F91] line-through font-normal">
                              ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Stock & Specs */}
                        <p className="text-[11px] font-sans text-[#7A6E65] mt-1">
                          Blouse piece included &middot; Qty {item.quantity} (single stock)
                        </p>
                      </div>

                      {/* Remove Button & Quantity controls */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#F3ECE0]">
                        <button
                          onClick={() => setItemToRemove({ item, index })}
                          className="text-xs font-medium text-[#7A6E65] hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>

                        <div className="flex items-center border border-[#E5DEC9] rounded-lg bg-[#FAF7F0] p-0.5">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-[#292524] hover:text-[#6B1725] disabled:opacity-30 cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-2 text-xs font-bold text-[#292524] min-w-[18px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 text-[#292524] hover:text-[#6B1725] disabled:opacity-30 cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 2C. DYNAMIC SINGLE DELIVERY OPTION BASED ON PINCODE ── */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-[#B08A3C] uppercase tracking-widest block font-serif">
                DELIVERY
              </span>

              {is20Min ? (
                /* 20-Minute Local Express Delivery Option (for Samastipur area pincodes) */
                <div className="bg-white border-1.5 border-[#6B1725] rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
                      <Zap size={16} className="fill-[#6B1725]" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-sans font-bold text-[#292524]">
                        {timingStatus.isNormalHours ? '20-minute hand delivery' : timingStatus.timingText}
                      </h4>
                      <p className="text-[11px] text-[#7A6E65]">
                        {timingStatus.descText}
                      </p>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-xs sm:text-sm text-[#292524]">
                    ₹49
                  </span>
                </div>
              ) : (
                /* Standard Express India Delivery Option (for all other pincodes) */
                <div className="bg-white border-1.5 border-[#6B1725] rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E5DEC9] flex items-center justify-center text-[#7A6E65] shrink-0">
                      <Truck size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-sans font-bold text-[#292524]">
                        Express, 3–5 days
                      </h4>
                      <p className="text-[11px] text-[#7A6E65]">
                        Free above ₹1,999 &middot; COD available
                      </p>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-xs sm:text-sm text-[#0F766E]">
                    {subtotal >= 1999 ? 'Free' : '₹99'}
                  </span>
                </div>
              )}
            </div>

            {/* ── 2D. COUPON CODE BOX ── */}
            <div className="bg-white rounded-2xl border border-dashed border-[#B08A3C]/70 p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 flex-1 mr-2">
                <Tag size={16} className="text-[#B08A3C] shrink-0" />
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="text-xs text-[#292524] placeholder:text-[#A89F91] bg-transparent outline-none w-full font-sans uppercase font-medium"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                className="text-xs font-bold text-[#6B1725] hover:underline cursor-pointer shrink-0"
              >
                {appliedCoupon ? 'Applied' : 'Apply'}
              </button>
            </div>

            {couponError && (
              <p className="text-xs text-red-600 font-medium px-1">{couponError}</p>
            )}

            {appliedCoupon && (
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex justify-between items-center">
                <span>Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discount}% OFF)</span>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
            )}

            {/* ── 2E. BILL DETAILS CARD ── */}
            <div className="bg-white rounded-2xl border border-[#E5DEC9] p-4 sm:p-5 space-y-2.5 shadow-2xs">
              <span className="text-[11px] font-bold text-[#B08A3C] uppercase tracking-widest block font-serif mb-1">
                BILL
              </span>

              {/* Item Total */}
              <div className="flex justify-between text-xs sm:text-sm text-[#7A6E65]">
                <span>Item total ({cartCount})</span>
                <span className="font-bold text-[#292524]">₹{originalTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Discount */}
              {totalSavings > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-[#7A6E65]">
                  <span>Discount</span>
                  <span className="font-bold text-[#0F766E]">- ₹{totalSavings.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Delivery */}
              <div className="flex justify-between text-xs sm:text-sm text-[#7A6E65]">
                <span>Delivery</span>
                <span className="font-bold text-[#292524]">
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-[#E5DEC9] pt-2.5 flex justify-between items-baseline">
                <span className="font-serif font-extrabold text-base sm:text-lg text-[#292524]">To pay</span>
                <span className="font-serif font-extrabold text-xl sm:text-2xl text-[#292524]">
                  ₹{finalPayable.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Savings callout */}
              {totalSavings > 0 && (
                <p className="text-xs font-medium text-[#0F766E] pt-0.5">
                  You save ₹{totalSavings.toLocaleString('en-IN')} on this order
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {/* 3. STICKY BOTTOM CHECKOUT BAR */}
      {cart.length > 0 && (
        <div
          className={`fixed left-0 right-0 z-30 bg-white border-t border-[#E5DEC9] p-3.5 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] ${
            isDrawer
              ? 'bottom-0 max-w-md sm:max-w-lg ml-auto'
              : 'bottom-[58px] lg:bottom-0'
          }`}
        >
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="font-serif font-extrabold text-xl sm:text-2xl text-[#292524]">
                ₹{finalPayable.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#7A6E65] font-sans block">
                {cartCount} saree{cartCount > 1 ? 's' : ''}
              </span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={isNavigatingToCheckout}
              className="py-3.5 px-8 sm:px-10 bg-[#6B1725] hover:bg-[#52111C] disabled:opacity-80 text-white rounded-full font-serif font-bold text-sm tracking-wide uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isNavigatingToCheckout ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>PROCEEDING...</span>
                </>
              ) : (
                <span>Checkout</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── MOVE TO WISHLIST CONFIRMATION MODAL ── */}
      {typeof window !== 'undefined' && itemToRemove && createPortal(
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn p-0 sm:p-4">
          {/* Backdrop click to cancel */}
          <div className="absolute inset-0" onClick={() => setItemToRemove(null)} />

          {/* Modal Content Card */}
          <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-in-from-bottom border border-[#E5DEC9]">
            {/* Drawer grab handle for mobile */}
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

            {/* Header with Heart Icon */}
            <div className="flex items-center justify-between border-b border-[#F3ECE0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
                  <Heart size={18} className="fill-[#6B1725]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#292524] leading-tight">
                    Save to Wishlist?
                  </h3>
                  <span className="text-[11px] font-sans text-[#7A6E65] block">
                    Save before removing from cart
                  </span>
                </div>
              </div>
              <button
                onClick={() => setItemToRemove(null)}
                className="p-1.5 rounded-full text-[#7A6E65] hover:text-[#292524] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Card Preview */}
            <div className="flex gap-3 bg-[#FAF7F0] p-3 rounded-2xl border border-[#E5DEC9]">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-[#E5DEC9]">
                <img
                  src={itemToRemove.item.product.images[0]}
                  alt={itemToRemove.item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                <span className="text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-wider">
                  {itemToRemove.item.product.fabric || itemToRemove.item.product.category || 'BANARASI SILK'}
                </span>
                <h4 className="text-xs sm:text-sm font-serif font-bold text-[#292524] line-clamp-2 leading-snug">
                  {itemToRemove.item.product.name}
                </h4>
                <span className="font-serif font-bold text-xs text-[#292524]">
                  ₹{(itemToRemove.item.product.salePrice || itemToRemove.item.product.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#7A6E65] font-sans leading-relaxed">
              Would you like to save this saree to your wishlist so you can easily view or purchase it later?
            </p>

            {/* Modal Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  if (!isInWishlist(itemToRemove.item.product.id)) {
                    toggleWishlist(itemToRemove.item.product);
                  }
                  removeFromCart(itemToRemove.item.product.id);
                  setWishlistToastMsg(`"${itemToRemove.item.product.name}" moved to Wishlist ❤️`);
                  setItemToRemove(null);
                  setTimeout(() => setWishlistToastMsg(null), 4000);
                }}
                className="w-full py-3 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-full font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Heart size={14} className="fill-white" />
                <span>Move to Wishlist & Remove</span>
              </button>

              <button
                onClick={() => {
                  handleRemoveItem(itemToRemove.item, itemToRemove.index);
                  setItemToRemove(null);
                }}
                className="w-full py-2.5 bg-white hover:bg-stone-50 text-[#7A6E65] hover:text-[#292524] border border-[#E5DEC9] rounded-full font-serif font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={13} />
                <span>Remove Only</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
