"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { HomepageSection } from '../../types/homepage-sections';
import { Product } from '../../data/products';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholder';

interface PinterestTileProps {
  product: Product;
  variant: 'tall' | 'landscape';
  isArch?: boolean;
  priority?: boolean;
  className?: string;
  imagePosition?: string;
}

export const PinterestTile: React.FC<PinterestTileProps> = ({
  product,
  variant,
  isArch = false,
  priority = false,
  className = "",
  imagePosition,
}) => {
  const initialImage = product.images?.[0] || NO_IMAGE_PLACEHOLDER;
  const [imageSrc, setImageSrc] = useState<string>(initialImage);

  // If this tile is the royal Jharokha arch design (Left and Right tall tiles)
  if (isArch) {
    const clipId = `jharokha-arch-${product.id}`;

    return (
      <Link
        href={`/product/${product.slug}`}
        className={`group relative block w-full h-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B870] ${className}`}
        aria-label={`View saree ${product.name}`}
      >
        {/* SVG ClipPath Definition (Clean, graceful royal arch with ample headroom) */}
        <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d="M 0.5 0.015 C 0.47 0.035, 0.36 0.06, 0.26 0.095 C 0.20 0.115, 0.16 0.14, 0.15 0.165 C 0.14 0.19, 0.09 0.205, 0.045 0.225 C 0.032 0.238, 0.025 0.255, 0.025 0.27 L 0.025 0.95 C 0.025 0.98, 0.05 1.0, 0.085 1.0 L 0.915 1.0 C 0.95 1.0, 0.975 0.98, 0.975 0.95 L 0.975 0.27 C 0.975 0.255, 0.968 0.238, 0.955 0.225 C 0.91 0.205, 0.86 0.19, 0.85 0.165 C 0.84 0.14, 0.80 0.115, 0.74 0.095 C 0.64 0.06, 0.53 0.035, 0.5 0.015 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* Clipped Model Image Container with Protected Headroom */}
        <div
          className="relative w-full h-full overflow-hidden bg-[#1F0726]"
          style={{
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        >
          {/* Headroom adjustment: shifted slightly downward so the full head, bun, and bindi are framed inside the dome */}
          <div className="relative w-full h-full pt-1.5 sm:pt-2.5">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 420px"
              className={`object-cover w-full h-full object-[center_top] translate-y-1.5 sm:translate-y-2 scale-[1.02] transition-transform duration-700 ease-out md:group-hover:scale-[1.04] ${
                imagePosition || ''
              }`}
              loading={priority ? undefined : "lazy"}
              priority={priority}
              onError={() => setImageSrc(NO_IMAGE_PLACEHOLDER)}
            />
          </div>
        </div>

        {/* Royal Gold Jharokha Arch Frame Overlay */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(212,184,112,0.4)]"
          aria-hidden="true"
        >
          {/* Outer Gold Arch Border */}
          <path
            d="M 50 1.5 C 47 3.5, 36 6, 26 9.5 C 20 11.5, 16 14, 15 16.5 C 14 19, 9 20.5, 4.5 22.5 C 3.2 23.8, 2.5 25.5, 2.5 27 L 2.5 95 C 2.5 98, 5 100, 8.5 100 L 91.5 100 C 95 100, 97.5 98, 97.5 95 L 97.5 27 C 97.5 25.5, 96.8 23.8, 95.5 22.5 C 91 20.5, 86 19, 85 16.5 C 84 14, 80 11.5, 74 9.5 C 64 6, 53 3.5, 50 1.5 Z"
            fill="none"
            stroke="#D4B870"
            strokeWidth="1.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Inner Delicate Gold Accent Line */}
          <path
            d="M 50 3.8 C 47.5 5.5, 37.5 7.8, 28 11.2 C 22.5 13, 19 15.2, 18 17.5 C 17 19.8, 12 21.5, 7.5 23.5 C 6.2 24.8, 5.5 26, 5.5 27.5 L 5.5 93 C 5.5 95.8, 7.5 97.5, 11 97.5 L 89 97.5 C 92.5 97.5, 94.5 95.8, 94.5 93 L 94.5 27.5 C 94.5 26, 93.8 24.8, 92.5 23.5 C 88 21.5, 83 19.8, 82 17.5 C 81 15.2, 77.5 13, 72 11.2 C 62.5 7.8, 52.5 5.5, 50 3.8 Z"
            fill="none"
            stroke="#D4B870"
            strokeOpacity="0.55"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Top Apex Crown Accent */}
          <polygon points="50,0 51.5,1.5 50,3 48.5,1.5" fill="#D4B870" />
        </svg>

        {/* Royal Cartouche Plaque at Bottom (Inspired directly by reference design) */}
        <div className="absolute inset-x-2 sm:inset-x-3.5 lg:inset-x-4 bottom-2.5 sm:bottom-3.5 lg:bottom-4 z-30 flex flex-col items-center">
          <div className="w-full relative px-2.5 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 rounded-lg sm:rounded-xl bg-[#260528]/95 backdrop-blur-md border border-[#D4B870] shadow-[0_8px_24px_rgba(0,0,0,0.65)] group-hover:border-[#FAF7F0] group-hover:shadow-[0_8px_28px_rgba(212,184,112,0.3)] transition-all duration-300 text-center">
            {/* Subtle inner gold accent border */}
            <div className="absolute inset-0.5 rounded-[6px] sm:rounded-[10px] border border-[#D4B870]/30 pointer-events-none" />

            <h3 className="font-serif font-bold text-white group-hover:text-[#FAF7F0] text-[10px] min-[360px]:text-[11px] sm:text-xs md:text-sm lg:text-[15px] leading-tight line-clamp-1 tracking-[0.15em] uppercase">
              {product.name}
            </h3>

            <div className="mt-1 flex items-baseline justify-center gap-1.5 sm:gap-2">
              <span className="font-sans font-bold text-[9.5px] min-[360px]:text-[11px] sm:text-xs lg:text-[14px] text-[#D4B870]">
                ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
              </span>
              {product.salePrice && (
                <span className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-[10px] text-white/50 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Bottom Gold Lotus Accent (Sits centered on the bottom border) */}
            <div className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none">
              <svg width="28" height="10" viewBox="0 0 28 10" fill="none" className="w-5 h-2 sm:w-6 sm:h-2.5 text-[#D4B870]">
                <path d="M14 0L16.5 3.5L14 7L11.5 3.5L14 0Z" fill="currentColor" />
                <path d="M11 4C9 3 6 3 3 5C1 6.5 0 9 0 9.5C2 8.5 5 7.5 8 7C9.5 6.8 10.5 6 11 4Z" fill="currentColor" opacity="0.85" />
                <path d="M17 4C19 3 22 3 25 5C27 6.5 28 9 28 9.5C26 8.5 23 7.5 20 7C18.5 6.8 17.5 6 17 4Z" fill="currentColor" opacity="0.85" />
                <circle cx="14" cy="8.5" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Standard tile for the middle 2 landscape tiles (unchanged)
  const defaultPosition = variant === 'landscape' 
    ? 'object-top md:origin-top' 
    : 'object-[center_12%] md:origin-center';

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group relative block w-full h-full rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-white/10 hover:border-[#D4B870]/60 bg-[#1F0726] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B870] select-none ${className}`}
      aria-label={`View saree ${product.name}`}
    >
      {/* Product Image */}
      <Image
        src={imageSrc}
        alt={product.name}
        fill
        sizes={
          variant === 'tall'
            ? "(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 420px"
            : "(max-width: 640px) 40vw, (max-width: 1024px) 40vw, 540px"
        }
        className={`object-cover w-full h-full transition-transform duration-700 ease-out md:group-hover:scale-[1.03] ${imagePosition || defaultPosition}`}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        onError={() => setImageSrc(NO_IMAGE_PLACEHOLDER)}
      />

      {/* Inner Border Accent */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-white/10 group-hover:border-[#D4B870]/40 transition-colors duration-500 pointer-events-none" />

      {/* Editorial Content Overlay at Bottom (Clean, unshaded product view) */}
      <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3 z-10 flex flex-col justify-end pointer-events-none">
        <div className="bg-[#18041C]/85 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border border-white/10 group-hover:border-[#D4B870]/50 transition-colors w-fit max-w-full shadow-lg">
          <h3 className="font-sans font-medium sm:font-semibold text-white group-hover:text-[#FAF7F0] transition-colors leading-snug text-[10.5px] min-[360px]:text-xs sm:text-sm md:text-base line-clamp-1">
            {product.name}
          </h3>

          <div className="mt-0.5 flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-sans font-bold text-[10px] min-[360px]:text-[11px] sm:text-sm lg:text-base text-[#FAF7F0]">
              ₹{(product.salePrice ?? product.price).toLocaleString('en-IN')}
            </span>
            {product.salePrice && (
              <span className="text-[8px] min-[360px]:text-[9px] sm:text-xs text-white/60 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

interface PinterestGridProps {
  section: HomepageSection;
}

export const PinterestGrid: React.FC<PinterestGridProps> = ({ section }) => {
  const products = section.products || [];

  if (products.length === 0) {
    return null;
  }

  // Use available products up to product_limit, prioritizing first 4 for the primary composition
  const displayProducts = products.slice(0, 4);
  const hasFourProducts = displayProducts.length >= 4;

  const title = section.title;
  const subtitle = section.subtitle || section.collection?.description;
  const viewUrl = section.view_all_url || (section.collection?.slug ? `/collections/${section.collection.slug}` : undefined);
  const viewText = section.view_all_text || 'View Collection';

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3.5 sm:px-6 md:px-8 bg-gradient-to-b from-[#22072B] via-[#2E0B38] to-[#22072B] text-[#FAF7F0] relative overflow-hidden">
      {/* Luxury ambient decorative glow elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#B08A3C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#6B1725]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Editorial Section Header - Title & Subtitle Only */}
        {title && (
          <div className="flex items-end justify-between gap-3 mb-3 sm:mb-5 md:mb-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#D4B870] tracking-wide leading-tight">
                {title}
              </h2>
              {subtitle && subtitle.trim().length > 0 && (
                <p className="text-xs sm:text-sm text-[#FAF7F0]/80 font-light mt-0.5 sm:mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            {viewUrl && (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={viewUrl}
                  className="text-[11px] sm:text-xs font-serif font-bold text-[#D4B870] hover:text-white flex items-center gap-1 group transition-colors py-1"
                >
                  <span className="hidden sm:inline">{viewText}</span>
                  <span className="sm:hidden">{viewText.length > 12 ? 'View All' : viewText}</span>
                  <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Responsive Grid: 2x2 Royal Editorial on Mobile (<md), 3-Column Asymmetric on Desktop (>=md) */}
        {hasFourProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-[31%_1fr_31%] grid-rows-2 gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5 h-[480px] min-[380px]:h-[520px] min-[440px]:h-[560px] sm:h-[620px] md:h-[500px] lg:h-[540px] xl:h-[580px]">
            {/* Tile 1: Top-Left Arch on mobile, Left Tall Arch spanning both rows on desktop */}
            <div className="col-start-1 row-start-1 col-span-1 row-span-1 md:col-start-1 md:row-start-1 md:row-span-2 h-full w-full">
              <PinterestTile product={displayProducts[0]} variant="tall" isArch priority />
            </div>

            {/* Tile 2: Top-Right Arch on mobile, Center Top Landscape on desktop */}
            <div className="col-start-2 row-start-1 col-span-1 row-span-1 md:col-start-2 md:row-start-1 md:row-span-1 h-full w-full">
              <div className="block md:hidden h-full w-full">
                <PinterestTile product={displayProducts[1]} variant="tall" isArch />
              </div>
              <div className="hidden md:block h-full w-full">
                <PinterestTile product={displayProducts[1]} variant="landscape" />
              </div>
            </div>

            {/* Tile 3: Bottom-Left Arch on mobile, Center Bottom Landscape on desktop */}
            <div className="col-start-1 row-start-2 col-span-1 row-span-1 md:col-start-2 md:row-start-2 md:row-span-1 h-full w-full">
              <div className="block md:hidden h-full w-full">
                <PinterestTile product={displayProducts[2]} variant="tall" isArch />
              </div>
              <div className="hidden md:block h-full w-full">
                <PinterestTile product={displayProducts[2]} variant="landscape" />
              </div>
            </div>

            {/* Tile 4: Bottom-Right Arch on mobile, Right Tall Arch spanning both rows on desktop */}
            <div className="col-start-2 row-start-2 col-span-1 row-span-1 md:col-start-3 md:row-start-1 md:row-span-2 h-full w-full">
              <PinterestTile product={displayProducts[3]} variant="tall" isArch />
            </div>
          </div>
        ) : (
          /* Graceful adaptive layout if section has fewer than 4 products */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6 min-h-[320px]">
            {displayProducts.map((prod, idx) => (
              <div key={prod.id} className="aspect-[3/4]">
                <PinterestTile product={prod} variant="tall" isArch priority={idx === 0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
