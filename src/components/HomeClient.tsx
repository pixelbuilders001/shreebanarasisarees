"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { CategoryCard } from './CategoryCard';
import { ProductCard } from './ProductCard';
import { CustomSareeRequest } from './CustomSareeRequest';
import { TestimonialSection } from './TestimonialSection';
import { InstagramGrid } from './InstagramGrid';
import { StoreInfo } from './StoreInfo';
import { Footer } from './Footer';
import { Product, PRODUCTS } from '../data/products';
import { ArrowLeft, ArrowRight, ShieldCheck, Award, Wrench, Headphones } from 'lucide-react';
import { DbCampaign } from '../data/supabase';
import { CampaignSection } from './CampaignSection';
import { ProductSectionHeading, EditorialSectionHeading } from './SectionHeading';

interface HomeClientProps {
  allProducts?: Product[];
  activeCampaigns?: DbCampaign[];
}

export default function HomeClient({ allProducts = PRODUCTS, activeCampaigns = [] }: HomeClientProps) {
  // Get featured products (up to 8)
  const featuredProducts = allProducts.filter(p => p.featured).slice(0, 8);

  // Get new arrivals (up to 6)
  const newArrivals = allProducts.filter(p => p.newArrival).slice(0, 6);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Header />
      <main className="pb-12">
        {/* Hidden H1 for SEO compliance - ensuring a single clean H1 exists above the fold */}
        <h1 className="sr-only">Shree Banarasi Sarees | श्री बनारसी साड़ियाँ - Premium Indian Saree Showroom in Samastipur, Bihar</h1>

        {/* Hero Section */}
        <HeroSection />

        {/* Categories Section */}
        <CategoryCard />

        {/* Clickable Rakhi Sale Banner Strip */}
        {/* <section className="my-8 max-w-7xl mx-auto px-4">
          <Link
            href="/sarees"
            className="group block relative overflow-hidden rounded-xl sm:rounded-2xl border border-gold/15 hover:border-gold/35 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <img
              src="/rakhi_sale_banner.webp"
              alt="Rakhi Sale Buy 2 Get 1 Free - Shop Now"
              className="w-full aspect-[1024/331] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            />
          
            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>
        </section> */}

        {/* Top Campaign Slot */}
        <CampaignSection slot="top" />

        {/* Shop By Price Section */}
        <section className="pt-8 pb-16 md:py-16 px-4 bg-gradient-to-b from-[#FFF9F0] to-[#FFFFFF] border-t border-cream">
          <div className="max-w-7xl mx-auto">
            <ProductSectionHeading
              title="Shop by Budget"
              subtitle="Beautiful sarees curated across every budget range."
              viewAllHref="/sarees"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  title: "Under ₹999",
                  tagline: "Budget Elegance",
                  description: "Everyday cottons & lightweight georgettes",
                  priceRange: "under_999",
                  image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Best Value"
                },
                {
                  title: "Under ₹1,499",
                  tagline: "Festive Grace",
                  description: "Charming organzas & contemporary fabrics",
                  priceRange: "under_1499",
                  image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Popular"
                },
                {
                  title: "Under ₹2,000",
                  tagline: "Traditional Splendor",
                  description: "Fine chanderi & handloom designs",
                  priceRange: "under_2000",
                  image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Trending"
                },
                {
                  title: "Above ₹2,000",
                  tagline: "Heritage Luxury",
                  description: "Pure Katan silks & wedding Banarasis",
                  priceRange: "2000_5000",
                  image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Signature"
                }
              ].map((card, idx) => (
                <Link
                  key={idx}
                  href={`/sarees?priceRange=${card.priceRange}`}
                  className="group bg-[#FFF9F0]/65 border border-gold/15 hover:border-gold/45 rounded-2xl p-2.5 sm:p-4 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
                >
                  <div className="w-full">
                    {/* Image Container with Gold frame */}
                    <div className="relative w-full aspect-[4/5] rounded-xl p-[2px] bg-gradient-to-b from-gold/30 to-gold/10 group-hover:from-maroon/40 group-hover:to-maroon/10 transition-all duration-500 flex items-center justify-center overflow-hidden mb-3.5 sm:mb-4 shadow-sm">
                      <div className="w-full h-full rounded-[10px] p-[2px] bg-[#FFF9F0] flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full rounded-lg overflow-hidden relative border border-gold/5">
                          <img
                            src={card.image}
                            alt={card.tagline}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          {/* Inner Accent Line */}
                          <div className="absolute inset-1.5 border border-gold/15 pointer-events-none rounded-[6px] transition-all duration-500 group-hover:border-maroon/20" />

                          {/* Rich Overlay */}
                          <div className="absolute inset-0 bg-maroon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                          {/* Elegant Badge Overlay */}
                          <span className="absolute top-2.5 right-2.5 bg-gold text-dark-brown text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider font-serif">
                            {card.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Metadata */}
                    <div className="px-1">
                      <span className="text-[8px] sm:text-[9px] text-gold font-bold uppercase tracking-widest font-sans block mb-1">
                        {card.tagline}
                      </span>
                      <h3 className="font-serif text-sm sm:text-lg font-extrabold tracking-wide text-dark-brown group-hover:text-maroon transition-colors duration-300 mb-1 leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-dark-brown/65 font-light leading-relaxed mb-3 sm:mb-4 line-clamp-2 h-7 sm:h-8">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Explore Button */}
                  <div className="px-1 mt-auto">
                    <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-maroon font-bold font-serif uppercase tracking-wider py-2 border border-maroon/25 rounded-lg group-hover:bg-maroon group-hover:text-ivory group-hover:border-maroon transition-all duration-300 w-full text-center">
                      <span>Explore Collection</span>
                      <svg className="w-3 h-3 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Clickable Silk Sarees Banner Strip */}
        {/* <section className="my-8 max-w-7xl mx-auto px-4">
          <Link
            href="/sarees/silk"
            className="group block relative overflow-hidden rounded-xl sm:rounded-2xl border border-gold/15 hover:border-gold/35 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <img
              src="/silk_sarees_banner.webp"
              alt="Silk Sarees starting at ₹599 - Shop Now"
              className="w-full aspect-[4/1] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            />

            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>
        </section> */}

        {/* Middle Campaign Slot */}
        <CampaignSection slot="middle" />

        {/* Featured Signature Collection */}
        <section className="py-16 px-4 bg-[#FFFFFF] border-t border-b border-cream">
          <div className="max-w-7xl mx-auto">
            <ProductSectionHeading
              title="Our Signature Collection"
              subtitle="Handpicked pure zari and silk heritage weaves."
              viewAllHref="/sarees"
            />

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {featuredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
        {/* Bottom Campaign Slot */}
        <CampaignSection slot="bottom" />
        {/* New Arrivals Section with Horizontal Scroll */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          {/* Header row: title left, scroll controls right */}
          <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5">
            <div className="min-w-0">
              <h2 className="font-serif text-xl sm:text-2xl font-extrabold tracking-wide text-dark-brown leading-tight">
                New Arrivals
              </h2>
              <p className="text-xs text-dark-brown/55 mt-1 font-light leading-snug">
                Just arrived from the loom
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/sarees"
                className="text-xs font-bold font-serif text-maroon hover:text-maroon-dark hover:underline underline-offset-2 transition-colors whitespace-nowrap mr-2 min-h-[36px] flex items-center"
              >
                View All →
              </Link>
              {/* Scroll Navigation Buttons */}
              <button
                onClick={scrollLeft}
                className="p-2.5 rounded-full border border-cream hover:bg-cream/40 text-dark-brown hover:scale-105 active:scale-95 transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={scrollRight}
                className="p-2.5 rounded-full border border-cream hover:bg-cream/40 text-dark-brown hover:scale-105 active:scale-95 transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Horizontally scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-6 scroll-smooth snap-x snap-mandatory"
          >
            {newArrivals.map((prod) => (
              <div
                key={prod.id}
                className="w-[240px] sm:w-[280px] flex-shrink-0 snap-start relative"
              >
                <ProductCard product={prod} />
                <span className="absolute top-4 left-4 bg-maroon text-ivory text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-10">
                  JUST IN
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="my-8 max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden h-[320px] bg-maroon-dark flex items-center shadow-lg border border-gold/30">
            {/* Background Image */}
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200"
              alt="Elegance Within Your Budget"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="relative z-20 px-6 sm:px-16 text-ivory max-w-xl space-y-4">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-gold uppercase font-serif block">
                —— FESTIVE SPECIALS ——
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-wide">
                Elegance Within Your Budget
              </h2>
              <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed font-light">
                Beautiful lightweight cotton, linen and georgette sarees starting from only <span className="font-semibold text-gold text-base font-serif">₹999</span>. Perfect for daily wear and festive gifting.
              </p>
              <div className="pt-2">
                <Link
                  href="/sarees?priceRange=under_1000"
                  className="inline-block py-2.5 px-6 bg-gold text-dark-brown rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-gold-light hover:scale-105 active:scale-95 transition-all shadow"
                >
                  EXPLORE NOW →
                </Link>
              </div>
            </div>
          </div>
        </section>



        {/* Why Choose Us */}
        <section className="py-16 px-4 bg-[#FFFFFF] border-t border-b border-cream">
          <div className="max-w-7xl mx-auto">
            <EditorialSectionHeading
              title="Why Choose Us"
              showDivider={true}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

              {/* Card 1 */}
              <div className="bg-cream/10 p-6 rounded-2xl border border-cream hover:border-gold/30 hover:shadow-sm transition-all text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-cream flex items-center justify-center rounded-full text-maroon shadow-inner">
                  <Award size={22} />
                </div>
                <h3 className="font-serif font-bold text-dark-brown text-sm">
                  Authentic Collection
                </h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-medium">
                  Directly sourced from Indian weaver clusters.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-cream/10 p-6 rounded-2xl border border-cream hover:border-gold/30 hover:shadow-sm transition-all text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-cream flex items-center justify-center rounded-full text-maroon shadow-inner">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="font-serif font-bold text-dark-brown text-sm">
                  Premium Quality
                </h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-medium">
                  Quality inspected by hand yarns and embroidery.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-cream/10 p-6 rounded-2xl border border-cream hover:border-gold/30 hover:shadow-sm transition-all text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-cream flex items-center justify-center rounded-full text-maroon shadow-inner">
                  <Wrench size={20} />
                </div>
                <h3 className="font-serif font-bold text-dark-brown text-sm">
                  Trustworthy Aesthetics
                </h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-medium">
                  Warm, traditional designs made for modern wear.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-cream/10 p-6 rounded-2xl border border-cream hover:border-gold/30 hover:shadow-sm transition-all text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-cream flex items-center justify-center rounded-full text-maroon shadow-inner">
                  <Headphones size={20} />
                </div>
                <h3 className="font-serif font-bold text-dark-brown text-sm">
                  Personal Assistance
                </h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-medium">
                  Style consultations and blouse stitching support.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Custom Saree Feature Form */}
        <CustomSareeRequest />

        {/* Customer Reviews Section */}
        <TestimonialSection />

        {/* Instagram Grid Section */}
        <InstagramGrid />

        {/* Visit Our Showroom Map & Details */}
        <StoreInfo />

      </main>
      <Footer />
    </>
  );
}
