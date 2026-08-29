"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Eye, X, Star, Scissors, Bell } from 'lucide-react';
import { Product } from '../data/products';
import { useStore } from '../context/StoreContext';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholder';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, updateCartQuantity, toggleWishlist, isInWishlist, showToast } = useStore();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const activeWishlist = isInWishlist(product.id);
  const cartItem = cart.find(item => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Calculate discount percentage
  const discountPercent = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const handleNotifyMe = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showToast(`We'll notify you when "${product.name}" is back in stock!`, 'info');
  };

  return (
    <>
    <div className="group relative bg-[#FFF9F0]/65 border border-gold/15 hover:border-gold/45 rounded-xl hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between overflow-hidden">
      {/* Image Container with Luxury Full-bleed Top */}
      <div className={`relative w-full aspect-[3/4] overflow-hidden border-b border-gold/10 ${imageLoaded ? 'bg-cream/20' : 'bg-cream animate-pulse'}`}>
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <Image
            src={imageError || !product.images?.[0] ? NO_IMAGE_PLACEHOLDER : product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out ${product.stock === 0 ? 'grayscale opacity-60' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </Link>

        {/* Inner Accent Line */}
        <div className="absolute inset-0 border border-gold/5 pointer-events-none transition-all duration-500 group-hover:border-maroon/10" />
        
        {/* Rich Overlay */}
        <div className="absolute inset-0 bg-maroon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Quick View Button — always visible on mobile, slides up on desktop hover */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsQuickViewOpen(true);
          }}
          className="absolute bottom-0 inset-x-0 z-10 py-1.5 sm:py-2 bg-dark-brown/85 backdrop-blur-sm text-ivory text-[8.5px] sm:text-[10px] font-serif font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300"
          aria-label={`Quick view ${product.name}`}
        >
          <Eye size={12} />
          Quick View
        </button>

        {/* Badges Column (Top Left) */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 z-10">
          {product.stock === 0 && (
            <span className="bg-red-700 text-ivory text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm font-serif">
              SOLD OUT
            </span>
          )}
          {product.newArrival && (
            <span className="bg-maroon text-ivory text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm border border-gold/15 font-serif">
              JUST IN
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-gold text-dark-brown text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm font-serif">
              {discountPercent}% OFF
            </span>
          )}
          {product.bestseller && (
            <span className="bg-dark-brown text-ivory text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm border border-gold/20 font-serif">
              BESTSELLER
            </span>
          )}
        </div>

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={() => toggleWishlist(product)}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#FFF9F0]/80 backdrop-blur-sm border border-gold/20 shadow-sm hover:bg-[#FFF9F0] text-dark-brown hover:scale-110 transition-all z-10"
          aria-label="Add to Wishlist"
        >
          <Heart
            size={13}
            className={`transition-colors duration-200 ${
              activeWishlist ? 'fill-maroon text-maroon' : 'text-dark-brown/70'
            }`}
          />
        </button>
      </div>

      {/* Info Area */}
      <div className="p-1.5 sm:p-2 flex-grow flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Category / Fabric Subtitle */}
          <span className="text-[10px] sm:text-[11px] font-sans font-bold text-gold uppercase tracking-widest block">
            {product.fabric} &bull; {product.color}
          </span>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block group-hover:text-maroon transition-colors">
            <h3 className="font-serif text-xs sm:text-sm font-extrabold text-dark-brown line-clamp-1 leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 min-h-[16px]">
            {product.reviewsCount > 0 ? (
              <>
                <span className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < Math.round(product.rating) ? 'fill-gold text-gold' : 'text-dark-brown/15'}
                    />
                  ))}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-dark-brown/60">
                  {product.rating}
                  <span className="text-dark-brown/40"> ({product.reviewsCount})</span>
                </span>
              </>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-dark-brown/40 font-medium italic">
                No reviews yet
              </span>
            )}
          </div>

          {/* Price and Stock Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-sm sm:text-base font-extrabold text-maroon">
                ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
              </span>
              {product.salePrice && (
                <span className="text-[10px] sm:text-[11px] text-dark-brown/40 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {product.stock === 0 ? (
              <span className="text-red-600 text-[10px] sm:text-[11px] font-bold">Out of Stock</span>
            ) : product.stock <= 3 ? (
              <span className="text-amber-700 text-[10px] sm:text-[11px] font-semibold animate-pulse">
                Only {product.stock} Left!
              </span>
            ) : (
              <span className="text-green-700 text-[10px] sm:text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block"></span>
                In Stock
              </span>
            )}
          </div>

          {/* Blouse Piece Signal */}
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-dark-brown/55 font-medium">
            <Scissors size={11} className="text-gold flex-shrink-0" />
            <span className="truncate">Blouse piece included</span>
          </div>
        </div>

        {/* Add to Cart Button / Quantity Selector */}
        <div className="mt-2">
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between border border-maroon/30 rounded bg-white overflow-hidden shadow-sm h-7.5 sm:h-8">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCartQuantity(product.id, quantityInCart - 1);
                }}
                className="px-2.5 h-full text-xs font-bold text-maroon hover:bg-maroon/5 transition-colors flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-[10px] sm:text-xs font-bold text-dark-brown min-w-[15px] text-center select-none font-sans">
                {quantityInCart}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCartQuantity(product.id, quantityInCart + 1);
                }}
                disabled={product.stock > 0 && quantityInCart >= product.stock}
                className="px-2.5 h-full text-xs font-bold text-maroon hover:bg-maroon/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : product.stock === 0 ? (
            <button
              onClick={handleNotifyMe}
              className="w-full py-1.5 sm:py-2 rounded border border-maroon/30 bg-[#FFF9F0]/40 text-maroon font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
              aria-label={`Notify me when ${product.name} is back in stock`}
            >
              <Bell size={11} />
              <span className="font-serif">Notify Me</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="w-full py-1.5 sm:py-2 rounded border border-maroon/30 hover:border-maroon/80 bg-[#FFF9F0]/40 hover:bg-[#FFF9F0]/90 text-maroon font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] hover:scale-[1.01]"
              aria-label="Add to Cart"
            >
              <ShoppingBag size={11} className="transition-colors" />
              <span className="font-serif">Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>

    {isQuickViewOpen && (
      <QuickViewModal product={product} onClose={() => setIsQuickViewOpen(false)} />
    )}
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   QuickViewModal — inspect a saree without leaving the current page
   ────────────────────────────────────────────────────────────────────────── */

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Lock body scroll while the modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  const currentPrice = product.salePrice ?? product.price;
  const activeWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (product.stock > 0) {
      addToCart(product, qty);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D211D]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FFF9F0] rounded-2xl border border-gold/25 shadow-2xl pointer-events-auto animate-scale-up">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-[#FFF9F0]/90 backdrop-blur-sm text-dark-brown/70 hover:text-maroon border border-gold/20 shadow-sm transition-colors"
            aria-label="Close quick view"
          >
            <X size={16} />
          </button>

          <div className="grid sm:grid-cols-2">
            {/* Product Images */}
            <div className={`relative aspect-[3/4] sm:aspect-auto sm:min-h-[440px] ${imageLoaded ? 'bg-cream/20' : 'bg-cream animate-pulse'}`}>
              <img
                src={imageError || !product.images?.[imgIndex] ? NO_IMAGE_PLACEHOLDER : (product.images[imgIndex] || product.images[0])}
                alt={product.name}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
              />
              {product.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-gold' : 'bg-ivory/60'}`}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-5 sm:p-6 flex flex-col">
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
                {product.fabric} &bull; {product.color}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-dark-brown mt-1 leading-tight">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-2">
                {product.reviewsCount > 0 ? (
                  <>
                    <span className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < Math.round(product.rating) ? 'fill-gold text-gold' : 'text-dark-brown/20'}
                        />
                      ))}
                    </span>
                    <span className="text-[10px] text-dark-brown/50 font-medium">
                      {product.rating} ({product.reviewsCount} {product.reviewsCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-dark-brown/40 font-medium italic">
                    No reviews yet
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-serif text-xl sm:text-2xl font-extrabold text-maroon">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {product.salePrice && (
                  <span className="text-sm text-dark-brown/40 line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[11px] font-bold text-green-700">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold">
                {product.stock === 0 ? (
                  <span className="text-red-600">Out of Stock</span>
                ) : product.stock <= 3 ? (
                  <span className="text-amber-700 animate-pulse">Only {product.stock} left!</span>
                ) : (
                  <span className="text-green-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
                    In Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-dark-brown/70 leading-relaxed mt-3 line-clamp-3">
                {product.description}
              </p>

              {/* Specs */}
              <div className="mt-4 space-y-1.5 text-[11px] text-dark-brown/65">
                <p><span className="font-bold text-dark-brown">Length:</span> {product.length}</p>
                <p><span className="font-bold text-dark-brown">Blouse Piece:</span> {product.blousePiece}</p>
                <p><span className="font-bold text-dark-brown">Work:</span> {product.work}</p>
                <p><span className="font-bold text-dark-brown">Care:</span> {product.care}</p>
              </div>

              {/* Quantity + Add to Cart */}
              <div className="mt-5 flex items-center gap-2">
                <div className="flex items-center border border-maroon/30 rounded-lg overflow-hidden bg-white h-10 flex-shrink-0">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="px-3 h-full text-maroon font-bold hover:bg-maroon/5 disabled:opacity-40 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-dark-brown select-none">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={product.stock > 0 && qty >= product.stock}
                    className="px-3 h-full text-maroon font-bold hover:bg-maroon/5 disabled:opacity-40 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 py-2.5 bg-maroon text-ivory rounded-lg font-serif font-bold text-[11px] uppercase tracking-wider hover:bg-maroon-dark transition-all shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} />
                  Add to Cart
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className="p-2.5 rounded-lg border border-gold/30 text-dark-brown hover:text-maroon hover:border-maroon/50 transition-colors flex-shrink-0"
                  aria-label="Toggle wishlist"
                >
                  <Heart size={16} className={activeWishlist ? 'fill-maroon text-maroon' : ''} />
                </button>
              </div>

              <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="mt-4 text-center block py-2.5 rounded-lg border border-dark-brown/15 text-dark-brown font-serif font-bold text-xs uppercase tracking-wider hover:border-maroon hover:text-maroon transition-colors"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
