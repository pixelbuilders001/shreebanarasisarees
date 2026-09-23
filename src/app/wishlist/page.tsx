"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ProductCard } from '../../components/ProductCard';
import { useStore } from '../../context/StoreContext';
import { Heart, ShoppingBag } from 'lucide-react';
import WishlistLoading from './loading';
import ContextualNotificationBanner from '../../components/notifications/ContextualNotificationBanner';
import AskFamilyModal from '../../components/family-shopping/AskFamilyModal';

function WishlistContent() {
  const { wishlist, showToast } = useStore();
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);

  const handleBannerClick = () => {
    if (wishlist.length < 2) {
      showToast('Please save at least 2 sarees to compare with family', 'info');
      return;
    }
    setIsFamilyModalOpen(true);
  };

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-grow">
        
        {/* Header */}
        <div className="border-b border-cream pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-xl sm:text-2xl font-extrabold text-dark-brown">
              Your Wishlist
            </h1>
            <span className="text-xs font-semibold text-dark-brown/40 font-sans">
              ({wishlist.length} {wishlist.length === 1 ? 'Saree' : 'Sarees'} saved)
            </span>
          </div>
          <nav className="text-xs text-dark-brown/50 font-medium flex items-center gap-1">
            <Link href="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            <span className="text-dark-brown">Wishlist</span>
          </nav>
        </div>

        {wishlist.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-lg shadow-sm px-4">
            <Heart size={44} className="text-maroon/20 mb-3 animate-pulse" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-sm text-dark-brown/60 max-w-sm mb-5 leading-relaxed">
              Save your favorite traditional sarees here to track their availability, custom options, or add them to cart later.
            </p>
            <Link
              href="/sarees"
              className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-105 active:scale-95 transition-all shadow"
            >
              EXPLORE COLLECTIONS
            </Link>
          </div>
        ) : (
          <>
            {/* Ask Family Banner */}
            <div 
              onClick={handleBannerClick}
              className="mb-4 cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-cream/80 bg-[#FCF5F3] shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBannerClick();
                }
              }}
              title="Click to ask family to vote on your sarees"
            >
              {/* Mobile Banner (2111x649 aspect ratio) */}
              <div className="block md:hidden relative w-full aspect-[2111/649]">
                <Image
                  src="/mobile_my_wishlist.webp"
                  alt="Ask Family to Vote"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover object-center group-hover:scale-[1.004] transition-transform duration-300"
                />
              </div>

              {/* Desktop Banner (2121x261 aspect ratio) */}
              <div className="hidden md:block relative w-full aspect-[2121/261]">
                <Image
                  src="/my_wishlist.webp"
                  alt="Ask Family to Vote"
                  fill
                  priority
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center group-hover:scale-[1.004] transition-transform duration-300"
                />
              </div>
            </div>

            <ContextualNotificationBanner variant="wishlist" />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {wishlist.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Family Shopping Modal */}
        <AskFamilyModal
          isOpen={isFamilyModalOpen}
          onClose={() => setIsFamilyModalOpen(false)}
          wishlistItems={wishlist}
        />

      </main>

      <Footer />
    </>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<WishlistLoading />}>
      <WishlistContent />
    </Suspense>
  );
}
