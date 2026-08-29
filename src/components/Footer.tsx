"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, MapPin, Heart, ShieldCheck, Truck, Sparkles, Headset, ChevronDown, ExternalLink, Smartphone, Download } from 'lucide-react';
import { useIsPwaInstalled, markPwaAsInstalled } from '@/lib/pwaUtils';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const isStandalone = useIsPwaInstalled();

  const handlePwaInstall = async () => {
    const promptEvent = typeof window !== 'undefined' ? (window as any).deferredPwaPrompt : null;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredPwaPrompt = null;
          markPwaAsInstalled();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else {
      alert('To install our app:\n1. Tap the Share icon in your browser\n2. Select "Add to Home Screen"');
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  return (
    <footer className="bg-[#52111C] text-[#FAF7F0] pt-14 pb-28 lg:pb-12 border-t border-[#B08A3C]/30 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── DESKTOP FOOTER GRID (Hidden on mobile for accordions) ── */}
        <div className="hidden md:grid grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-[#B08A3C]/15">
          
          {/* Brand Info & Socials (Col 1 - wider) */}
          <div className="col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees Logo"
                className="h-12 w-auto object-contain bg-white rounded-full p-0.5 border border-[#B08A3C]/40 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-[#FAF7F0] tracking-wider leading-none">
                  Shree
                </span>
                <span className="text-[9px] text-[#B08A3C] font-bold tracking-[0.2em] uppercase mt-0.5 font-serif leading-none">
                  Banarasi Sarees
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#FAF7F0]/75 leading-relaxed font-light">
              Timeless Indian sarees, rooted in tradition and curated for today. Authentically handwoven ethnic elegance delivered straight from Samastipur, Bihar.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://www.instagram.com/shree.banarasisarees"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#FAF7F0]/10 hover:bg-[#B08A3C] hover:text-[#292524] flex items-center justify-center transition-all duration-200"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61591806898752"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#FAF7F0]/10 hover:bg-[#B08A3C] hover:text-[#292524] flex items-center justify-center transition-all duration-200"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://wa.me/916203909946"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#FAF7F0]/10 hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all duration-200"
                aria-label="WhatsApp Support"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs text-[#FAF7F0]/80 font-medium">
              <li><Link href="/sarees" className="hover:text-[#B08A3C] transition-colors">All Sarees</Link></li>
              <li><Link href="/sarees?category=Banarasi" className="hover:text-[#B08A3C] transition-colors">Banarasi Sarees</Link></li>
              <li><Link href="/sarees?category=Silk" className="hover:text-[#B08A3C] transition-colors">Silk Sarees</Link></li>
              <li><Link href="/sarees?category=Chanderi" className="hover:text-[#B08A3C] transition-colors">Chanderi</Link></li>
              <li><Link href="/sarees?category=Bandhani" className="hover:text-[#B08A3C] transition-colors">Bandhani</Link></li>
              <li><Link href="/sarees?category=Organza" className="hover:text-[#B08A3C] transition-colors">Organza</Link></li>
              <li><Link href="/sarees?category=Bridal" className="hover:text-[#B08A3C] transition-colors">Bridal Collection</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#FAF7F0]/80 font-medium">
              <li><Link href="/contact" className="hover:text-[#B08A3C] transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-[#B08A3C] transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-[#B08A3C] transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/refund-policy" className="hover:text-[#B08A3C] transition-colors">Refund Policy</Link></li>
              <li><Link href="/faqs" className="hover:text-[#B08A3C] transition-colors">FAQs</Link></li>
              <li><Link href="/account" className="hover:text-[#B08A3C] transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Col 4: About */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest mb-4">
              About
            </h4>
            <ul className="space-y-2.5 text-xs text-[#FAF7F0]/80 font-medium">
              <li><Link href="/about-us" className="hover:text-[#B08A3C] transition-colors">About Us</Link></li>
              <li><Link href="/our-store" className="hover:text-[#B08A3C] transition-colors">Our Showroom</Link></li>
            </ul>
          </div>

          {/* Col 5: Visit Our Store */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-serif font-bold text-[#B08A3C] uppercase tracking-widest border-b border-[#B08A3C]/15 pb-1 inline-block">
              Visit Our Store
            </h4>
            <div className="text-xs text-[#FAF7F0]/80 space-y-2.5 leading-relaxed">
              <p className="font-bold text-[#FAF7F0]">Shree Banarasi Sarees</p>
              <p className="flex items-start gap-2">
                <MapPin size={15} className="text-[#B08A3C] shrink-0 mt-0.5" />
                <span>Rudauli Chowk, Harpur Aloth<br />Samastipur, Bihar – 848103</span>
              </p>
              <p className="text-[11px] text-[#FAF7F0]/60">Store Hours: 10:00 AM – 9:00 PM</p>
              <p className="flex items-center gap-2 pt-0.5">
                <Phone size={14} className="text-[#B08A3C] shrink-0" />
                <a href="tel:+916203909946" className="hover:text-[#B08A3C] transition-colors">+91 62039 09946</a>
              </p>
              <div className="pt-2">
                <a
                  href="https://maps.google.com/?q=Shree+Banarasi+Sarees+Rudauli+Chowk+Samastipur+Bihar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4B870] hover:text-[#FAF7F0] transition-colors underline"
                >
                  Get Directions <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* ── MOBILE COLLAPSIBLE FOOTER (Shown on mobile screens < md) ── */}
        <div className="md:hidden space-y-2 pb-8 border-b border-[#B08A3C]/15">
          
          {/* Mobile Brand Info */}
          <div className="space-y-3 pb-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/brand_logo.webp"
                alt="Shree Banarasi Sarees Logo"
                className="h-10 w-auto object-contain bg-white rounded-full p-0.5 border border-[#B08A3C]/40"
              />
              <div className="flex flex-col">
                <span className="font-serif text-base font-bold text-[#FAF7F0] tracking-wider leading-none">
                  Shree Banarasi Sarees
                </span>
                <span className="text-[9px] text-[#B08A3C] font-bold tracking-[0.15em] uppercase mt-0.5 font-serif leading-none">
                  Samastipur, Bihar
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#FAF7F0]/70 leading-relaxed font-light">
              Timeless Indian sarees, rooted in tradition and curated for today.
            </p>
          </div>

          {/* Accordion 1: SHOP */}
          <div className="border-b border-[#B08A3C]/15 py-1">
            <button
              onClick={() => toggleSection('shop')}
              className="w-full flex items-center justify-between min-h-[44px] py-2 text-left font-serif text-sm font-bold text-[#B08A3C] uppercase tracking-wider focus:outline-none"
              aria-expanded={openSection === 'shop'}
            >
              <span>SHOP</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'shop' ? 'rotate-180 text-[#FAF7F0]' : 'text-[#B08A3C]'}`} />
            </button>
            {openSection === 'shop' && (
              <ul className="space-y-2.5 pb-4 pt-1 text-xs text-[#FAF7F0]/80 font-medium animate-fadeIn">
                <li><Link href="/sarees" className="block py-1">All Sarees</Link></li>
                <li><Link href="/sarees?category=Banarasi" className="block py-1">Banarasi Sarees</Link></li>
                <li><Link href="/sarees?category=Silk" className="block py-1">Silk Sarees</Link></li>
                <li><Link href="/sarees?category=Chanderi" className="block py-1">Chanderi</Link></li>
                <li><Link href="/sarees?category=Bandhani" className="block py-1">Bandhani</Link></li>
                <li><Link href="/sarees?category=Organza" className="block py-1">Organza</Link></li>
                <li><Link href="/sarees?category=Bridal" className="block py-1">Bridal Collection</Link></li>
              </ul>
            )}
          </div>

          {/* Accordion 2: CUSTOMER CARE */}
          <div className="border-b border-[#B08A3C]/15 py-1">
            <button
              onClick={() => toggleSection('care')}
              className="w-full flex items-center justify-between min-h-[44px] py-2 text-left font-serif text-sm font-bold text-[#B08A3C] uppercase tracking-wider focus:outline-none"
              aria-expanded={openSection === 'care'}
            >
              <span>CUSTOMER CARE</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'care' ? 'rotate-180 text-[#FAF7F0]' : 'text-[#B08A3C]'}`} />
            </button>
            {openSection === 'care' && (
              <ul className="space-y-2.5 pb-4 pt-1 text-xs text-[#FAF7F0]/80 font-medium animate-fadeIn">
                <li><Link href="/contact" className="block py-1">Contact Us</Link></li>
                <li><Link href="/shipping" className="block py-1">Shipping & Delivery</Link></li>
                <li><Link href="/returns" className="block py-1">Returns & Exchanges</Link></li>
                <li><Link href="/refund-policy" className="block py-1">Refund Policy</Link></li>
                <li><Link href="/faqs" className="block py-1">FAQs</Link></li>
                <li><Link href="/account" className="block py-1">Track Order</Link></li>
              </ul>
            )}
          </div>

          {/* Accordion 3: ABOUT */}
          <div className="border-b border-[#B08A3C]/15 py-1">
            <button
              onClick={() => toggleSection('about')}
              className="w-full flex items-center justify-between min-h-[44px] py-2 text-left font-serif text-sm font-bold text-[#B08A3C] uppercase tracking-wider focus:outline-none"
              aria-expanded={openSection === 'about'}
            >
              <span>ABOUT</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'about' ? 'rotate-180 text-[#FAF7F0]' : 'text-[#B08A3C]'}`} />
            </button>
            {openSection === 'about' && (
              <ul className="space-y-2.5 pb-4 pt-1 text-xs text-[#FAF7F0]/80 font-medium animate-fadeIn">
                <li><Link href="/about-us" className="block py-1">About Us</Link></li>
                <li><Link href="/our-store" className="block py-1">Our Showroom</Link></li>
              </ul>
            )}
          </div>

          {/* Accordion 4: VISIT OUR STORE */}
          <div className="border-b border-[#B08A3C]/15 py-1">
            <button
              onClick={() => toggleSection('store')}
              className="w-full flex items-center justify-between min-h-[44px] py-2 text-left font-serif text-sm font-bold text-[#B08A3C] uppercase tracking-wider focus:outline-none"
              aria-expanded={openSection === 'store'}
            >
              <span>VISIT OUR STORE</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${openSection === 'store' ? 'rotate-180 text-[#FAF7F0]' : 'text-[#B08A3C]'}`} />
            </button>
            {openSection === 'store' && (
              <div className="pb-4 pt-1 text-xs text-[#FAF7F0]/80 space-y-2.5 leading-relaxed animate-fadeIn">
                <p className="font-bold text-[#FAF7F0]">Shree Banarasi Sarees</p>
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="text-[#B08A3C] shrink-0 mt-0.5" />
                  <span>Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103</span>
                </p>
                <p className="text-[11px] text-[#FAF7F0]/60">10:00 AM – 9:00 PM</p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-[#B08A3C] shrink-0" />
                  <a href="tel:+916203909946">+91 62039 09946</a>
                </p>
                <div>
                  <a
                    href="https://maps.google.com/?q=Shree+Banarasi+Sarees+Rudauli+Chowk+Samastipur+Bihar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#D4B870] underline font-semibold mt-1"
                  >
                    Get Directions <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Always accessible mobile WhatsApp CTA & PWA Install CTA */}
          <div className="pt-4 flex flex-col gap-2.5">
            {!isStandalone && (
              <button
                onClick={handlePwaInstall}
                className="w-full py-3 px-4 bg-[#B08A3C] hover:bg-[#97732E] text-[#292524] rounded-xl font-serif font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>INSTALL MOBILE APP</span>
              </button>
            )}

            <a
              href="https://wa.me/916203909946"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#2EBE5D] hover:bg-[#25A650] text-white rounded-xl font-serif font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} className="fill-current" />
              Chat on WhatsApp: +91 62039 09946
            </a>
            <div className="flex items-center justify-center gap-4 pt-1">
              <a
                href="https://www.instagram.com/shree.banarasisarees"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#FAF7F0]/70 hover:text-[#B08A3C] flex items-center gap-1.5"
              >
                Instagram
              </a>
              <span className="text-[#FAF7F0]/20">•</span>
              <a
                href="https://www.facebook.com/profile.php?id=61591806898752"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#FAF7F0]/70 hover:text-[#B08A3C] flex items-center gap-1.5"
              >
                Facebook
              </a>
            </div>
          </div>

        </div>

        {/* ── TRUST STRIP ── */}
        <div className="py-8 my-4 border-b border-[#B08A3C]/15">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FAF7F0]/5 border border-[#B08A3C]/10">
              <ShieldCheck size={20} className="text-[#B08A3C]" />
              <span className="text-xs font-serif font-bold text-[#FAF7F0]">Secure Payments</span>
              <span className="text-[10px] text-[#FAF7F0]/60">100% Encrypted Transactions</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FAF7F0]/5 border border-[#B08A3C]/10">
              <Truck size={20} className="text-[#B08A3C]" />
              <span className="text-xs font-serif font-bold text-[#FAF7F0]">Pan-India Delivery</span>
              <span className="text-[10px] text-[#FAF7F0]/60">Safe &amp; Insured Shipping</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FAF7F0]/5 border border-[#B08A3C]/10">
              <Sparkles size={20} className="text-[#B08A3C]" />
              <span className="text-xs font-serif font-bold text-[#FAF7F0]">Quality Checked</span>
              <span className="text-[10px] text-[#FAF7F0]/60">Handcrafted &amp; Verified</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FAF7F0]/5 border border-[#B08A3C]/10">
              <Headset size={20} className="text-[#B08A3C]" />
              <span className="text-xs font-serif font-bold text-[#FAF7F0]">Customer Support</span>
              <span className="text-[10px] text-[#FAF7F0]/60">Dedicated Local Assistance</span>
            </div>

          </div>
        </div>

        {/* ── FOOTER POLICIES & COPYRIGHT ── */}
        <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#FAF7F0]/60 font-medium">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/refund-policy" className="hover:text-[#B08A3C] transition-colors">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-[#B08A3C] transition-colors">Terms &amp; Conditions</Link>
            <Link href="/refund-policy" className="hover:text-[#B08A3C] transition-colors">Refund Policy</Link>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p>&copy; 2026 Shree Banarasi Sarees. All rights reserved.</p>
            <p className="text-[10px] text-[#FAF7F0]/45 flex items-center justify-center md:justify-end gap-1">
              Samastipur, Bihar, India <span className="text-[#B08A3C]">•</span> Woven with <Heart size={10} className="fill-[#6B1725] text-[#6B1725] inline" />
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
