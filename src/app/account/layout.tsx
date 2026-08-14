"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useStore } from '../../context/StoreContext';
import { User, ShoppingBag, MapPin, LogOut, Heart, Sparkles } from 'lucide-react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { 
    logoutUser,
    user,
    userProfile,
    isHydrated,
    loginWithGoogle,
    orders,
    wishlist,
    shippingAddresses
  } = useStore();

  const [authError, setAuthError] = useState('');

  if (!isHydrated) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-32 flex items-center justify-center flex-grow">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin"></span>
            <p className="font-serif text-maroon text-sm font-bold tracking-wide animate-pulse">Loading Account...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // If not logged in, render the login panel
  if (!user) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 flex-grow">
          <div className="bg-white border border-cream p-8 rounded-2xl shadow-md space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-cream flex items-center justify-center rounded-full text-maroon mb-3 shadow-inner">
                <User size={22} />
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-dark-brown">
                Customer Dashboard
              </h2>
              <p className="text-xs text-dark-brown/65 mt-1">
                Sign in with Google to view orders, profile, and saved addresses.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
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
              className="w-full py-3 px-4 border border-[#C9A45C]/30 hover:border-gold/50 bg-white text-dark-brown rounded-xl font-serif font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Updated account menu
  const menuItems = [
    { name: 'My Orders', path: '/account', icon: ShoppingBag },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'My Addresses', path: '/account/addresses', icon: MapPin },
    { name: 'My Profile', path: '/account/profile', icon: User },
    { name: 'My Customizations', path: '/account/customizations', icon: Sparkles },
    { name: 'Logout', path: '#logout', icon: LogOut }
  ];

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Profile Header */}
        <div className="border-b border-cream pb-4 mb-6">
          <nav className="text-xs text-dark-brown/50 font-medium mb-1.5 flex items-center gap-1">
            <Link href="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            <span className="text-dark-brown">Account</span>
          </nav>
          <h1 className="font-serif text-xl sm:text-2xl font-extrabold text-dark-brown leading-tight">
            Namaste, {userProfile?.full_name || user?.user_metadata?.full_name || user?.email}
          </h1>
          {/* Quick Summary Counts Section */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-dark-brown/65 mt-1.5 font-semibold">
            <Link href="/account" className="hover:text-maroon transition-colors">
              {orders?.length || 0} {orders?.length === 1 ? 'Order' : 'Orders'}
            </Link>
            <span className="text-gold/40 select-none">•</span>
            <Link href="/wishlist" className="hover:text-maroon transition-colors">
              {wishlist?.length || 0} in Wishlist
            </Link>
            <span className="text-gold/40 select-none">•</span>
            <Link href="/account/addresses" className="hover:text-maroon transition-colors">
              {shippingAddresses?.length || 0} Saved {shippingAddresses?.length === 1 ? 'Address' : 'Addresses'}
            </Link>
          </div>
        </div>

        <style>{`
          .scrollbar-none::-webkit-scrollbar { display: none; }
          .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Navigation Sidebar/Tabbar */}
          <aside className="lg:col-span-3 bg-white p-3 lg:p-4 rounded-2xl border border-cream shadow-sm flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-1.5 scrollbar-none sticky top-[80px] z-30 w-full">
            <h2 className="hidden lg:block font-serif text-[10px] font-bold text-dark-brown/50 uppercase tracking-widest px-3 mb-2">
              Account Menu
            </h2>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const isLogout = item.name === 'Logout';

              if (isLogout) {
                return (
                  <button
                    key={item.name}
                    onClick={() => logoutUser()}
                    className="flex items-center gap-2 lg:gap-3 px-4 lg:px-3 py-2.5 rounded-xl font-serif font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap shadow-sm border bg-white text-red-600 border-red-100 hover:bg-red-50 cursor-pointer text-left w-full"
                  >
                    <Icon size={14} className="text-red-600 flex-shrink-0" />
                    Logout
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 lg:gap-3 px-4 lg:px-3 py-2.5 rounded-xl font-serif font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap shadow-sm border ${
                    isActive
                      ? 'bg-maroon text-ivory border-maroon'
                      : 'bg-white text-dark-brown/80 border-cream/80 hover:bg-cream/20'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-ivory flex-shrink-0' : 'text-maroon flex-shrink-0'} />
                  {item.name}
                </Link>
              );
            })}
          </aside>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-9 w-full">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
