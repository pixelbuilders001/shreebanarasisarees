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
import { PRODUCTS } from '../data/products';
import { ArrowLeft, ArrowRight, ShieldCheck, Award, Wrench, Headphones } from 'lucide-react';

export default function HomeClient() {
  // Get featured products (up to 8)
  const featuredProducts = PRODUCTS.filter(p => p.featured).slice(0, 8);

  // Get new arrivals (up to 6)
  const newArrivals = PRODUCTS.filter(p => p.newArrival).slice(0, 6);

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
        <h1 className="sr-only">SHREE Banarasi Sarees | श्री बनारसी साड़ियाँ - Premium Indian Saree Showroom in Samastipur, Bihar</h1>

        {/* Hero Section */}
        <HeroSection />

        {/* Categories Section */}
        <CategoryCard />

        {/* Featured Signature Collection */}
        <section className="py-16 px-4 bg-[#FFFFFF] border-t border-b border-cream">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-px bg-gold/50"></div>
                <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
                  Signature Picks
                </span>
                <div className="w-8 h-px bg-gold/50"></div>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-wide text-dark-brown">
                Our Signature Collection
              </h2>
              <div className="w-16 h-0.5 bg-maroon mx-auto my-4"></div>
              <p className="text-sm text-dark-brown/65 max-w-lg mx-auto leading-relaxed font-light">
                Choose from our handpicked pieces of pure zari and silk heritage weaves.
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/sarees"
                className="inline-flex py-3 px-8 border border-maroon text-maroon hover:bg-maroon hover:text-white rounded font-serif font-bold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-sm"
              >
                VIEW ALL SAREES
              </Link>
            </div>
          </div>
        </section>

        {/* New Arrivals Section with Horizontal Scroll */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
                  Just Woven
                </span>
                <div className="w-8 h-px bg-gold/50"></div>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-dark-brown">
                New Arrivals
              </h2>
            </div>
            
            {/* Scroll Navigation Buttons */}
            <div className="flex gap-2">
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
            className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-6 scroll-smooth snap-x snap-mandatory"
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
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-px bg-gold/50"></div>
                <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
                  Why Shop With Us
                </span>
                <div className="w-8 h-px bg-gold/50"></div>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
                Why Choose Us
              </h2>
              <div className="w-16 h-0.5 bg-maroon mx-auto my-3"></div>
            </div>

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
