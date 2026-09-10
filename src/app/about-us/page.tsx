import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { StoreInfo } from '../../components/StoreInfo';
import {
  ShieldCheck,
  Heart,
  Sparkles,
  Scissors,
  Landmark,
  Truck,
  Zap,
  RotateCcw,
  CheckCircle2,
  FileText,
  BadgePercent,
  Headphones,
  ChevronRight,
  ArrowRight,
  MapPin
} from 'lucide-react';

export const metadata: Metadata = {
  title: "About Shree Banarasi Sarees | Authentic Handloom Saree Store in Samastipur, Bihar",
  description: "Discover Shree Banarasi Sarees, Samastipur's premier destination for authentic Banarasi silks, bridal drapes, and traditional Indian handlooms. Visit our showroom at Rudauli Chowk or shop online.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/about-us",
  },
  openGraph: {
    title: "About Shree Banarasi Sarees | Authentic Handloom Saree Store in Samastipur, Bihar",
    description: "Discover Shree Banarasi Sarees, Samastipur's premier destination for authentic Banarasi silks, bridal drapes, and traditional Indian handlooms. Visit our showroom at Rudauli Chowk or shop online.",
    url: "https://shreebanarasisarees.in/about-us",
    type: "website",
  }
};

export default function AboutUs() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Shree Banarasi Sarees",
    "url": "https://shreebanarasisarees.in/about-us",
    "description": "Learn about Shree Banarasi Sarees, Samastipur's premier handloom saree showroom offering authentic Banarasi, Chikankari, Bandhani, and wedding silk sarees with local quick delivery."
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shreebanarasisarees.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "About Us",
        "item": "https://shreebanarasisarees.in/about-us"
      }
    ]
  };

  const fabrics = [
    {
      name: "Banarasi Silk",
      subtitle: "Pure Katan & Jangla",
      desc: "Woven in Varanasi with genuine mulberry silk and intricate gold zari motifs.",
      image: "/fabrics/banarasi_silk.png",
      link: "/sarees?fabric=Banarasi+Silk"
    },
    {
      name: "Lucknowi Chikankari",
      subtitle: "Hand-Embroidered Georgette",
      desc: "Delicate shadow work, floral jaal patterns, and graceful fluid drapes.",
      image: "/fabrics/chikankari_fabric.png",
      link: "/sarees?fabric=Chikankari"
    },
    {
      name: "Bandhani & Leheriya",
      subtitle: "Artisanal Tie & Dye",
      desc: "Vibrant festive hues adorned with traditional dots, waves, and gota patti.",
      image: "/fabrics/bandhani_silk.png",
      link: "/sarees?fabric=Bandhani"
    },
    {
      name: "Organza Silk",
      subtitle: "Translucent Festive Charm",
      desc: "Crisp, lightweight sheer drapes detailed with fine zari and resham embroidery.",
      image: "/fabrics/organza_silk.png",
      link: "/sarees?fabric=Organza"
    },
    {
      name: "Chanderi Silk",
      subtitle: "Royal Heritage Weaves",
      desc: "Featherlight texture interwoven with subtle golden coin buttis and sheer sheen.",
      image: "/fabrics/chanderi_silk.png",
      link: "/sarees?fabric=Chanderi"
    },
    {
      name: "Handloom Cotton",
      subtitle: "Natural Breathable Comfort",
      desc: "Pure breathable cotton crafted by master artisans for effortless everyday elegance.",
      image: "/fabrics/pure_cotton.png",
      link: "/sarees?fabric=Cotton"
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main className="bg-[#FAF7F0] min-h-screen text-[#292524] font-sans pb-16">

        {/* 1. Breadcrumbs Bar */}
        <div className="bg-[#FAF7F0] border-b border-[#E5DEC9]/80 py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-[#7A6E65]">
            <Link href="/" className="hover:text-[#6B1725] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-[#B08A3C]" />
            <span className="text-[#292524] font-medium">About Us</span>
          </div>
        </div>

        {/* 2. Hero Section: Rich Heritage Royal Maroon Banner */}
        <section className="bg-gradient-to-b from-[#52111C] via-[#6B1725] to-[#52111C] text-[#FAF7F0] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-[#B08A3C]/30 shadow-xl">
          <div className="absolute inset-0 bg-radial from-[#6B1725]/40 via-transparent to-black/30 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#B08A3C]/40 text-[#D4B870] text-[11px] font-serif uppercase tracking-[0.2em]">
              <Sparkles size={13} className="text-[#D4B870]" />
              <span>Rooted in Samastipur &bull; Sourced from Varanasi</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#FAF7F0] tracking-wide leading-tight">
              About Shree Banarasi Sarees
            </h1>

            <div className="w-16 h-0.5 bg-[#B08A3C] mx-auto my-3"></div>

            <p className="text-sm sm:text-base text-[#FAF7F0]/90 max-w-2xl mx-auto leading-relaxed font-light">
              Bringing authentic Indian handloom artistry, pure Banarasi silks, and bridal heirlooms directly from master weaver looms to families in Bihar and across India.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#FAF7F0]/80 font-sans">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/10">
                <MapPin size={13} className="text-[#D4B870]" /> Rudauli Chowk, Samastipur
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/10">
                <ShieldCheck size={13} className="text-[#D4B870]" /> 100% Certified Authentic Weaves
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/10">
                <Zap size={13} className="text-[#D4B870]" /> ~20-Min Local Quick Delivery
              </span>
            </div>
          </div>
        </section>

        {/* 3. Brand Story & Showroom Editorial Section */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left Story Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
                  OUR HERITAGE &amp; VISION
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-tight leading-snug">
                  Samastipur&apos;s Trusted Destination for Pure Indian Saree Traditions
                </h2>
                <div className="w-12 h-0.5 bg-[#6B1725]"></div>
              </div>

              <div className="text-sm text-[#6B625D] space-y-4 leading-relaxed font-light">
                <p>
                  <strong>Shree Banarasi Sarees (श्री बनारसी साड़ीज़)</strong> was founded with a singular, cherished mission: to bring pure, authentic Indian handloom sarees directly from traditional artisan clusters to discerning families in Bihar. Located prominently at <strong>Rudauli Chowk, Harpur Aloth, Samastipur, Bihar (848103)</strong>, our physical showroom has become a beloved landmark for bridal shopping, wedding trousseaus, festive celebrations, and heirloom gifts.
                </p>
                <p>
                  Every saree in our collection is curated with personal care. We partner directly with master weavers in Varanasi and artisan clusters across India, eliminating middlemen so that you receive uncompromised silk purity, certified zari work, and honest, fair pricing.
                </p>
                <p>
                  Today, we bridge time-honoured brick-and-mortar hospitality with modern digital convenience. Every saree visible on our online store is physically stocked on our showroom shelves in Samastipur. Whether you walk in to inspect the zari in natural daylight or order online from home, you experience the exact same authenticity, care, and personal consultation.
                </p>
              </div>

              {/* 4 Brand Pillars (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex gap-3 items-start p-3.5 bg-white rounded-2xl border border-[#E5DEC9] shadow-xs">
                  <div className="p-2 bg-[#6B1725]/5 text-[#6B1725] rounded-xl shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-[#292524] text-sm">100% Genuine Handlooms</h4>
                    <p className="text-xs text-[#6B625D] mt-0.5 font-light">Inspected by hand for pure silk fibers, certified zari, and authentic weaves.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3.5 bg-white rounded-2xl border border-[#E5DEC9] shadow-xs">
                  <div className="p-2 bg-[#6B1725]/5 text-[#6B1725] rounded-xl shrink-0">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-[#292524] text-sm">Custom Tailoring &amp; Fall/Pico</h4>
                    <p className="text-xs text-[#6B625D] mt-0.5 font-light">Expert blouse tailoring, fall stitching, and edge pico finished prior to dispatch.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3.5 bg-white rounded-2xl border border-[#E5DEC9] shadow-xs">
                  <div className="p-2 bg-[#6B1725]/5 text-[#6B1725] rounded-xl shrink-0">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-[#292524] text-sm">Physical Store &amp; Online</h4>
                    <p className="text-xs text-[#6B625D] mt-0.5 font-light">Visit our showroom or order online with Cash on Delivery and doorstep inspection.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3.5 bg-white rounded-2xl border border-[#E5DEC9] shadow-xs">
                  <div className="p-2 bg-[#6B1725]/5 text-[#6B1725] rounded-xl shrink-0">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-[#292524] text-sm">Personal Consultations</h4>
                    <p className="text-xs text-[#6B625D] mt-0.5 font-light">Dedicated bridal trousseau appointments or live WhatsApp video drape walkthroughs.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Photo Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] border-2 border-[#B08A3C]/30 shadow-xl bg-white group">
                <Image
                  src="/occasions/crafted_for_celebrations.png"
                  alt="Authentic Saree Craftsmanship at Shree Banarasi Sarees"
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                
                {/* Floating Bottom Card */}
                <div className="absolute bottom-5 left-5 right-5 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5DEC9] shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6B1725] text-[#FAF7F0] flex items-center justify-center shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-[#292524] text-sm">
                        Physical Showroom in Samastipur
                      </h4>
                      <p className="text-xs text-[#6B625D]">
                        Rudauli Chowk, Harpur Aloth &bull; Open Daily 10 AM – 9 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Weaving Traditions & Fabric Showcase (With Genuine Assets) */}
        <section className="py-14 sm:py-20 bg-white border-y border-[#E5DEC9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="text-[11px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
                HANDLOOM WEAVING TRADITIONS
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-tight">
                Authentic Weaves in Our Collection
              </h2>
              <div className="w-12 h-0.5 bg-[#6B1725] mx-auto my-2.5"></div>
              <p className="text-xs sm:text-sm text-[#6B625D] font-light leading-relaxed max-w-2xl mx-auto">
                Each weave embodies generations of artisanal wisdom. We source directly from the master weavers of Varanasi, Lucknow, Gujarat, and Madhya Pradesh.
              </p>
            </div>

            {/* Fabric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {fabrics.map((fabric, idx) => (
                <div
                  key={idx}
                  className="group bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] overflow-hidden hover:border-[#B08A3C] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Fabric Thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#EAE2D2]">
                      <Image
                        src={fabric.image}
                        alt={`${fabric.name} - Shree Banarasi Sarees`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <span className="text-[10px] font-serif font-bold text-[#B08A3C] uppercase tracking-wider block">
                        {fabric.subtitle}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#292524] group-hover:text-[#6B1725] transition-colors">
                        {fabric.name}
                      </h3>
                      <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                        {fabric.desc}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link
                      href={fabric.link}
                      className="text-xs font-serif font-bold text-[#6B1725] hover:text-[#52111C] inline-flex items-center gap-1.5 group-hover:underline"
                    >
                      <span>Explore {fabric.name}</span>
                      <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Modern Convenience: ~20-Min Local Delivery & Pan-India Care */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-[11px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
              MODERN CONVENIENCE
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-tight">
              Express Local Delivery &amp; Safe Pan-India Shipping
            </h2>
            <div className="w-12 h-0.5 bg-[#6B1725] mx-auto my-2.5"></div>
            <p className="text-xs sm:text-sm text-[#6B625D] font-light leading-relaxed max-w-2xl mx-auto">
              Whether you need an urgent saree in Samastipur for today&apos;s function or a bridal parcel sent to any Indian city, we deliver with care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: 20-Minute Express */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5DEC9] shadow-xs space-y-3.5 hover:border-[#B08A3C]/60 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#6B1725] text-[#FAF7F0] flex items-center justify-center shadow-xs">
                <Zap size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#292524] text-base sm:text-lg">
                ~20-Minute Local Delivery
              </h3>
              <p className="text-xs sm:text-sm text-[#6B625D] leading-relaxed font-light">
                For eligible local addresses in Samastipur, we offer rapid delivery within approximately 20 minutes during operational showroom hours (10:00 AM – 9:00 PM). This express service depends on local distance, inventory availability, traffic, and weather conditions.
              </p>
            </div>

            {/* Card 2: Doorstep Open-Box Inspection & COD */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5DEC9] shadow-xs space-y-3.5 hover:border-[#B08A3C]/60 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#6B1725] text-[#FAF7F0] flex items-center justify-center shadow-xs">
                <Truck size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#292524] text-base sm:text-lg">
                Doorstep Inspection &amp; COD
              </h3>
              <p className="text-xs sm:text-sm text-[#6B625D] leading-relaxed font-light">
                Shop with complete peace of mind. Inspect the fabric, zari luster, and color right at your doorstep before completing payment with Cash on Delivery (COD) or UPI on delivery.
              </p>
            </div>

            {/* Card 3: Pan-India Dispatch */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5DEC9] shadow-xs space-y-3.5 hover:border-[#B08A3C]/60 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#6B1725] text-[#FAF7F0] flex items-center justify-center shadow-xs">
                <CheckCircle2 size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#292524] text-base sm:text-lg">
                Secure Pan-India Delivery
              </h3>
              <p className="text-xs sm:text-sm text-[#6B625D] leading-relaxed font-light">
                For buyers across Bihar and other Indian states, orders are dispatched within 24–48 hours in rigid, crush-proof, moisture-sealed packaging via trusted courier partners (BlueDart, SpeedPost).
              </p>
            </div>
          </div>
        </section>

        {/* 6. Six Customer Commitments */}
        <section className="py-14 sm:py-20 bg-white border-y border-[#E5DEC9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="text-[11px] sm:text-xs font-bold text-[#B08A3C] uppercase tracking-[0.2em] font-sans block">
                OUR PRINCIPLES
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#292524] tracking-tight">
                Six Commitments to Every Saree Patron
              </h2>
              <div className="w-12 h-0.5 bg-[#6B1725] mx-auto my-2.5"></div>
              <p className="text-xs sm:text-sm text-[#6B625D] font-light leading-relaxed max-w-2xl mx-auto">
                Trust is woven into every thread. Here is how we ensure a transparent, joyful shopping experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-2.5 hover:border-[#B08A3C]/50 transition-all">
                <FileText className="text-[#6B1725]" size={22} />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">Accurate Product Photography</h4>
                <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                  We photograph our actual showroom inventory under balanced studio lighting. We transparently specify exact fabric composition, length, blouse status, and weave origin.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-2.5 hover:border-[#B08A3C]/50 transition-all">
                <BadgePercent className="text-[#6B1725]" size={22} />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">Clear, Honest Pricing</h4>
                <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                  Every price displayed includes all applicable GST (5% under HSN 5208). There are zero hidden convenience charges, surprise packing levies, or bait-and-switch markups.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-2.5 hover:border-[#B08A3C]/50 transition-all">
                <ShieldCheck className="text-[#6B1725]" size={22} />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">Secure Transactions</h4>
                <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                  Choose Cash on Delivery or future digital channels with 256-bit SSL encryption. We never store credit/debit card credentials and never ask for customer OTPs or UPI PINs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-2.5 hover:border-[#B08A3C]/50 transition-all">
                <Truck className="text-[#6B1725]" size={22} />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">Reliable Packaging &amp; Tracking</h4>
                <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                  Every heirloom saree is ironed, wrapped in protective acid-free paper, boxed in rigid board packaging, and tracked via SMS updates until safe delivery.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-2.5 hover:border-[#B08A3C]/50 transition-all">
                <RotateCcw className="text-[#6B1725]" size={22} />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">Transparent 3-Day Returns</h4>
                <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                  If an unstitched saree does not meet your expectations, return or exchange it within 3 calendar days of delivery. Verified refunds are credited within 5 to 7 business days.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-2.5 hover:border-[#B08A3C]/50 transition-all">
                <Headphones className="text-[#6B1725]" size={22} />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">Dedicated Saree Specialists</h4>
                <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                  Speak with real saree specialists who know our weaves inside out. Call or message us daily from 10:00 AM to 9:00 PM for styling advice or order assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Showroom Location & Interactive Map Section */}
        <StoreInfo />

      </main>

      <Footer />
    </>
  );
}
