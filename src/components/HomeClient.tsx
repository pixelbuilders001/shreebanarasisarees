"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { DeliveryMarquee } from './DeliveryMarquee';
import { DeliveryAnimationSection } from './DeliveryAnimationSection';
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

  // Filter new arrivals (up to 8 for desktop)
  const newArrivalsList = allProducts.filter(p => p.newArrival).slice(0, 8);
  const displayNewArrivals = newArrivalsList.length > 0 ? newArrivalsList : allProducts.slice(0, 8);

  // Recently viewed hook
  const { viewedIds } = useRecentlyViewed();

  // Scroll ref for New Arrivals carousel
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Header />
      <main className="pb-12 bg-[#FAF7F0] overflow-x-hidden">
        {/* Hidden SEO H1 tag */}
        <h1 className="sr-only">Shree Banarasi Sarees | Premium Handloom &amp; Traditional Sarees in Samastipur, Bihar</h1>

        {/* 1. Hero Section (Dual-styled Mobile Carousel & Luxury Desktop Banner) */}
        <HeroSection initialBanners={heroBanners} />

        {/* Delivery & Trust Information Infinite Marquee */}
        <DeliveryMarquee />

        {/* 3. Shop by Category (Preserved 4-col Mobile / Expanded 8-col Desktop) */}
        <CategoryCard />

        {/* 2. Top Campaign Banner (if active) */}
        <CampaignSection slot="top" initialCampaign={activeCampaigns[0] || null} />

        {/* 4. Bestsellers Section */}
        <section className="py-10 sm:py-16 px-4 md:px-8 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-6 sm:mb-10 gap-4">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-0.5 sm:mb-1">
                  POPULAR FAVORITES
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                  Bestsellers
                </h2>
                <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1 hidden sm:block">
                  Some of our most-loved sarees chosen by our customers across India.
                </p>
              </div>
              <Link
                href="/sarees"
                className="text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] flex items-center gap-1 group transition-colors shrink-0 py-1"
              >
                <span className="hidden sm:inline">View All Bestsellers</span>
                <span className="sm:hidden">View All</span>
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Product Grid: 4 items desktop, 2 items mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
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

        {/* 6. Shop by Occasion Section */}
        <section className="py-12 sm:py-20 px-4 md:px-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
              {[
                {
                  title: "Wedding & Bridal",
                  occasion: "Wedding",
                  image: "/occasions/wedding_bridal.png",
                  badge: "Bridal Trousseau"
                },
                {
                  title: "Festive Celebrations",
                  occasion: "Festive",
                  image: "/occasions/festive_celebrations.png",
                  badge: "Diwali & Pooja"
                },
                {
                  title: "Party & Evenings",
                  occasion: "Party",
                  image: "/occasions/party_evenings.png",
                  badge: "Contemporary"
                },
                {
                  title: "Everyday & Office",
                  occasion: "Daily Wear",
                  image: "/occasions/everyday_office.png",
                  badge: "Comfort Wear"
                }
              ].map((card, idx) => (
                <Link
                  key={idx}
                  href={`/sarees?occasion=${encodeURIComponent(card.occasion)}`}
                  className="group relative bg-[#292524] rounded-2xl overflow-hidden aspect-[4/5] border border-[#B08A3C]/20 hover:border-[#B08A3C]/60 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-end p-4 sm:p-6"
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  />

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#292524]/90 via-[#292524]/30 to-transparent" />

                  {/* Badge */}
                  <span className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#B08A3C] text-[#292524] text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-serif shadow-sm z-10">
                    {card.badge}
                  </span>

                  {/* Copy */}
                  <div className="relative z-10">
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-[#FAF7F0] group-hover:text-[#D4B870] transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-serif font-bold text-[#D4B870] uppercase tracking-wider">
                      <span>Explore Collection</span>
                      <ArrowRight size={14} className="transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Editorial Storytelling Section ("Crafted for Celebrations") */}
        <section className="py-16 sm:py-24 px-4 md:px-8 bg-gradient-to-r from-[#52111C] via-[#6B1725] to-[#52111C] text-[#FAF7F0] relative overflow-hidden border-y border-[#B08A3C]/30 shadow-2xl">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-14 items-center">
            {/* Left Image Composition */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] border-2 border-[#B08A3C]/40 shadow-2xl group">
              <Image
                src="/occasions/crafted_for_celebrations.png"
                alt="Crafted for Celebrations - Shree Banarasi Sarees"
                fill
                sizes="(max-width: 768px) 100vw, 650px"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3.5 sm:p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/15">
                <span className="text-[10px] sm:text-xs text-[#D4B870] uppercase font-bold tracking-widest font-serif block">AUTHENTIC BANARASI</span>
                <p className="text-xs sm:text-sm text-white/90 font-light mt-0.5">Handwoven with pure Katan silk and authentic gold zari motifs.</p>
              </div>
            </div>

            {/* Right Editorial Copy */}
            <div className="space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#B08A3C]/20 border border-[#B08A3C]/40 backdrop-blur-md">
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
                  className="py-3.5 px-8 bg-[#B08A3C] hover:bg-[#D4B870] text-[#292524] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  EXPLORE THE COLLECTION →
                </Link>
                <Link
                  href="/about-us"
                  className="py-3.5 px-7 bg-white/10 hover:bg-white/20 text-[#FAF7F0] border border-white/20 rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all backdrop-blur-xs"
                >
                  OUR HERITAGE
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Brand Story ("From Samastipur, With Love.") */}
        <section className="py-14 sm:py-20 px-4 md:px-8 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
              OUR ROOTED PROMISE
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
              From Samastipur, With Love.
            </h2>
            <div className="w-12 h-0.5 bg-[#6B1725] mx-auto" />
            <p className="text-xs sm:text-base text-[#6B625D] font-light leading-relaxed max-w-3xl mx-auto">
              Shree Banarasi Sarees is a dedicated Indian ethnic fashion store based at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar. We specialize in authentic Banarasi Katan silks, handwoven Chanderis, vibrant Bandhanis, and delicate Chikankari sarees. We bring traditional weaver craftsmanship directly to your doorstep across India with complete transparency and care.
            </p>

            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto">
              {[
                { title: "Direct Sourced", desc: "Authentic weaver clusters" },
                { title: "Quality Checked", desc: "Inspected by hand before shipping" },
                { title: "Samastipur Store", desc: "Visit our physical showroom" },
                { title: "Pan-India Shipping", desc: "Delivered safely across India" }
              ].map((pill, i) => (
                <div key={i} className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#B08A3C]/20 text-center hover:border-[#6B1725] hover:shadow-md transition-all">
                  <CheckCircle2 size={20} className="text-[#6B1725] mx-auto mb-1.5" />
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-[#292524]">{pill.title}</h4>
                  <p className="text-[11px] text-[#6B625D] font-light mt-0.5">{pill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. New Arrivals Section */}
        <section className="py-14 sm:py-20 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#B08A3C]/15">
          <div className="flex items-end justify-between gap-4 mb-6 sm:mb-10">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-0.5 sm:mb-1">
                JUST ARRIVED ON THE LOOM
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                New Arrivals
              </h2>
              <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1 hidden sm:block">
                Fresh colours, new weaves and timeless favourites.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/sarees?filter=new"
                className="text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] flex items-center gap-1 group transition-colors mr-1 sm:mr-2"
              >
                <span className="hidden sm:inline">View All New Arrivals</span>
                <span className="sm:hidden">View All</span>
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={scrollLeft}
                  className="p-3 rounded-full border border-[#B08A3C]/30 bg-white hover:bg-[#6B1725] hover:text-white text-[#292524] transition-all shadow-sm active:scale-95 cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={scrollRight}
                  className="p-3 rounded-full border border-[#B08A3C]/30 bg-white hover:bg-[#6B1725] hover:text-white text-[#292524] transition-all shadow-sm active:scale-95 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x snap-mandatory"
          >
            {displayNewArrivals.length > 0 ? (
              displayNewArrivals.map((prod) => (
                <div
                  key={prod.id}
                  className="w-[240px] sm:w-[280px] lg:w-[300px] flex-shrink-0 snap-start relative"
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
        <section className="py-14 sm:py-20 px-4 md:px-8 bg-[#FFFFFF] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                WEAVE &amp; MATERIAL
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-wide">
                Explore by Fabric
              </h2>
              <p className="text-xs sm:text-sm text-[#6B625D] font-light mt-1">
                Shop sarees based on your favorite feel, texture and drape.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-5 lg:gap-6">
              {[
                { name: "Banarasi Silk", query: "Banarasi Silk", tag: "Pure Katan", image: "/fabrics/banarasi_silk.png" },
                { name: "Chanderi", query: "Chanderi Silk", tag: "Cotton Silk", image: "/fabrics/chanderi_silk.png" },
                { name: "Bandhani", query: "Silk", tag: "Tie & Dye", image: "/fabrics/bandhani_silk.png" },
                { name: "Organza", query: "Organza", tag: "Glass Weave", image: "/fabrics/organza_silk.png" },
                { name: "Chikankari", query: "Georgette", tag: "Lucknowi Work", image: "/fabrics/chikankari_fabric.png" },
                { name: "Pure Cotton", query: "Cotton", tag: "Daily Comfort", image: "/fabrics/pure_cotton.png" }
              ].map((fab, idx) => (
                <Link
                  key={idx}
                  href={`/sarees?fabric=${encodeURIComponent(fab.query)}`}
                  className="group relative h-32 sm:h-60 lg:h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-[#B08A3C]/30 hover:border-[#D4B870] transition-all duration-500 block"
                >
                  <Image
                    src={fab.image}
                    alt={fab.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:from-black/90 group-hover:via-black/45 transition-all duration-500" />
                  <div className="absolute inset-2 sm:inset-3 border border-[#D4B870]/0 group-hover:border-[#D4B870]/60 rounded-xl transition-all duration-500 pointer-events-none z-10" />

                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 z-20 flex flex-col justify-end text-left">
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#D4B870] uppercase tracking-widest font-sans mb-0.5 block">
                      {fab.tag}
                    </span>
                    <h3 className="font-serif font-bold text-sm sm:text-lg text-white group-hover:text-[#FAF7F0] transition-colors leading-tight">
                      {fab.name}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-white/80 group-hover:text-white mt-2 transition-colors">
                      Explore <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 12. Trust & Service Benefits */}
        <section className="py-10 sm:py-16 px-4 md:px-8 bg-[#FAF7F0] border-b border-[#B08A3C]/15">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block mb-1">
                PEACE OF MIND
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#292524] tracking-wide">
                Why Shop With Us
              </h2>
              <div className="w-12 h-0.5 bg-[#6B1725] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 lg:gap-6">
              {[
                { icon: ShieldCheck, title: "Quality Checked", desc: "Inspected by hand" },
                { icon: PackageCheck, title: "Secure Packaging", desc: "Safe delivery guaranteed" },
                { icon: Truck, title: "Pan-India Shipping", desc: "All pincodes covered" },
                { icon: CreditCard, title: "100% Safe Payments", desc: "Encrypted UPI & Cards" },
                { icon: Banknote, title: "COD Available", desc: "Pay at your doorstep" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-3 sm:p-5 rounded-2xl border border-[#B08A3C]/20 hover:border-[#6B1725] hover:shadow-md transition-all duration-300 flex items-center sm:flex-col sm:text-center gap-3 sm:gap-4 shadow-2xs ${
                    idx === 4 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                >
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#FAF7F0] border border-[#B08A3C]/25 text-[#6B1725] flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-left sm:text-center min-w-0">
                    <h3 className="font-serif font-bold text-xs sm:text-base text-[#292524] truncate">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[#6B625D] font-light leading-tight mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 13. Customer Reviews */}
        <TestimonialSection />

        {/* Delivery Animation Visual Section */}
        <DeliveryAnimationSection />

        {/* 14. WhatsApp Personal Assistance Section */}
        <section className="my-10 sm:my-16 max-w-7xl mx-auto px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF7F0] via-[#F7F2E6] to-[#FAF7F0] p-6 sm:p-10 border border-[#B08A3C]/35 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#B08A3C]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 text-center md:text-left max-w-2xl relative z-10">
              <span className="text-[10px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
                PERSONAL SHOPPING CONCIERGE
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#292524] tracking-wide">
                Need help choosing your saree?
              </h2>
              <p className="text-xs sm:text-base text-[#6B625D] font-light leading-relaxed">
                Tell us your preferred color, occasion, and budget — our saree experts in Samastipur will help you pick the perfect one via WhatsApp live preview.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 pt-2 text-xs font-semibold text-[#6B1725]">
                <span className="flex items-center gap-1.5">✓ Live Video Call</span>
                <span className="flex items-center gap-1.5">✓ Blouse Matching</span>
                <span className="flex items-center gap-1.5">✓ Fast Response</span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="https://wa.me/+916203909946?text=Hi%20Shree%20Banarasi%20Sarees,%20I%20need%20help%20choosing%20a%20saree"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-8 bg-[#2EBE5D] hover:bg-[#25A650] text-white rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md flex items-center gap-2.5 active:scale-95"
              >
                <MessageCircle size={20} className="fill-current" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* Recently Viewed */}
        <RecentlyViewed viewedIds={viewedIds} />

        {/* Store Info / Showroom Details */}
        <StoreInfo />

        {/* 15. Final Collection CTA */}
        <section className="py-16 sm:py-24 px-4 text-center bg-[#FAF7F0] border-t border-[#B08A3C]/15">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#292524] tracking-wide">
              Find Your Saree Today
            </h2>
            <p className="text-xs sm:text-base text-[#6B625D] font-light leading-relaxed">
              Explore our collection of sarees for weddings, festivities and everyday elegance. Delivered straight to your home.
            </p>
            <div className="pt-2">
              <Link
                href="/sarees"
                className="inline-block py-4 px-10 bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] rounded-xl font-serif font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl hover:scale-105 active:scale-95 border border-[#B08A3C]/30"
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
