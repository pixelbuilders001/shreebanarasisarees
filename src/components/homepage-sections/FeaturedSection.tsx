"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Heart } from 'lucide-react';
import { HomepageSection } from '../../types/homepage-sections';
import { Product } from '../../data/products';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholder';
import { useStore } from '../../context/StoreContext';
import { triggerHaptic } from '../../utils/haptics';
import { checkIsExpress, openPincodeSheet, sanitizePincode } from '../DeliveryPincodeBar';

interface FeaturedSectionProps {
  section: HomepageSection;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ section }) => {
  const products = section.products || [];

  if (products.length === 0) {
    return null;
  }

  const featuredProduct = products[0];
  const secondaryProducts = products.slice(1, 4); // Handles 1, 2, or 3 secondary products (up to 4 total)

  return (
    <section className="py-6 sm:py-8 md:py-10 px-4 md:px-8 bg-[#FFFDF9] border-b border-[#B08A3C]/15">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0 pr-2">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#292524] tracking-wide leading-tight">
              {section.title}
            </h2>
            {section.subtitle && section.subtitle.trim().length > 0 && (
              <p className="text-xs sm:text-sm md:text-base text-[#6B625D] font-light mt-0.5 sm:mt-1 leading-relaxed">
                {section.subtitle}
              </p>
            )}
          </div>

          {section.view_all_url && (
            <Link
              href={section.view_all_url}
              className="text-xs sm:text-sm font-serif font-bold text-[#6B1725] hover:text-[#52111C] flex items-center gap-1 group transition-colors shrink-0 py-1"
            >
              <span className="hidden sm:inline">{section.view_all_text?.trim() || 'View All'}</span>
              <span className="sm:hidden">
                {section.view_all_text?.trim() && section.view_all_text.trim().length <= 12
                  ? section.view_all_text.trim()
                  : 'View All'}
              </span>
              <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Editorial Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start">
          {/* Main Featured Product (Occupies ~55-58% width on desktop) */}
          <div
            className={`w-full ${
              secondaryProducts.length > 0
                ? 'lg:col-span-7'
                : 'lg:col-span-12 max-w-2xl mx-auto'
            }`}
          >
            <MainFeaturedCard product={featuredProduct} />
          </div>

          {/* Secondary Products (Occupies ~42-45% width on desktop, stacked with appropriate spacing) */}
          {secondaryProducts.length > 0 && (
            <div className="w-full lg:col-span-5 flex flex-col gap-2.5 sm:gap-3">
              {secondaryProducts.map((prod) => (
                <SecondaryProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Main Featured Product Card
   ────────────────────────────────────────────────────────────────────────── */
interface MainFeaturedCardProps {
  product: Product;
}

const MainFeaturedCard: React.FC<MainFeaturedCardProps> = ({ product }) => {
  const { toggleWishlist, isInWishlist, currentPincode, defaultDeliveryPincode, isHydrated } = useStore();
  const [imageError, setImageError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const activeWishlist = isInWishlist(product.id);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activePin = sanitizePincode(currentPincode) || sanitizePincode(defaultDeliveryPincode) || '';
  const isExpressDelivery = isClient && isHydrated && Boolean(activePin) && checkIsExpress(activePin);

  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const imageUrl = imageError || !product.images?.[0] ? NO_IMAGE_PLACEHOLDER : product.images[0];

  return (
    <div className="group flex flex-col max-w-[480px] lg:max-w-none">
      {/* Large Featured Image (True portrait 4:5 ratio, object-top ensures model head & saree are full and not cut) */}
      <div className="relative w-full aspect-[4/5] max-h-[560px] lg:max-h-[600px] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E9DED1] bg-[#FAF7F0] shadow-sm">
        <Link
          href={`/product/${product.slug}`}
          className="block w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6B1725]/50 rounded-2xl sm:rounded-3xl"
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 680px"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImageError(true)}
          />
        </Link>

        {/* 20-Min Express Delivery Badge (Shown ONLY when user is under express delivery pincode) */}
        {isExpressDelivery && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerHaptic('light');
              openPincodeSheet(activePin);
            }}
            className="absolute bottom-3.5 left-3.5 sm:bottom-auto sm:top-4 sm:left-4 z-10 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-emerald-300 shadow-md text-emerald-950 hover:bg-emerald-50/90 transition-all cursor-pointer select-none group/badge"
            aria-label="20 Min Delivery Available. Click to check delivery details."
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <img
                src="/expressdel.webp"
                alt="Express Delivery"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain animate-rider filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.25)] group-hover/badge:scale-110 transition-transform"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-bold font-sans tracking-wide text-emerald-900 whitespace-nowrap">
              20 Min Delivery Available
            </span>
            <span className="relative flex h-1.5 w-1.5 shrink-0 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
            </span>
          </button>
        )}

        {/* Subtle Luxury Border Overlay */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-[#B08A3C]/10 pointer-events-none" />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerHaptic('light');
            toggleWishlist(product);
          }}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md z-10 flex items-center justify-center border border-[#E9DED1] hover:border-[#B08A3C]/50 transition-all select-none cursor-pointer active:scale-95"
          aria-label="Add to Wishlist"
        >
          <Heart
            size={17}
            className={`transition-colors duration-200 ${
              activeWishlist ? 'fill-[#6B1725] text-[#6B1725]' : 'text-[#292524]'
            }`}
          />
        </button>
      </div>

      {/* Main Featured Product Content */}
      <div className="pt-3.5 sm:pt-4 space-y-1.5 sm:space-y-2">
        {/* Fabric / Category Tag */}
        {(product.fabric || product.category) && (
          <span className="text-[10px] sm:text-xs font-sans font-bold text-[#B08A3C] uppercase tracking-[0.16em] block">
            {product.fabric ? product.fabric.toUpperCase() : product.category?.toUpperCase()}
          </span>
        )}

        {/* Product Name */}
        <Link
          href={`/product/${product.slug}`}
          className="block group/title focus:outline-none"
        >
          <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#292524] group-hover/title:text-[#6B1725] transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Rating Display */}
        {product.reviewsCount > 0 ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    i < Math.round(product.rating)
                      ? 'fill-[#B08A3C] text-[#B08A3C]'
                      : 'text-[#E9DED1]'
                  }
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#6B625D]">
              {product.rating}{' '}
              <span className="text-[#6B625D]/60 font-normal">({product.reviewsCount})</span>
            </span>
          </div>
        ) : null}

        {/* Price & Shop Now Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-2 sm:pt-3">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className="font-sans text-xl sm:text-2xl md:text-3xl font-bold text-[#292524]">
              ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
            </span>

            {product.salePrice && (
              <>
                <span className="text-sm sm:text-base text-[#7A6E65] line-through font-normal">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-[#6B1725] bg-[#6B1725]/10 px-2.5 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full bg-[#6B1725] hover:bg-[#52111C] text-[#FFFDF9] font-serif font-bold text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(107,23,37,0.18)] hover:shadow-lg transition-all group/btn"
          >
            <span>Shop Now</span>
            <ArrowRight
              size={13}
              className="transform group-hover/btn:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Secondary Product Card (Stacked vertically beside main product)
   ────────────────────────────────────────────────────────────────────────── */
interface SecondaryProductCardProps {
  product: Product;
}

const SecondaryProductCard: React.FC<SecondaryProductCardProps> = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useStore();
  const [imageError, setImageError] = useState(false);
  const activeWishlist = isInWishlist(product.id);

  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const imageUrl = imageError || !product.images?.[0] ? NO_IMAGE_PLACEHOLDER : product.images[0];

  return (
    <div className="group relative flex flex-row gap-3 sm:gap-3.5 bg-[#FFFDF9] border border-[#E9DED1] hover:border-[#B08A3C]/40 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 transition-all duration-300 shadow-[0_2px_8px_rgba(73,42,27,0.03)] hover:shadow-md items-center">
      {/* Product Image Thumbnail */}
      <Link
        href={`/product/${product.slug}`}
        className="relative w-20 sm:w-24 md:w-26 aspect-[3/4] shrink-0 overflow-hidden rounded-lg sm:rounded-xl border border-[#E9DED1]/70 bg-[#FAF7F0]"
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 90px, 110px"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </Link>

      {/* Product Information */}
      <div className="flex flex-col justify-between flex-grow min-w-0 pr-1 space-y-1">
        <div className="space-y-0.5">
          {/* Fabric / Category Tag */}
          {(product.fabric || product.category) && (
            <span className="text-[9px] sm:text-[10px] font-sans font-bold text-[#B08A3C] uppercase tracking-[0.14em] block truncate">
              {product.fabric ? product.fabric.toUpperCase() : product.category?.toUpperCase()}
            </span>
          )}

          {/* Product Name */}
          <Link href={`/product/${product.slug}`} className="block group/link">
            <h4 className="font-serif text-xs sm:text-sm font-bold text-[#292524] group-hover/link:text-[#6B1725] transition-colors line-clamp-1 sm:line-clamp-2 leading-snug">
              {product.name}
            </h4>
          </Link>

          {/* Rating */}
          {product.reviewsCount > 0 ? (
            <div className="flex items-center gap-1 pt-0.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={
                      i < Math.round(product.rating)
                        ? 'fill-[#B08A3C] text-[#B08A3C]'
                        : 'text-[#E9DED1]'
                    }
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-[#6B625D]">
                {product.rating}
              </span>
            </div>
          ) : null}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E9DED1]/60">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-sans text-sm sm:text-base font-bold text-[#292524]">
              ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
            </span>

            {product.salePrice && (
              <>
                <span className="text-[11px] sm:text-xs text-[#7A6E65] line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-[#6B1725]">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerHaptic('light');
                toggleWishlist(product);
              }}
              className="p-1.5 rounded-full hover:bg-[#FAF7F0] text-[#292524] transition-colors cursor-pointer"
              aria-label="Add to Wishlist"
            >
              <Heart
                size={14}
                className={activeWishlist ? 'fill-[#6B1725] text-[#6B1725]' : 'text-[#292524]/60'}
              />
            </button>

            {/* View Details Link */}
            <Link
              href={`/product/${product.slug}`}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-serif font-bold text-[#6B1725] hover:text-[#52111C] transition-colors"
            >
              <span>Explore</span>
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
