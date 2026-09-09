"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SearchViewModal } from './SearchViewModal';
import { triggerHaptic } from '../utils/haptics';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { cart, user, userProfile, setIsAuthModalOpen } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || userProfile?.avatar_url;

  // Native App Architecture: Hide bottom navigation on PDP (/product), Cart (/cart), Checkout, Payment, and Receipt
  // to prevent double-stacked bars and provide full-bleed dedicated primary action bars.
  if (
    pathname.startsWith('/product') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/receipt')
  ) {
    return null;
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/94 backdrop-blur-xl border-t border-[#E9DED1] shadow-[0_-8px_28px_rgba(41,37,36,0.09)] px-2 py-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))] no-select">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Home */}
          <Link
            href="/"
            onClick={() => triggerHaptic('selection')}
            className={`native-press relative flex min-w-13 flex-col items-center justify-center py-1.5 px-3 rounded-xl select-none ${
              pathname === '/' ? 'text-[#6B1725] font-bold' : 'text-[#6B625D] hover:text-[#6B1725]'
            }`}
          >
            <Home size={20} className={pathname === '/' ? 'text-[#6B1725] stroke-[2.5]' : ''} />
            <span className="text-[10px] font-sans mt-0.5 tracking-tight">Home</span>
            {pathname === '/' && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#B08A3C]" />}
          </Link>

          {/* Shop / Sarees */}
          <Link
            href="/sarees"
            onClick={() => triggerHaptic('selection')}
            className={`native-press relative flex min-w-13 flex-col items-center justify-center py-1.5 px-3 rounded-xl select-none ${
              pathname.startsWith('/sarees') ? 'text-[#6B1725] font-bold' : 'text-[#6B625D] hover:text-[#6B1725]'
            }`}
          >
            <Grid size={20} className={pathname.startsWith('/sarees') ? 'text-[#6B1725] stroke-[2.5]' : ''} />
            <span className="text-[10px] font-sans mt-0.5 tracking-tight">Sarees</span>
            {pathname.startsWith('/sarees') && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#B08A3C]" />}
          </Link>

          {/* Search (Replaces Wishlist) */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setIsSearchOpen(true);
            }}
            className={`native-press relative flex min-w-13 flex-col items-center justify-center py-1.5 px-3 rounded-xl select-none cursor-pointer ${
              isSearchOpen ? 'text-[#6B1725] font-bold' : 'text-[#6B625D] hover:text-[#6B1725]'
            }`}
            aria-label="Search sarees"
          >
            <Search size={20} className={isSearchOpen ? 'text-[#6B1725] stroke-[2.5]' : ''} />
            <span className="text-[10px] font-sans mt-0.5 tracking-tight">Search</span>
            {isSearchOpen && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#B08A3C]" />}
          </button>

          {/* Cart Page */}
          <Link
            href="/cart"
            onClick={() => triggerHaptic('selection')}
            className={`native-press relative flex min-w-13 flex-col items-center justify-center py-1.5 px-3 rounded-xl select-none ${
              pathname === '/cart' ? 'text-[#6B1725] font-bold' : 'text-[#6B625D] hover:text-[#6B1725]'
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
            <span className="text-[10px] font-sans mt-0.5 tracking-tight">Cart</span>
            {pathname === '/cart' && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#B08A3C]" />}
          </Link>

          {/* Account / Profile */}
          {user ? (
            <Link
              href="/account"
              onClick={() => triggerHaptic('selection')}
              className={`native-press relative flex min-w-13 flex-col items-center justify-center py-1.5 px-3 rounded-xl select-none ${
                pathname.startsWith('/account') ? 'text-[#6B1725] font-bold' : 'text-[#6B625D] hover:text-[#6B1725]'
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
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">Account</span>
              {pathname.startsWith('/account') && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#B08A3C]" />}
            </Link>
          ) : (
            <button
              onClick={() => {
                triggerHaptic('selection');
                setIsAuthModalOpen(true);
              }}
              className="native-press flex min-w-13 flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[#6B625D] hover:text-[#6B1725] select-none cursor-pointer"
              aria-label="Login or Register"
            >
              <User size={20} />
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">Account</span>
            </button>
          )}
        </div>
      </nav>

      {/* Full screen Search modal triggered from bottom navigation */}
      <SearchViewModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
