"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  Heart,
  CheckCircle,
  Lock,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';
import { useStore, CartItem } from '../context/StoreContext';
import { getProductSlug } from '../data/supabase';
import { Product } from '../data/products';

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    addToCart,
    toggleWishlist,
    isInWishlist,
    user,
    userPhone,
    setIsAuthModalOpen
  } = useStore();

  // Undo item removal state
  const [removedHistory, setRemovedHistory] = useState<{ item: CartItem; index: number } | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  // Wishlist notification state
  const [wishlistToastMsg, setWishlistToastMsg] = useState<string | null>(null);

  // PWA Install state
  const isStandalone = useIsPwaInstalled();

  const handlePwaInstall = async () => {
    const promptEvent = typeof window !== 'undefined' ? (window as any).deferredPwaPrompt : null;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
          markPwaAsInstalled();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else {
      alert('To install our app:\n1. Tap the Share icon in your browser\n2. Select "Add to Home Screen"');
    }
  };

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = item.product.salePrice ?? item.product.price;
      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const originalTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }, [cart]);

  const totalItemSavings = originalTotal - subtotal;

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const shippingFee = subtotal > 0 ? (isFreeShipping ? 0 : STANDARD_SHIPPING_FEE) : 0;
  const grandTotal = Math.max(0, subtotal + shippingFee);

  // Handle Remove Item with Undo
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

  // Handle Move to Wishlist
  const handleMoveToWishlist = (product: Product) => {
    if (!isInWishlist(product.id)) {
      toggleWishlist(product);
    }
    removeFromCart(product.id);

    setWishlistToastMsg(`"${product.name}" moved to Wishlist ♥`);
    setTimeout(() => {
      setWishlistToastMsg(null);
    }, 3500);
  };

  // Checkout Handler
  const handleProceedToCheckout = () => {
    if (!user) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
    } else {
      setIsCartOpen(false);
      router.push('/checkout');
    }
  };

  // WhatsApp Chat Launcher
  const handleWhatsAppHelp = () => {
    const phone = "9191620390946";
    const msg = encodeURIComponent("Hi Shree Banarasi Sarees, I need help with my cart.");
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFF9F0] border-l border-[#B08A3C]/25 flex flex-col shadow-2xl animate-slide-in overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-white border-b border-[#B08A3C]/20 flex items-center justify-between shrink-0">
            <h2 className="text-base font-serif font-extrabold text-[#292524] flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#6B1725]" />
              Your Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
            <div className="flex items-center gap-2">
              {!isStandalone && (
                <button
                  onClick={handlePwaInstall}
                  className="inline-flex items-center gap-1 bg-[#6B1725]/10 hover:bg-[#6B1725]/20 text-[#6B1725] px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border border-[#6B1725]/20 active:scale-95 sm:hidden"
                  title="Install Mobile App"
                >
                  <Smartphone size={13} />
                  <span>Install App</span>
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full text-[#6B625D]/60 hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Toast Alerts inside Drawer */}
          {undoToastVisible && removedHistory && (
            <div className="bg-[#292524] text-[#FAF7F0] px-4 py-2.5 text-xs flex items-center justify-between shrink-0 border-b border-[#B08A3C]/30 animate-slideDown">
              <span>Saree removed from bag.</span>
              <button
                onClick={handleUndoRemove}
                className="font-serif font-bold text-[#B08A3C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> UNDO
              </button>
            </div>
          )}

          {wishlistToastMsg && (
            <div className="bg-[#6B1725] text-[#FAF7F0] px-4 py-2.5 text-xs flex items-center gap-2 shrink-0 animate-slideDown">
              <Heart size={13} className="text-[#B08A3C] fill-[#B08A3C]" />
              <span>{wishlistToastMsg}</span>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/30 flex items-center justify-center text-[#6B1725] text-2xl mb-4">
                  ✨
                </div>
                <h3 className="text-lg font-serif font-bold text-[#292524] mb-2">
                  Your saree collection is waiting
                </h3>
                <p className="text-xs text-[#6B625D] max-w-xs mb-6 leading-relaxed">
                  Explore our latest handpicked traditional Banarasi sarees and find something beautiful for your celebration.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-[#6B1725] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#52111C] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  EXPLORE SAREES
                </button>
              </div>
            ) : (
              <>
                {/* Free Shipping Progress */}
                <div className="bg-white border border-[#B08A3C]/30 rounded-xl p-3 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Truck size={15} className="text-[#6B1725] flex-shrink-0" />
                    {isFreeShipping ? (
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle size={13} className="text-emerald-600" />
                        You unlocked FREE shipping!
                      </span>
                    ) : (
                      <span className="font-medium text-[#292524]">
                        Add <strong className="text-[#6B1725]">₹{remainingForFreeShipping.toLocaleString('en-IN')}</strong> more for <strong className="text-emerald-700">FREE shipping</strong>
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-[#FAF7F0] overflow-hidden border border-[#B08A3C]/15">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFreeShipping ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#6B1725] to-[#B08A3C]'
                      }`}
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="space-y-2.5">
                  {cart.map((item, index) => {
                    const currentPrice = item.product.salePrice ?? item.product.price;
                    const originalPrice = item.product.price;
                    const hasDiscount = !!item.product.salePrice && item.product.salePrice < originalPrice;
                    const discountPercent = hasDiscount
                      ? Math.round(((originalPrice - item.product.salePrice!) / originalPrice) * 100)
                      : 0;

                    const stockLimitReached = item.quantity >= item.product.stock;

                    return (
                      <div
                        key={item.product.id}
                        className="bg-white p-3 rounded-xl border border-[#B08A3C]/20 flex gap-3 shadow-sm relative"
                      >
                        {/* Thumbnail */}
                        <Link
                          href={`/product/${item.product.slug || getProductSlug(item.product.name, item.product.id)}`}
                          onClick={() => setIsCartOpen(false)}
                          className="w-16 aspect-[3/4] rounded-lg overflow-hidden bg-[#FAF7F0] border border-[#B08A3C]/15 flex-shrink-0"
                        >
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <Link
                                href={`/product/${item.product.slug || getProductSlug(item.product.name, item.product.id)}`}
                                onClick={() => setIsCartOpen(false)}
                                className="text-xs font-serif font-bold text-[#292524] hover:text-[#6B1725] line-clamp-1"
                              >
                                {item.product.name}
                              </Link>
                              <button
                                onClick={() => handleRemoveItem(item, index)}
                                className="text-[#6B625D]/50 hover:text-red-600 transition-colors flex-shrink-0 cursor-pointer"
                                aria-label="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <p className="text-[10px] text-[#6B625D] mt-0.5 line-clamp-1">
                              {item.product.fabric} &bull; {item.product.color}
                            </p>

                            {item.product.stock > 0 && item.product.stock <= 3 && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-1">
                                Only {item.product.stock} left in stock
                              </span>
                            )}
                          </div>

                          {/* Price & Quantity Bar */}
                          <div className="flex justify-between items-end mt-1.5 pt-1.5 border-t border-[#B08A3C]/10">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-1">
                                <span className="font-serif text-xs font-bold text-[#6B1725]">
                                  ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[9px] text-[#6B625D]/50 line-through">
                                    ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              {hasDiscount && (
                                <span className="text-[9px] text-emerald-700 font-semibold">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>

                            {/* Wishlist + Quantity */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleMoveToWishlist(item.product)}
                                className="text-[10px] text-[#6B625D] hover:text-[#6B1725] cursor-pointer"
                                title="Move to Wishlist"
                              >
                                <Heart size={12} className={isInWishlist(item.product.id) ? "fill-[#6B1725] text-[#6B1725]" : ""} />
                              </button>

                              <div className="flex items-center border border-[#B08A3C]/30 rounded-lg bg-[#FAF7F0] p-0.5">
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="p-0.5 text-[#292524] hover:text-[#6B1725] disabled:opacity-30 cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="px-1.5 text-[10px] font-bold text-[#292524] min-w-[16px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    if (item.quantity < item.product.stock) {
                                      updateCartQuantity(item.product.id, item.quantity + 1);
                                    }
                                  }}
                                  disabled={stockLimitReached}
                                  className="p-0.5 text-[#292524] hover:text-[#6B1725] disabled:opacity-30 cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Savings Summary Banner */}
                {totalItemSavings > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>Saving <strong>₹{totalItemSavings.toLocaleString('en-IN')}</strong> on this order!</span>
                  </div>
                )}

                {/* WhatsApp Chat Support */}
                <button
                  onClick={handleWhatsAppHelp}
                  className="w-full py-2.5 bg-[#FAF7F0] hover:bg-[#F3ECE0] text-[#292524] border border-[#B08A3C]/30 rounded-xl text-xs font-serif font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageCircle size={15} className="text-[#2EBE5D]" />
                  Need help? Chat on WhatsApp
                </button>
              </>
            )}
          </div>

          {/* Footer Summary & Direct Checkout CTA */}
          {cart.length > 0 && (
            <div className="bg-white border-t border-[#B08A3C]/20 p-4 shrink-0 space-y-3 shadow-lg">
              <div className="space-y-1.5 text-xs text-[#6B625D]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#292524]">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    <span className="font-semibold text-[#292524]">₹{shippingFee.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="flex justify-between text-sm font-serif font-bold text-[#292524] border-t border-[#B08A3C]/15 pt-2 mt-1">
                  <span>Total Payable</span>
                  <span className="text-[#6B1725] text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* CHECKOUT BUTTON */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-[#6B1725] text-[#FAF7F0] text-center rounded-xl font-serif font-bold tracking-wider hover:bg-[#52111C] active:scale-[0.99] transition-all shadow-md text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock size={15} className="text-[#B08A3C]" />
                PROCEED TO CHECKOUT
              </button>

              {/* Trust Badges */}
              <div className="text-center pt-1">
                <span className="text-[10px] text-[#6B625D] flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-700" />
                  Secure Checkout &bull; COD Available &bull; Pan-India Delivery
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
