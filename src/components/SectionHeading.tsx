import React from 'react';
import Link from 'next/link';

// ─── Product Section Heading (left-aligned, with optional View All) ───────────
// Used for: Trending Now, Bestsellers, New Arrivals, Signature Collection,
//           Shop by Budget, Recently Viewed, Recommended for You
interface ProductSectionHeadingProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export const ProductSectionHeading: React.FC<ProductSectionHeadingProps> = ({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View All →',
}) => (
  <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
    <div className="min-w-0">
      <h2 className="font-serif text-xl sm:text-2xl font-extrabold tracking-wide text-dark-brown leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-dark-brown/55 mt-1 font-light leading-snug">
          {subtitle}
        </p>
      )}
    </div>

    {viewAllHref && (
      <Link
        href={viewAllHref}
        className="flex-shrink-0 text-xs font-bold font-serif text-maroon hover:text-maroon-dark underline-offset-2 hover:underline transition-colors whitespace-nowrap py-1 px-0 min-h-[36px] flex items-center"
      >
        {viewAllLabel}
      </Link>
    )}
  </div>
);

// ─── Editorial Section Heading (centered, brand/trust sections) ───────────────
// Used for: Shop by Category, Shop the Look, Why Choose Us,
//           Follow Our Saree Stories, Visit Our Store
interface EditorialSectionHeadingProps {
  title: string;
  subtitle?: string;
  showDivider?: boolean;
}

export const EditorialSectionHeading: React.FC<EditorialSectionHeadingProps> = ({
  title,
  subtitle,
  showDivider = true,
}) => (
  <div className="text-center mb-10">
    <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
      {title}
    </h2>
    {showDivider && (
      <div className="w-12 h-0.5 bg-maroon mx-auto mt-3 mb-4" />
    )}
    {subtitle && (
      <p className="text-sm text-dark-brown/65 max-w-lg mx-auto leading-relaxed font-light">
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Reviews Section Heading (centered, compact star rating) ─────────────────
interface ReviewSectionHeadingProps {
  title: string;
  rating?: string;
}

export const ReviewSectionHeading: React.FC<ReviewSectionHeadingProps> = ({
  title,
  rating = '★★★★★ 4.8/5',
}) => (
  <div className="text-center mb-10">
    <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
      {title}
    </h2>
    <p className="text-sm text-gold font-bold mt-2">{rating}</p>
  </div>
);
