"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateCartQuantity, 
    removeFromCart,
    user,
    userPhone,
    setIsAuthModalOpen 
  } = useStore();

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
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.product.salePrice ?? item.product.price;
    return total + itemPrice * item.quantity;
  }, 0);

  const shipping = subtotal > 0 ? 0 : 0; // Free shipping
  const total = subtotal + shipping;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Panel */}
        <div className="w-screen max-w-md bg-[#FFF9F0] border-l border-gold/20 flex flex-col shadow-2xl animate-slide-in">
          {/* Header */}
          <div className="px-3 py-3.5 bg-[#FFFFFF] border-b border-cream flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-dark-brown flex items-center gap-1.5">
              <ShoppingBag size={18} className="text-maroon" />
              Your Bag ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-full text-dark-brown/60 hover:text-maroon hover:bg-cream/40 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-cream/50 flex items-center justify-center text-maroon text-2xl mb-4">
                  ✨
                </div>
                <h3 className="text-lg font-serif font-semibold text-dark-brown mb-2">
                  Your saree collection is waiting
                </h3>
                <p className="text-sm text-dark-brown/60 max-w-xs mb-6">
                  Explore our latest handpicked traditional sarees and find something beautiful for your next celebration.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-maroon text-ivory rounded font-medium hover:bg-maroon-dark hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-wide"
                >
                  EXPLORE SAREES
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                  const currentPrice = item.product.salePrice ?? item.product.price;
                  return (
                    <div 
                      key={item.product.id}
                      className="bg-white p-2 rounded-lg border border-cream flex gap-2.5 shadow-sm"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-14 aspect-[3/4] rounded overflow-hidden bg-cream/30 flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-serif font-bold text-dark-brown line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-dark-brown/40 hover:text-red-600 transition-colors ml-1.5 flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <p className="text-[10px] text-dark-brown/60 mt-0.5 line-clamp-1">
                            {item.product.fabric} &bull; {item.product.color}
                          </p>
                        </div>
 
                        <div className="flex justify-between items-end mt-1">
                          {/* Price & Savings */}
                          <div className="flex flex-col gap-0.5">
                            {(() => {
                              const salePrice = item.product.salePrice;
                              const originalPrice = item.product.price;
                              const hasDiscount = !!salePrice && salePrice < originalPrice;
                              const discountPercent = (hasDiscount && salePrice)
                                ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                                : 0;
                              const totalSaved = (hasDiscount && salePrice)
                                ? (originalPrice - salePrice) * item.quantity
                                : 0;
                              return (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-serif text-xs font-bold text-maroon">
                                      ₹{(currentPrice * item.quantity).toLocaleString('en-IN')}
                                    </span>
                                    {hasDiscount && (
                                      <span className="text-[9px] text-dark-brown/40 line-through">
                                        ₹{(originalPrice * item.quantity).toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                  {hasDiscount && (
                                    <span className="text-[8px] sm:text-[9px] text-green-700 font-semibold leading-none">
                                      {discountPercent}% OFF (Saved ₹{totalSaved.toLocaleString('en-IN')})
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
 
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-cream rounded bg-cream/20">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-0.5 text-dark-brown/60 hover:text-maroon hover:bg-cream/40 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="px-1.5 text-[10px] font-semibold text-dark-brown min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              className="p-0.5 text-dark-brown/60 hover:text-maroon hover:bg-cream/40 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="bg-[#FFFFFF] border-t border-cream px-3 py-4 sm:px-4">
              <div className="space-y-1.5 text-xs font-semibold text-dark-brown/70">
                <div className="flex justify-between text-xs text-dark-brown/70 font-medium">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-dark-brown/70 font-medium">
                  <span>Shipping</span>
                  <span className="text-green-700 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-serif font-bold text-dark-brown border-t border-cream pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-maroon">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (!user && !userPhone) {
                      setIsCartOpen(false);
                      setIsAuthModalOpen(true);
                    } else {
                      setIsCartOpen(false);
                      router.push('/checkout');
                    }
                  }}
                  className="w-full py-2.5 bg-maroon text-ivory text-center rounded font-semibold tracking-wide hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md text-xs uppercase"
                >
                  PROCEED TO CHECKOUT
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center text-[10px] text-dark-brown/65 hover:text-maroon font-medium transition-colors"
                >
                  Continue Shopping
                </button>
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
