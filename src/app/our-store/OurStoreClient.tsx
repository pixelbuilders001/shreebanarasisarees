"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Sparkles,
  Scissors,
  ShoppingBag,
  ExternalLink,
  Zap,
  Eye,
  Car,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function OurStoreClient() {
  const router = useRouter();

  const mapQuery = "Shree Banarasi Sarees, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar 848103";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;
  const whatsappUrl = "https://wa.me/+916203909946?text=Namaste!%20I%20am%20planning%20to%20visit%20your%20Samastipur%20showroom.";

  // Dynamic Open / Closed calculation according to IST (UTC+5:30)
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; text: string }>({
    isOpen: true,
    text: 'Open Now · Closes at 9:00 PM'
  });

  useEffect(() => {
    const computeStatus = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + 3600000 * 5.5);
      const minutes = ist.getHours() * 60 + ist.getMinutes();
      const openTime = 10 * 60; // 10:00 AM
      const closeTime = 21 * 60; // 9:00 PM

      if (minutes >= openTime && minutes < closeTime) {
        setStoreStatus({ isOpen: true, text: 'Open Now · Closes at 9:00 PM' });
      } else if (minutes < openTime) {
        setStoreStatus({ isOpen: false, text: 'Closed Now · Opens at 10:00 AM' });
      } else {
        setStoreStatus({ isOpen: false, text: 'Closed Now · Opens tomorrow at 10:00 AM' });
      }
    };

    computeStatus();
    const interval = setInterval(computeStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const showroomServices = [
    {
      icon: Sparkles,
      title: "Bridal Styling & Drape Consultation",
      desc: "One-on-one personal stylist assistance to coordinate trousseau color palettes, matching blouses, and wedding day silhouettes."
    },
    {
      icon: Eye,
      title: "Natural Daylight Fabric Inspection",
      desc: "Spacious viewing tables under neutral daylight to inspect authentic silk weave tension, zari purity, and graceful drape."
    },
    {
      icon: Scissors,
      title: "In-House Tailoring & Fall/Pico",
      desc: "Precision blouse tailoring, fall stitching, and edge pico finished by our expert in-house tailors prior to dispatch."
    },
    {
      icon: MessageCircle,
      title: "Live Video Drape Assistance",
      desc: "Unable to visit today? Request a live WhatsApp video consultation to view any saree draped on a mannequin in real time."
    },
    {
      icon: ShoppingBag,
      title: "Store Pickup (Click & Collect)",
      desc: "Reserve online on our storefront and inspect or collect your packaged saree directly at the counter within minutes."
    },
    {
      icon: Zap,
      title: "Local ~20-Minute Delivery Hub",
      desc: "Our showroom serves as our local express dispatch center, bringing authentic handlooms directly to your doorstep in Samastipur."
    }
  ];

  return (
    <div className="bg-[#FAF7F0] min-h-screen text-[#292524] font-sans pb-20 lg:pb-16">
      
      {/* ── 1. DESKTOP BREADCRUMB BAR ── */}
      <div className="hidden lg:block bg-[#FAF7F0] border-b border-[#E5DEC9]/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-xs text-[#7A6E65]">
          <Link href="/" className="hover:text-[#6B1725] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-[#B08A3C]" />
          <span className="text-[#292524] font-medium">Our Showroom</span>
        </div>
      </div>

      {/* ── 2. MOBILE TOP NAVIGATION BAR ── */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E5DEC9] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="p-1 -ml-1 text-[#292524] hover:text-[#6B1725] active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-serif text-base font-bold text-[#292524] tracking-tight">
            Our Showroom
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5DEC9] text-[11px] font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full ${storeStatus.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
          <span className={storeStatus.isOpen ? 'text-emerald-700' : 'text-rose-600'}>
            {storeStatus.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* ── 3. HERO SHOWROOM BANNER ── */}
        <div className="w-full sm:pt-6 sm:px-4 lg:px-6">
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] sm:rounded-3xl overflow-hidden bg-[#EAE2D2] shadow-md border-b sm:border border-[#B08A3C]/30 group">
            <img
              src="/our_store_banner.png"
              alt="Shree Banarasi Sarees Showroom in Samastipur, Bihar"
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />
            
            {/* Top pill badge */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[#FAF7F0] text-[10px] sm:text-xs font-serif font-bold uppercase tracking-wider">
              <Sparkles size={12} className="text-[#D4B870]" />
              <span>Flagship Showroom &bull; Samastipur</span>
            </div>

            {/* Bottom floating highlights */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 flex items-center justify-between gap-2 text-white/90 text-[10px] sm:text-xs font-light">
              <span className="bg-black/45 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                Over 1,000+ Pure Handlooms on Display
              </span>
              <span className="hidden sm:inline-block bg-black/45 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                Direct Weaving Lineage from Varanasi
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. MAIN CONTENT CONTAINER ── */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-8">

          {/* ── STORE TITLE & STORY BLURB ── */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#B08A3C]/10 border border-[#B08A3C]/30 text-[#B08A3C] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              VISIT US IN PERSON
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#292524] font-extrabold tracking-tight">
              Shree Banarasi Sarees Showroom
            </h2>
            <p className="text-xs sm:text-sm text-[#B08A3C] font-serif font-semibold tracking-wide">
              श्री बनारसी साड़ीज़ &bull; Rudauli Chowk, Harpur Aloth, Samastipur
            </p>
            <p className="text-sm sm:text-base text-[#6B625D] leading-relaxed font-light max-w-3xl">
              Authentic handloom sarees sourced straight from master weavers in Varanasi. Every saree showcased on our digital storefront is physically available on our showroom shelves in Samastipur. Walk in to inspect the soft silk texture and certified zari luster in natural daylight, or order online with rapid local delivery.
            </p>
          </div>

          {/* ── 5. STORE DETAILS CARD ── */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5DEC9] shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#6B1725]/5 text-[#6B1725] shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-[#B08A3C] tracking-wider block">
                    Showroom Address
                  </span>
                  <p className="font-medium text-[#292524]">
                    Rudauli Chowk, Harpur Aloth
                  </p>
                  <p className="text-[#6B625D]">
                    Samastipur, Bihar – 848103, India
                  </p>
                  <span className="text-[11px] text-[#6B625D]/80 block mt-0.5">
                    Landmark: Main Highway Road (&asymp;12 mins from Samastipur Junction)
                  </span>
                </div>
              </div>

              {/* Timings */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#6B1725]/5 text-[#6B1725] shrink-0 mt-0.5">
                  <Clock size={20} />
                </div>
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-[#B08A3C] tracking-wider block">
                    Visiting Hours
                  </span>
                  <p className="font-medium text-[#292524]">
                    10:00 AM – 9:00 PM Daily
                  </p>
                  <p className="text-emerald-700 font-semibold text-xs">
                    Open Every Day (Including Sundays)
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${storeStatus.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-xs font-bold ${storeStatus.isOpen ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {storeStatus.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone & Inquiries */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#6B1725]/5 text-[#6B1725] shrink-0 mt-0.5">
                  <Phone size={20} />
                </div>
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-[#B08A3C] tracking-wider block">
                    Direct Showroom Desk
                  </span>
                  <a
                    href="tel:+916203909946"
                    className="font-medium text-[#292524] hover:text-[#6B1725] transition-colors block text-sm"
                  >
                    +91 62039 09946
                  </a>
                  <a
                    href="mailto:shreebanarasi180@gmail.com"
                    className="text-[#6B625D] hover:underline block text-xs mt-0.5"
                  >
                    shreebanarasi180@gmail.com
                  </a>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#6B1725]/5 text-[#6B1725] shrink-0 mt-0.5">
                  <Car size={20} />
                </div>
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-[#B08A3C] tracking-wider block">
                    Visitor Amenities
                  </span>
                  <p className="font-medium text-[#292524]">
                    Complimentary Customer Parking
                  </p>
                  <p className="text-[#6B625D]">
                    Ground-floor accessibility, trial mirrors, and air-conditioned lounge
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ── 6. ACTION CTAs: 3-BUTTON ACTION BAR ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl border border-[#6B1725] bg-transparent hover:bg-[#6B1725]/5 text-[#6B1725] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-2xs"
            >
              <MapPin size={16} className="text-[#6B1725]" />
              <span>Get Directions</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle size={16} className="text-white fill-white/20" />
              <span>WhatsApp Us</span>
            </a>

            <a
              href="tel:+916203909946"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#6B1725] hover:bg-[#52111C] text-[#FAF7F0] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <Phone size={16} className="text-[#FAF7F0]" />
              <span>Call Showroom</span>
            </a>
          </div>

          {/* ── 7. COMPLIMENTARY SHOWROOM SERVICES (6-Card Luxury Grid) ── */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5DEC9] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#F3ECE0] pb-3">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#B08A3C] uppercase tracking-wider block">
                  IN-STORE CONCIERGE
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
                  Showroom Services &amp; Personal Care
                </h3>
              </div>
              <span className="text-xs text-[#7A6E65] font-light">
                Complimentary for all visitors
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {showroomServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <div
                    key={index}
                    className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-2 hover:border-[#B08A3C]/60 hover:shadow-2xs transition-all"
                  >
                    <div className="flex items-center gap-2 text-[#6B1725]">
                      <div className="p-1.5 rounded-lg bg-white border border-[#E5DEC9] shadow-2xs">
                        <IconComponent size={16} />
                      </div>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#292524]">
                        {service.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[#6B625D] leading-relaxed font-light">
                      {service.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 8. COLLECTIONS CURRENTLY ON DISPLAY ── */}
          <div className="bg-gradient-to-r from-[#52111C] via-[#6B1725] to-[#52111C] text-[#FAF7F0] rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-[#B08A3C]/30 shadow-md space-y-5">
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="text-[10px] sm:text-xs font-serif font-bold text-[#D4B870] uppercase tracking-widest block">
                HANDLOOM CATALOGUE
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#FAF7F0] tracking-wide">
                Collections Available on Showroom Shelves
              </h3>
              <p className="text-xs sm:text-sm text-[#FAF7F0]/85 font-light leading-relaxed">
                Explore authentic Banarasi Katan silks, vibrant Bandhanis, bridal brocades, sheer Organzas, and delicate Lucknowi Chikankari drapes.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              {[
                "Pure Banarasi Silk",
                "Bridal & Trousseau",
                "Lucknowi Chikankari",
                "Chanderi & Bandhani"
              ].map((name, i) => (
                <div key={i} className="px-3 py-2 rounded-xl bg-black/30 border border-white/15 backdrop-blur-sm text-center font-medium">
                  {name}
                </div>
              ))}
            </div>

            <div className="relative z-10 pt-2">
              <Link
                href="/sarees"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B08A3C] hover:bg-[#D4B870] text-[#292524] font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <span>Browse Online Saree Catalogue</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* ── 9. INTERACTIVE GOOGLE MAP & TRANSIT GUIDE ── */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5DEC9] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3ECE0] pb-3">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#B08A3C] uppercase tracking-wider block">
                  SHOWROOM NAVIGATION
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
                  Showroom Location &amp; Transit Guide
                </h3>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B1725] hover:underline"
              >
                <span>Open in Google Maps App</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Transit Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#6B625D]">
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#6B1725] shrink-0" />
                <span><strong>From Samastipur Jn:</strong> ~12 mins (approx. 4.5 km)</span>
              </div>
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#6B1725] shrink-0" />
                <span><strong>From Tajpur / NH-28:</strong> ~20 mins via highway</span>
              </div>
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5DEC9] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#6B1725] shrink-0" />
                <span><strong>Exact Spot:</strong> Rudauli Chowk, Harpur Aloth</span>
              </div>
            </div>

            {/* Google Maps Iframe */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border border-[#E5DEC9] bg-[#EAE2D2] shadow-2xs">
              <iframe
                src={mapEmbedUrl}
                title="Shree Banarasi Sarees Showroom Location - Rudauli Chowk, Samastipur"
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full border-0"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
