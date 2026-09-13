"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HomepageSection } from '../../types/homepage-sections';

interface ImageBannerSectionProps {
  section: HomepageSection;
}

/**
 * ImageBannerSection
 *
 * A pure image-based promotional banner display style for the storefront homepage.
 * The uploaded image itself already contains title, subtitle, CTA, and complete artwork.
 * Renders the entire image clickable without any HTML text overlays, subtitles, or buttons.
 */
export const ImageBannerSection: React.FC<ImageBannerSectionProps> = ({ section }) => {
  const [hasError, setHasError] = useState(false);

  // Missing or invalid image -> Gracefully skip section
  const imageUrl = section?.image_url?.trim();
  if (!imageUrl || hasError) {
    return null;
  }

  const destinationUrl = section?.view_all_url?.trim() || null;
  const isClickable = Boolean(destinationUrl);

  const altText =
    section.title?.trim() ||
    section.subtitle?.trim() ||
    'Promotional Banner - Shree Banarasi Sarees';

  const bannerImage = (
    <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-[#B08A3C]/20 hover:border-[#B08A3C]/40 transition-colors duration-300">
      <Image
        src={imageUrl}
        alt={altText}
        width={1440}
        height={600}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
        unoptimized={!imageUrl.includes('ik.imagekit.io')}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-auto block transition-all duration-300 group-hover:opacity-95 md:group-hover:scale-[1.005]"
      />
    </div>
  );

  return (
    <section className="py-4 sm:py-6 md:py-8 px-4 md:px-8 w-full">
      <div className="max-w-7xl mx-auto">
        {isClickable && destinationUrl ? (
          <Link
            href={destinationUrl}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A3C] focus-visible:ring-offset-2 rounded-xl sm:rounded-2xl cursor-pointer"
            aria-label={altText}
          >
            {bannerImage}
          </Link>
        ) : (
          <div className="block cursor-default">
            {bannerImage}
          </div>
        )}
      </div>
    </section>
  );
};

export default ImageBannerSection;
