"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { cart, wishlist, setIsCartOpen, user, userProfile, setIsAuthModalOpen } = useStore();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || userProfile?.avatar_url;

  // Hide mobile bottom nav on checkout, payment, or receipt pages to keep UI clean and distraction-free
  if (pathname.startsWith('/checkout') || pathname.startsWith('/payment') || pathname.startsWith('/receipt')) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#F3ECE0] shadow-[0_-4px_16px_rgba(41,37,36,0.06)] px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
            pathname === '/' ? 'text-[#6B1725] font-bold scale-105' : 'text-[#6B625D] hover:text-[#6B1725]'
          }`}
        >
          <Home size={20} className={pathname === '/' ? 'text-[#6B1725] stroke-[2.5]' : ''} />
          <span className="text-[10px] font-sans mt-1 tracking-tight">Home</span>
        </Link>

        {/* Shop / Sarees */}
        <Link
          href="/sarees"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
            pathname.startsWith('/sarees') ? 'text-[#6B1725] font-bold scale-105' : 'text-[#6B625D] hover:text-[#6B1725]'
          }`}
        >
          <Grid size={20} className={pathname.startsWith('/sarees') ? 'text-[#6B1725] stroke-[2.5]' : ''} />
          <span className="text-[10px] font-sans mt-1 tracking-tight">Shop</span>
        </Link>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all relative ${
            pathname === '/wishlist' ? 'text-[#6B1725] font-bold scale-105' : 'text-[#6B625D] hover:text-[#6B1725]'
          }`}
        >
          <div className="relative">
            <Heart size={20} className={pathname === '/wishlist' ? 'text-[#6B1725] fill-[#6B1725]' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#6B1725] text-[#FAF7F0] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FAF7F0]">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-sans mt-1 tracking-tight">Wishlist</span>
        </Link>

        {/* Account / Profile */}
        {user ? (
          <Link
            href="/account"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
              pathname.startsWith('/account') ? 'text-[#6B1725] font-bold scale-105' : 'text-[#6B625D] hover:text-[#6B1725]'
            }`}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Account"
                className={`w-5 h-5 rounded-full object-cover border ${
                  pathname.startsWith('/account') ? 'border-[#6B1725] ring-2 ring-[#6B1725]/30' : 'border-[#B08A3C]/40'
                }`}
              />
            ) : (
              <User size={20} className={pathname.startsWith('/account') ? 'text-[#6B1725] stroke-[2.5]' : ''} />
            )}
            <span className="text-[10px] font-sans mt-1 tracking-tight">Account</span>
          </Link>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[#6B625D] hover:text-[#6B1725] transition-all"
            aria-label="Login or Register"
          >
            <User size={20} />
            <span className="text-[10px] font-sans mt-1 tracking-tight">Account</span>
          </button>
        )}

        {/* Cart Page */}
        <Link
          href="/cart"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all relative ${
            pathname === '/cart' ? 'text-[#6B1725] font-bold scale-105' : 'text-[#6B625D] hover:text-[#6B1725]'
          }`}
        >
          <div className="relative">
            <ShoppingBag size={20} className={pathname === '/cart' ? 'text-[#6B1725] stroke-[2.5]' : ''} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#6B1725] text-[#FAF7F0] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FAF7F0]">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-sans mt-1 tracking-tight">Cart</span>
        </Link>
      </div>
    </nav>
  );
};
