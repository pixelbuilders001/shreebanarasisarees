"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../data/products';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, updateCartQuantity, toggleWishlist, isInWishlist } = useStore();
  const activeWishlist = isInWishlist(product.id);
  const cartItem = cart.find(item => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Calculate discount percentage
  const discountPercent = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="group relative bg-[#FFF9F0]/65 border border-gold/15 hover:border-gold/45 rounded-xl p-2 sm:p-2.5 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between">
      {/* Image Container with Luxury Double Gold Frame */}
      <div className="relative w-full aspect-[3/4] rounded-lg p-[1.5px] bg-gradient-to-b from-gold/30 to-gold/10 group-hover:from-maroon/40 group-hover:to-maroon/10 transition-all duration-500 flex items-center justify-center overflow-hidden shadow-sm mb-2">
        <div className="w-full h-full rounded-[8px] p-[1.5px] bg-[#FFF9F0] flex items-center justify-center overflow-hidden">
          <div className="w-full h-full rounded-md overflow-hidden relative border border-gold/5">
            <Link href={`/product/${product.slug}`} className="block w-full h-full">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </Link>

            {/* Inner Accent Line */}
            <div className="absolute inset-1 border border-gold/15 pointer-events-none rounded-[4px] transition-all duration-500 group-hover:border-maroon/20" />
            
            {/* Rich Overlay */}
            <div className="absolute inset-0 bg-maroon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Badges Column (Top Left) */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 z-10">
              {product.newArrival && (
                <span className="bg-maroon text-ivory text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm border border-gold/15 font-serif">
                  JUST IN
                </span>
              )}
              {discountPercent > 0 && (
                <span className="bg-gold text-dark-brown text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm font-serif">
                  {discountPercent}% OFF
                </span>
              )}
              {product.bestseller && (
                <span className="bg-dark-brown text-ivory text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-sm border border-gold/20 font-serif">
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

            {/* Desktop Add to Cart Hover Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 z-20 hidden md:block opacity-0 translate-y-3 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              {quantityInCart > 0 ? (
                <div className="flex items-center justify-between border border-maroon rounded bg-[#FFF9F0] overflow-hidden shadow-md h-7.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCartQuantity(product.id, quantityInCart - 1);
                    }}
                    className="px-2 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-bold text-dark-brown min-w-[15px] text-center select-none font-sans">
                    {quantityInCart}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCartQuantity(product.id, quantityInCart + 1);
                    }}
                    disabled={product.stock > 0 && quantityInCart >= product.stock}
                    className="px-2 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.stock > 0) addToCart(product, 1);
                  }}
                  disabled={product.stock === 0}
                  className={`w-full py-1.5 rounded bg-maroon text-ivory font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hover:bg-maroon-dark transition-all flex items-center justify-center gap-1 shadow-lg border border-gold/20 ${
                    product.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  aria-label="Add to Cart"
                >
                  <ShoppingBag size={11} className="text-gold-light" />
                  <span className="font-serif">Add to Cart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="px-0.5 flex-grow flex flex-col justify-between">
        <div className="space-y-0.5">
          {/* Category / Fabric Subtitle */}
          <span className="text-[7.5px] sm:text-[8.5px] font-sans font-bold text-gold uppercase tracking-widest block">
            {product.fabric} &bull; {product.color}
          </span>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block group-hover:text-maroon transition-colors">
            <h3 className="font-serif text-[11px] sm:text-xs font-extrabold text-dark-brown line-clamp-1 leading-tight">
              {product.name}
            </h3>
          </Link>

          {/* Price and Cart Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-xs sm:text-sm font-extrabold text-maroon">
                ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
              </span>
              {product.salePrice && (
                <span className="text-[9px] sm:text-[10px] text-dark-brown/40 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Quick Add To Cart / Quantity Selector (Mobile Only) */}
            <div className="md:hidden">
              {quantityInCart > 0 ? (
                <div className="flex items-center border border-maroon rounded-full bg-white overflow-hidden shadow-sm h-7">
                  <button
                    onClick={() => updateCartQuantity(product.id, quantityInCart - 1)}
                    className="px-2 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-1 text-[10px] font-bold text-dark-brown min-w-[12px] text-center select-none">
                    {quantityInCart}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(product.id, quantityInCart + 1)}
                    disabled={product.stock > 0 && quantityInCart >= product.stock}
                    className="px-2 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => product.stock > 0 && addToCart(product, 1)}
                  disabled={product.stock === 0}
                  className={`py-1 px-2 rounded-full bg-maroon text-ivory hover:bg-maroon-dark transition-all border border-gold/15 flex items-center gap-1 shadow-sm ${
                    product.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                  }`}
                  aria-label="Add to Cart"
                >
                  <ShoppingBag size={10} className="text-ivory" />
                  <span className="font-serif text-[8.5px] sm:text-[9.5px] font-bold tracking-wider whitespace-nowrap">
                    <span className="sm:hidden">+ Add</span>
                    <span className="hidden sm:inline">+ Add to Bag</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Handwoven / In Stock Indicator */}
          <div className="pt-0.5 flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-dark-brown/55 font-light">
            {product.stock === 0 ? (
              <span className="text-red-600 font-semibold">Out of Stock</span>
            ) : (
              <span className="text-green-700 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block"></span>
                Handwoven
              </span>
            )}
            {product.stock > 0 && product.stock <= 3 && (
              <span className="text-amber-700 font-medium">Only {product.stock} left!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
