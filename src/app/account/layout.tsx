"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Footer } from '../../components/Footer';
import { useStore } from '../../context/StoreContext';
import { User, ShoppingBag, MapPin, LogOut, Sparkles, ChevronLeft } from 'lucide-react';
import { 
  OrdersTabSkeleton, 
  AddressesTabSkeleton, 
  ProfileTabSkeleton, 
  CustomizationsTabSkeleton 
} from '../../components/TabSkeletons';
import AccountPwaStrip from '../../components/AccountPwaStrip';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    logoutUser,
    user,
    userProfile,
    isHydrated,
    loginWithGoogle,
    setIsAuthModalOpen,
    orders,
    shippingAddresses,
    customRequests
  } = useStore();

  const [authError, setAuthError] = useState('');

  const handleBack = () => {
    if (pathname !== '/account') {
      router.push('/account');
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Automatically trigger AuthModal if visiting account while unauthenticated
  React.useEffect(() => {
    if (isHydrated && !user) {
      setIsAuthModalOpen(true);
    }
  }, [isHydrated, user, setIsAuthModalOpen]);

  // If hydrated and not logged in, render the login panel
  if (isHydrated && !user) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F0] overflow-x-clip">
        {/* Dedicated Clean Header (Matching Cart & Checkout) */}
        <header className="bg-white border-b border-[#E5DEC9] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-1 rounded-full text-[#292524] hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                aria-label="Back to home"
              >
                <ChevronLeft size={22} />
              </Link>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524]">
                Account
              </h1>
            </div>
            <Link href="/" className="font-serif font-bold text-sm sm:text-base text-maroon hover:text-maroon-dark transition-colors">
              Shree Banarasi
            </Link>
          </div>
        </header>

        <main className="max-w-md w-full mx-auto px-4 py-16 sm:py-24 flex-grow flex items-center justify-center">
          <div className="bg-white border border-[#F3ECE0] p-6 sm:p-8 rounded-3xl shadow-[0_4px_24px_rgba(41,37,36,0.06)] space-y-6 w-full text-center relative overflow-hidden">
            {/* Subtle top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-maroon via-gold to-maroon" />

            <div>
              <div className="mx-auto w-14 h-14 bg-[#FFF9F0] border border-[#B08A3C]/30 flex items-center justify-center rounded-2xl text-maroon mb-3 shadow-inner">
                <User size={26} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-dark-brown">
                Customer Dashboard
              </h2>
              <p className="text-xs text-dark-brown/65 mt-1.5 font-sans leading-relaxed">
                Sign in with Google to view your orders, saved addresses, and profile details.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100 text-left">
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
              className="w-full py-3.5 px-4 border border-[#C9A45C]/40 hover:border-gold bg-white hover:bg-[#FFF9F0]/40 text-dark-brown rounded-xl font-serif font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer group"
            >
              <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            <p className="text-[11px] text-dark-brown/45 font-sans pt-1">
              Secure authentication powered by Google
            </p>
          </div>

          <div className="w-full pt-2 lg:hidden">
            <AccountPwaStrip />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Account menu items
  const menuItems = [
    { name: 'My Orders', path: '/account', icon: ShoppingBag, count: orders?.length },
    { name: 'My Addresses', path: '/account/addresses', icon: MapPin, count: shippingAddresses?.length },
    { name: 'My Profile', path: '/account/profile', icon: User },
    { name: 'Customizations', path: '/account/customizations', icon: Sparkles, count: customRequests?.length },
    { name: 'Logout', path: '#logout', icon: LogOut }
  ];

  const userDisplayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patron';
  const userAvatar = user?.user_metadata?.avatar_url || userProfile?.avatar_url;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F0] w-full max-w-full overflow-x-clip">
      {/* 1. TOP HEADER (Like Cart & Checkout - Replaces the heavy global header) */}
      <header className="bg-white border-b border-[#E5DEC9] py-3.5 px-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1 rounded-full text-[#292524] hover:text-[#6B1725] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} />
            </button>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#292524]">
              Account
            </h1>
          </div>

          {/* User profile image and small name on right side */}
          <Link
            href="/account/profile"
            prefetch={true}
            className="flex items-center gap-2 py-1 px-1.5 sm:px-2.5 rounded-full hover:bg-[#FAF7F0] transition-colors group cursor-pointer"
            title="My Profile"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userDisplayName}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#D4C39D] group-hover:border-[#6B1725] transition-colors flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFF9F0] border border-[#D4C39D] flex items-center justify-center text-[#6B1725] flex-shrink-0">
                <User size={15} />
              </div>
            )}
            <span className="font-sans font-medium text-xs sm:text-sm text-[#292524] group-hover:text-[#6B1725] transition-colors max-w-[100px] sm:max-w-[140px] truncate">
              {userDisplayName}
            </span>
          </Link>
        </div>
      </header>
      
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-grow min-w-0">

        {/* Mobile Sub-Navigation Pills (Smooth, strictly contained, no page overflow) */}
        <div className="lg:hidden mb-5 w-full max-w-full">
          <div className="bg-white border border-[#F3ECE0] p-1.5 rounded-2xl shadow-xs flex items-center gap-1.5 overflow-x-auto overscroll-x-contain no-scrollbar">
            {menuItems.filter(item => item.name !== 'Logout').map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={true}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-sans text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-maroon text-[#FAF7F0] border-maroon shadow-xs'
                      : 'bg-white text-dark-brown/80 border-transparent hover:bg-cream/30 hover:text-maroon'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#FAF7F0] flex-shrink-0' : 'text-maroon flex-shrink-0'} />
                  <span>{item.name}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#FAF7F0]/20 text-[#FAF7F0]' : 'bg-cream text-maroon'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Desktop Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
          {/* Desktop Navigation Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-3xl border border-[#F3ECE0] shadow-[0_2px_16px_rgba(41,37,36,0.03)] sticky top-[72px] z-20 space-y-1.5">
            <h2 className="font-serif text-[11px] font-bold text-dark-brown/45 uppercase tracking-widest px-3 mb-2">
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
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all text-rose-600 hover:bg-rose-50 cursor-pointer w-full text-left mt-3 border border-transparent hover:border-rose-100"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} className="text-rose-600 flex-shrink-0" />
                      Logout
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={true}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-maroon text-[#FAF7F0] border-maroon shadow-xs'
                      : 'bg-white text-dark-brown/75 border-transparent hover:bg-cream/25 hover:text-dark-brown'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon size={16} className={isActive ? 'text-[#FAF7F0] flex-shrink-0' : 'text-maroon flex-shrink-0'} />
                    <span className="truncate">{item.name}</span>
                  </span>

                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-[#FAF7F0]/20 text-[#FAF7F0]' : 'bg-cream text-maroon'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </aside>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-9 w-full min-w-0 overflow-x-clip">
            {!isHydrated ? (
              pathname === '/account/addresses' ? (
                <AddressesTabSkeleton />
              ) : pathname === '/account/profile' ? (
                <ProfileTabSkeleton />
              ) : pathname === '/account/customizations' ? (
                <CustomizationsTabSkeleton />
              ) : (
                <OrdersTabSkeleton />
              )
            ) : (
              <div>
                {children}
                <AccountPwaStrip className="mt-6" />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
