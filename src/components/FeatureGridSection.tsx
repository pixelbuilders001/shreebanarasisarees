import React from "react";
import Link from "next/link";

interface FeatureCardProps {
  href: string;
  image: string;
  alt: string;
  badge?: string;
  className?: string;
  children: React.ReactNode;
}

const PROMO_BADGE_CLASS =
  "absolute top-2.5 right-2.5 z-20 bg-gold text-dark-brown text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-sm uppercase tracking-wider font-serif border border-gold/15";

const BOTTOM_GRADIENT =
  "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent";

const FeatureCard: React.FC<FeatureCardProps> = ({
  href,
  image,
  alt,
  badge,
  className = "",
  children,
}) => (
  <Link
    href={href}
    className={`group relative block overflow-hidden rounded-xl sm:rounded-2xl border border-gold/15 hover:border-gold/35 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all duration-300 ${className}`}
  >
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />
    </div>

    <div className={BOTTOM_GRADIENT} />

    {/* Subtle premium gold glow overlay on hover */}
    <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

    {badge && <span className={PROMO_BADGE_CLASS}>{badge}</span>}

    {children}
  </Link>
);

export const FeatureGridSection: React.FC = () => {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto border-b border-cream">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 lg:h-[440px] items-stretch">
        {/* ── Left Tall Banner: Sudathi GOLD ── */}
        <FeatureCard
          href="/sarees?priceRange=2000_5000"
          image="/wedding.webp"
          alt="Sudathi GOLD premium Banarasi silk sarees"
          badge="BUY 2 GET 1 FREE"
          className="h-72 sm:h-80 lg:h-full"
        >
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center p-5 sm:p-6">
            <div className="bg-ivory/95 border border-gold/40 rounded-full px-6 py-2.5 sm:px-8 sm:py-3 text-center shadow-lg">
              <span className="block font-serif text-lg sm:text-xl font-extrabold text-maroon tracking-wide leading-none">
                Sudathi
              </span>
              <span className="block font-serif text-[10px] sm:text-xs font-bold text-gold tracking-[0.3em] uppercase leading-tight mt-1">
                GOLD
              </span>
            </div>
          </div>
        </FeatureCard>

        {/* ── Middle Column: Two Stacked Cards ── */}
        <div className="grid grid-rows-2 gap-3 sm:gap-4 lg:gap-5">
          {/* Top-Center: BESTSELLERS */}
          <FeatureCard
            href="/sarees?filter=new"
            image="/sawan.webp"
            alt="Bestseller sarees collection"
            badge="BUY 2 GET 1 FREE"
            className="h-48 sm:h-56 lg:h-full"
          >
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-center p-4 sm:p-5 text-center">
              <span className="font-serif text-sm sm:text-lg font-extrabold tracking-widest text-ivory uppercase drop-shadow-md">
                Bestsellers
              </span>
            </div>
          </FeatureCard>

          {/* Bottom-Center: ESSENTIALS */}
          <FeatureCard
            href="/sarees"
            image="/banner2.webp"
            alt="Essential saree collection"
            badge="BUY 2 GET 1 FREE"
            className="h-48 sm:h-56 lg:h-full"
          >
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-center p-4 sm:p-5 text-center">
              <span className="font-serif text-sm sm:text-lg font-extrabold tracking-widest text-ivory uppercase drop-shadow-md">
                Essentials
              </span>
            </div>
          </FeatureCard>
        </div>

        {/* ── Right Tall Banner: READY TO WEAR SAREES ── */}
        <FeatureCard
          href="/sarees"
          image="/hero_desktop_3.webp"
          alt="Ready to wear sarees collection"
          badge="BUY 2 GET 1 FREE"
          className="h-72 sm:h-80 lg:h-full"
        >
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center p-5 sm:p-6 text-center">
            <span className="font-serif text-base sm:text-xl font-extrabold tracking-[0.15em] text-ivory uppercase drop-shadow-md leading-snug">
              Ready to Wear
              <span className="block text-[11px] sm:text-sm tracking-[0.3em]">Sarees</span>
            </span>
          </div>
        </FeatureCard>
      </div>
    </section>
  );
};