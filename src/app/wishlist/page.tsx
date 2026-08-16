"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ProductCard } from '../../components/ProductCard';
import { useStore } from '../../context/StoreContext';
import { Heart, ShoppingBag } from 'lucide-react';

function WishlistContent() {
  const { wishlist } = useStore();

  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        
        {/* Header */}
        <div className="border-b border-cream pb-6 mb-6">
          <nav className="text-xs text-dark-brown/50 font-medium mb-2 flex items-center gap-1">
            <Link href="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            <span className="text-dark-brown">Wishlist</span>
          </nav>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-dark-brown flex items-baseline gap-2">
            Your Wishlist
            <span className="text-xs font-semibold text-dark-brown/40 font-sans">
              ({wishlist.length} {wishlist.length === 1 ? 'Saree' : 'Sarees'} saved)
            </span>
          </h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-lg shadow-sm px-4">
            <Heart size={48} className="text-maroon/20 mb-4 animate-pulse" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-sm text-dark-brown/60 max-w-sm mb-6 leading-relaxed">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </main>

      <Footer />
    </>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center font-serif text-maroon text-xl animate-pulse">Loading Wishlist...</div>}>
      <WishlistContent />
    </Suspense>
  );
}
