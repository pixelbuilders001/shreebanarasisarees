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
    <div className="group relative bg-[#FFFFFF] rounded-md shadow-sm border border-[#F7EEDF] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream/30">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Badges Column (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.newArrival && (
            <span className="bg-maroon text-ivory text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase shadow-sm">
              JUST IN
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-gold text-dark-brown text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {product.bestseller && (
            <span className="bg-dark-brown text-ivory text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase shadow-sm border border-gold/20">
              BESTSELLER
            </span>
          )}
        </div>

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={() => toggleWishlist(product)}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 shadow hover:bg-white text-dark-brown hover:scale-110 transition-all z-10"
          aria-label="Add to Wishlist"
        >
          <Heart
            size={18}
            className={`transition-colors duration-200 ${
              activeWishlist ? 'fill-maroon text-maroon' : 'text-dark-brown/70'
            }`}
          />
        </button>

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-dark-brown/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 hidden md:block" />

        {/* Desktop Add to Cart Hover Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 hidden md:block opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between border border-maroon rounded bg-white overflow-hidden shadow-md h-9">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCartQuantity(product.id, quantityInCart - 1);
                }}
                className="px-3 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-xs font-bold text-dark-brown min-w-[20px] text-center select-none font-sans">
                {quantityInCart} in Cart
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCartQuantity(product.id, quantityInCart + 1);
                }}
                disabled={product.stock > 0 && quantityInCart >= product.stock}
                className="px-3 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
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
              className={`w-full py-2.5 rounded bg-maroon text-ivory font-bold text-xs uppercase tracking-widest hover:bg-maroon-dark transition-all flex items-center justify-center gap-2 shadow-lg border border-gold/20 ${
                product.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
              aria-label="Add to Cart"
            >
              <ShoppingBag size={13} className="text-gold-light" />
              <span className="font-serif">Add to Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          {/* Category / Fabric Subtitle */}
          <span className="text-[10px] sm:text-[11px] font-sans font-bold text-gold uppercase tracking-wider block">
            {product.fabric} &bull; {product.color}
          </span>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block group-hover:text-maroon transition-colors">
            <h3 className="font-serif text-sm sm:text-base font-bold text-dark-brown line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Price and Cart Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-sm sm:text-base font-extrabold text-maroon">
                ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
              </span>
              {product.salePrice && (
                <span className="text-xs text-dark-brown/40 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Quick Add To Cart / Quantity Selector (Mobile Only) */}
            <div className="md:hidden">
              {quantityInCart > 0 ? (
                <div className="flex items-center border border-maroon rounded-full bg-white overflow-hidden shadow-sm h-8">
                  <button
                    onClick={() => updateCartQuantity(product.id, quantityInCart - 1)}
                    className="px-2.5 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-1 text-xs font-bold text-dark-brown min-w-[16px] text-center select-none">
                    {quantityInCart}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(product.id, quantityInCart + 1)}
                    disabled={product.stock > 0 && quantityInCart >= product.stock}
                    className="px-2.5 h-full text-xs font-bold text-maroon hover:bg-cream/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => product.stock > 0 && addToCart(product, 1)}
                  disabled={product.stock === 0}
                  className={`p-2 rounded-full bg-maroon text-ivory hover:bg-maroon-dark transition-all ${
                    product.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                  }`}
                  aria-label="Add to Cart"
                >
                  <ShoppingBag size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Handwoven / In Stock Indicator */}
          <div className="pt-1.5 flex items-center justify-between text-[11px]">
            {product.stock === 0 ? (
              <span className="text-red-600 font-semibold">Out of Stock</span>
            ) : (
              <span className="text-green-700 font-semibold flex items-center gap-1">
                • Handwoven
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
