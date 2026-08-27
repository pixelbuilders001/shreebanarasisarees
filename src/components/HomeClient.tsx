"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { CategoryCard } from './CategoryCard';
import { CampaignSection } from './CampaignSection';
import { ProductCard } from './ProductCard';
import { Footer } from './Footer';
import { Product, PRODUCTS } from '../data/products';
import { ArrowLeft, ArrowRight, ShieldCheck, PackageCheck, Truck, CreditCard, Banknote, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { DbCampaign, DbHeroBanner } from '../data/supabase';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { useRecentlyViewed } from '../utils/useRecentlyViewed';

// Dynamically imported below-the-fold components
const TestimonialSection = dynamic(() => import('./TestimonialSection').then(m => m.TestimonialSection), {
  loading: () => <div className="h-60 bg-[#FAF7F0] animate-pulse my-4" />
});
const StoreInfo = dynamic(() => import('./StoreInfo').then(m => m.StoreInfo), {
  loading: () => <div className="h-60 bg-[#FAF7F0] animate-pulse my-4" />
});
const RecentlyViewed = dynamic(() => import('./RecentlyViewed').then(m => m.RecentlyViewed), {
  loading: () => null
});

interface HomeClientProps {
  allProducts?: Product[];
  activeCampaigns?: DbCampaign[];
  heroBanners?: DbHeroBanner[];
}

export default function HomeClient({ allProducts = PRODUCTS, activeCampaigns = [], heroBanners }: HomeClientProps) {
  // Filter bestsellers (up to 8)
  const bestsellerProducts = allProducts.filter(p => p.bestseller).slice(0, 8);
  const displayBestsellers = bestsellerProducts.length > 0 ? bestsellerProducts : allProducts.slice(0, 8);

  // Filter new arrivals (up to 6)
  const newArrivalsList = allProducts.filter(p => p.newArrival).slice(0, 6);
  const displayNewArrivals = newArrivalsList.length > 0 ? newArrivalsList : allProducts.slice(0, 6);

  // Recently viewed hook
  const { viewedIds } = useRecentlyViewed();

  // Scroll ref for New Arrivals carousel
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
      <main className="pb-12 bg-[#FAF7F0] overflow-x-hidden">
        {/* Hidden SEO H1 tag */}
        <h1 className="sr-only">Shree Banarasi Sarees | Premium Handloom &amp; Traditional Sarees in Samastipur, Bihar</h1>

        {/* 1. Hero Section */}
        <HeroSection initialBanners={heroBanners} />



        {/* 3. Shop by Category */}
        <CategoryCard />
        {/* 2. Top Campaign Banner (if active) */}
        <CampaignSection slot="top" initialCampaign={activeCampaigns[0] || null} />

        {/* 4. Bestsellers Section */}
        <section className="py-14 sm:py-18 px-4 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                  POPULAR FAVORITES
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                  Bestsellers
                </h2>
                <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1">
                  Some of our most-loved sarees chosen by our customers.
                </p>
              </div>
              <Link
                href="/sarees"
                className="mt-3 sm:mt-0 text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] flex items-center gap-1 group transition-colors"
              >
                <span>View All Sarees</span>
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Product Grid: 4 items desktop, 2 items mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {displayBestsellers.length > 0 ? (
                displayBestsellers.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))
              ) : (
                <ProductCardSkeleton count={8} />
              )}
            </div>
          </div>
        </section>

        {/* 5. Middle Campaign Banner (if active) */}
        {/* <CampaignSection slot="middle" initialCampaign={activeCampaigns[1] || null} /> */}

        {/* 6. Shop by Occasion Section */}
        <section className="py-14 sm:py-18 px-4 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                DISCOVER BY EVENT
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                Shop by Occasion
              </h2>
              <div className="w-12 h-0.5 bg-[#6B1725] mx-auto mt-2.5 mb-2.5" />
              <p className="text-xs sm:text-sm text-[#6B625D] font-light">
                Find the perfect saree tailored to every ritual, celebration and daily drape.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
              {[
                {
                  title: "Wedding & Bridal",
                  description: "Heavy Banarasi Katan silks with rich gold zari",
                  occasion: "Wedding",
                  image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Bridal Trousseau"
                },
                {
                  title: "Festive Celebrations",
                  description: "Vibrant Bandhanis, Chikankaris & festive colors",
                  occasion: "Festive",
                  image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Diwali & Pooja"
                },
                {
                  title: "Party & Evenings",
                  description: "Ethereal organzas & sequined georgettes",
                  occasion: "Party",
                  image: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Contemporary"
                },
                {
                  title: "Everyday & Office",
                  description: "Breathable chanderi cottons & lightweight weaves",
                  occasion: "Daily Wear",
                  image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600&h=750",
                  badge: "Comfort Wear"
                }
              ].map((card, idx) => (
                <Link
                  key={idx}
                  href={`/sarees?occasion=${encodeURIComponent(card.occasion)}`}
                  className="group relative bg-[#292524] rounded-2xl overflow-hidden aspect-[4/5] border border-[#B08A3C]/20 hover:border-[#B08A3C]/60 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col justify-end p-4 sm:p-5"
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 300px"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  />

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#292524]/90 via-[#292524]/30 to-transparent" />

                  {/* Badge */}
                  <span className="absolute top-3 right-3 bg-[#B08A3C] text-[#292524] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-serif shadow-sm z-10">
                    {card.badge}
                  </span>

                  {/* Copy */}
                  <div className="relative z-10">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF7F0] group-hover:text-[#D4B870] transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#FAF7F0]/75 font-light mt-1 line-clamp-2">
                      {card.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-serif font-bold text-[#D4B870] uppercase tracking-wider">
                      <span>Explore Collection</span>
                      <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Editorial Storytelling Section ("Crafted for Celebrations") */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-r from-[#52111C] via-[#6B1725] to-[#52111C] text-[#FAF7F0] relative overflow-hidden border-y border-[#B08A3C]/30 shadow-xl">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Image Composition */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] border border-[#B08A3C]/40 shadow-2xl group">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000"
                alt="Crafted for Celebrations - Shree Banarasi Sarees"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-[10px] text-[#D4B870] uppercase font-bold tracking-widest font-serif block">AUTHENTIC BANARASI</span>
                <p className="text-xs text-white/90 font-light mt-0.5">Handwoven with pure Katan silk and gold zari motifs.</p>
              </div>
            </div>

            {/* Right Editorial Copy */}
            <div className="space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B08A3C]/20 border border-[#B08A3C]/40">
                <Sparkles size={14} className="text-[#B08A3C]" />
                <span className="text-[10px] sm:text-xs font-bold text-[#D4B870] tracking-[0.2em] uppercase font-sans">
                  HERITAGE CRAFTSMANSHIP
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-wide leading-tight">
                Crafted for Celebrations
              </h2>

              <p className="text-xs sm:text-base text-[#FAF7F0]/85 font-light leading-relaxed max-w-lg mx-auto md:mx-0">
                From wedding rituals to festive evenings, discover sarees that carry the timeless beauty of Indian weaving traditions into every occasion. Each piece is hand-inspected to guarantee authentic texture and zari luster.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  href="/sarees"
                  className="py-3 px-8 bg-[#B08A3C] hover:bg-[#D4B870] text-[#292524] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  EXPLORE THE COLLECTION →
                </Link>
                <Link
                  href="/about-us"
                  className="py-3 px-6 bg-white/10 hover:bg-white/20 text-[#FAF7F0] border border-white/20 rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all"
                >
                  OUR HERITAGE
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Bottom Campaign Banner (if active) */}
        {/* <CampaignSection slot="bottom" initialCampaign={activeCampaigns[2] || null} /> */}

        {/* 9. Brand Story ("From Samastipur, With Love.") */}
        <section className="py-14 sm:py-18 px-4 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
              OUR ROOTED PROMISE
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
              From Samastipur, With Love.
            </h2>
            <div className="w-12 h-0.5 bg-[#6B1725] mx-auto" />
            <p className="text-xs sm:text-base text-[#6B625D] font-light leading-relaxed max-w-2xl mx-auto">
              Shree Banarasi Sarees is a dedicated Indian ethnic fashion store based at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar. We specialize in authentic Banarasi Katan silks, handwoven Chanderis, vibrant Bandhanis, and delicate Chikankari sarees. We bring traditional weaver craftsmanship directly to your doorstep across India with complete transparency and care.
            </p>

            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { title: "Direct Sourced", desc: "Authentic weaver clusters" },
                { title: "Quality Checked", desc: "Inspected by hand before shipping" },
                { title: "Samastipur Store", desc: "Visit our physical showroom" },
                { title: "Pan-India Shipping", desc: "Delivered safely across India" }
              ].map((pill, i) => (
                <div key={i} className="p-3 bg-[#FAF7F0] rounded-xl border border-[#B08A3C]/15 text-center">
                  <CheckCircle2 size={18} className="text-[#6B1725] mx-auto mb-1" />
                  <h4 className="font-serif font-bold text-xs text-[#292524]">{pill.title}</h4>
                  <p className="text-[10px] text-[#6B625D] font-light">{pill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. New Arrivals Section */}
        <section className="py-14 sm:py-18 px-4 max-w-7xl mx-auto border-b border-[#B08A3C]/15">
          <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                JUST ARRIVED ON THE LOOM
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                New Arrivals
              </h2>
              <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1">
                Fresh colours, new weaves and timeless favourites.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/sarees?filter=new"
                className="text-xs font-serif font-bold text-[#6B1725] hover:underline underline-offset-2 mr-2 hidden sm:inline-block"
              >
                View All New →
              </Link>
              <button
                onClick={scrollLeft}
                className="p-2.5 rounded-full border border-[#B08A3C]/30 bg-white hover:bg-[#FAF7F0] text-[#292524] transition-all shadow-sm active:scale-95"
                aria-label="Scroll left"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={scrollRight}
                className="p-2.5 rounded-full border border-[#B08A3C]/30 bg-white hover:bg-[#FAF7F0] text-[#292524] transition-all shadow-sm active:scale-95"
                aria-label="Scroll right"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x snap-mandatory"
          >
            {displayNewArrivals.length > 0 ? (
              displayNewArrivals.map((prod) => (
                <div
                  key={prod.id}
                  className="w-[240px] sm:w-[280px] flex-shrink-0 snap-start relative"
                >
                  <ProductCard product={prod} />
                </div>
              ))
            ) : (
              <ProductCardSkeleton count={6} />
            )}
          </div>
        </section>

        {/* 11. Shop by Fabric Collection */}
        <section className="py-14 sm:py-18 px-4 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                WEAVE &amp; MATERIAL
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                Explore by Fabric
              </h2>
              <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1">
                Shop sarees based on your favorite feel and drape.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {[
                { name: "Banarasi Silk", query: "Banarasi Silk", count: "Pure Katan" },
                { name: "Chanderi", query: "Chanderi Silk", count: "Cotton Silk" },
                { name: "Bandhani", query: "Silk", count: "Tie & Dye" },
                { name: "Organza", query: "Organza", count: "Glass Weave" },
                { name: "Chikankari", query: "Georgette", count: "Lucknowi Handwork" },
                { name: "Pure Cotton", query: "Cotton", count: "Daily Comfort" }
              ].map((fab, idx) => (
                <Link
                  key={idx}
                  href={`/sarees?fabric=${encodeURIComponent(fab.query)}`}
                  className="group p-4 bg-[#FAF7F0] rounded-xl border border-[#B08A3C]/20 hover:border-[#6B1725] hover:bg-[#6B1725] text-center transition-all duration-300 shadow-sm"
                >
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#292524] group-hover:text-[#FAF7F0] transition-colors">
                    {fab.name}
                  </h3>
                  <span className="text-[10px] text-[#6B625D] group-hover:text-[#D4B870] font-light block mt-1 transition-colors">
                    {fab.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 12. Trust & Service Benefits */}
        <section className="py-14 sm:py-18 px-4 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#292524] tracking-wide">
                Why Shop With Us
              </h2>
              <div className="w-12 h-0.5 bg-[#6B1725] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/15 text-center space-y-2.5 shadow-sm">
                <ShieldCheck size={28} className="text-[#6B1725] mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#292524]">Quality Checked</h3>
                <p className="text-xs text-[#6B625D] font-light leading-relaxed">Every saree is inspected by hand before packing.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/15 text-center space-y-2.5 shadow-sm">
                <PackageCheck size={28} className="text-[#6B1725] mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#292524]">Secure Packaging</h3>
                <p className="text-xs text-[#6B625D] font-light leading-relaxed">Packed carefully to ensure safe delivery.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/15 text-center space-y-2.5 shadow-sm">
                <Truck size={28} className="text-[#6B1725] mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#292524]">Pan-India Delivery</h3>
                <p className="text-xs text-[#6B625D] font-light leading-relaxed">Reliable shipping to pincodes across India.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/15 text-center space-y-2.5 shadow-sm">
                <CreditCard size={28} className="text-[#6B1725] mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#292524]">Secure Payments</h3>
                <p className="text-xs text-[#6B625D] font-light leading-relaxed">UPI, Cards &amp; Net Banking with SSL encryption.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#B08A3C]/15 text-center space-y-2.5 shadow-sm">
                <Banknote size={28} className="text-[#6B1725] mx-auto" />
                <h3 className="font-serif font-bold text-sm text-[#292524]">COD Available</h3>
                <p className="text-xs text-[#6B625D] font-light leading-relaxed">Pay conveniently at your doorstep.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 13. Customer Reviews */}
        <TestimonialSection />

        {/* 14. WhatsApp Personal Assistance Section */}
        <section className="my-12 sm:my-16 max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#292524] via-[#3a2e2b] to-[#292524] rounded-2xl p-6 sm:p-10 border border-[#B08A3C]/30 text-[#FAF7F0] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <span className="text-[10px] sm:text-xs font-bold text-[#D4B870] uppercase tracking-[0.2em] font-serif block">
                PERSONALIZED SHOPPING ASSISTANCE
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#FAF7F0]">
                Need help choosing your saree?
              </h2>
              <p className="text-xs sm:text-sm text-[#FAF7F0]/80 font-light leading-relaxed">
                Tell us your preferred colour, occasion and budget — our saree experts in Samastipur will help you find the right one via WhatsApp live preview.
              </p>
            </div>

            <a
              href="https://wa.me/916203909946?text=Hi%20Shree%20Banarasi%20Sarees,%20I%20need%20help%20choosing%20a%20saree"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-8 bg-[#2EBE5D] hover:bg-[#25A650] text-white rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md flex items-center gap-2 flex-shrink-0 active:scale-95"
            >
              <MessageCircle size={18} className="fill-current" />
              CHAT ON WHATSAPP
            </a>
          </div>
        </section>

        {/* Recently Viewed */}
        <RecentlyViewed viewedIds={viewedIds} />

        {/* Store Info / Showroom Details */}
        <StoreInfo />

        {/* 15. Final Collection CTA */}
        <section className="py-16 sm:py-20 px-4 text-center bg-[#FAF7F0] border-t border-[#B08A3C]/15">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
              Find Your Saree Today
            </h2>
            <p className="text-xs sm:text-sm text-[#6B625D] font-light leading-relaxed">
              Explore our collection of sarees for weddings, festivities and everyday elegance. Delivered straight to your home.
            </p>
            <div className="pt-2">
              <Link
                href="/sarees"
                className="inline-block py-3.5 px-9 bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg hover:scale-105 active:scale-95 border border-[#B08A3C]/30"
              >
                SHOP ALL SAREES →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
