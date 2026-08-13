"use client";

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-maroon-dark text-ivory pt-16 pb-24 lg:pb-12 border-t border-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand Info & Socials */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/brand_logo.png"
                alt="Shree Banarasi Sarees Logo"
                className="h-14 w-auto object-contain bg-white rounded-full p-0.5 border border-gold/40"
              />
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold text-ivory tracking-wider">
                  Shree
                </span>
                <span className="text-[9px] text-gold font-bold tracking-[0.2em] uppercase -mt-1 font-serif">
                  Banarasi Sarees
                </span>
              </div>
            </Link>
            <p className="text-xs text-ivory/70 leading-relaxed font-light">
              Premium Indian ethnic fashion at accessible prices — handwoven traditions delivered right to your doorstep.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/shree.banarasisarees"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-ivory/10 hover:bg-gold hover:text-dark-brown transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" /></svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61591806898752"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-ivory/10 hover:bg-gold hover:text-dark-brown transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a
                href="https://wa.me/+916203909946"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-ivory/10 hover:bg-gold hover:text-dark-brown transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Column 1: Shop */}
          <div>
            <h4 className="text-sm font-serif font-bold text-gold uppercase tracking-wider mb-4 border-b border-gold/10 pb-1.5 inline-block">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory/80 font-medium">
              <li><Link href="/sarees" className="hover:text-gold transition-colors">All Sarees</Link></li>
              <li><Link href="/sarees?filter=new" className="hover:text-gold transition-colors">New Arrivals</Link></li>
              <li><Link href="/sarees?category=Banarasi" className="hover:text-gold transition-colors">Banarasi</Link></li>
              <li><Link href="/sarees?category=Chikankari" className="hover:text-gold transition-colors">Chikankari</Link></li>
              <li><Link href="/sarees?category=Bandhani" className="hover:text-gold transition-colors">Bandhani</Link></li>
              <li><Link href="/sarees?category=Organza" className="hover:text-gold transition-colors">Organza</Link></li>
              <li><Link href="/sarees?category=Chanderi" className="hover:text-gold transition-colors">Chanderi</Link></li>
              <li><Link href="/sarees?category=Bridal" className="hover:text-gold transition-colors">Bridal Collection</Link></li>
            </ul>
          </div>

          {/* Column 2: Customer Care */}
          <div>
            <h4 className="text-sm font-serif font-bold text-gold uppercase tracking-wider mb-4 border-b border-gold/10 pb-1.5 inline-block">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory/80 font-medium">
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-gold transition-colors">Shipping Information</Link></li>
              <li><Link href="/returns" className="hover:text-gold transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/refund-policy" className="hover:text-gold transition-colors">Refund Policy</Link></li>
              <li><Link href="/faqs" className="hover:text-gold transition-colors">FAQs</Link></li>
            </ul>
            <h4 className="text-sm font-serif font-bold text-gold uppercase tracking-wider mt-6 mb-4 border-b border-gold/10 pb-1.5 inline-block">
              About
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory/80 font-medium">
              <li><Link href="/about-us" className="hover:text-gold transition-colors">About Shree</Link></li>
              <li><Link href="/our-store" className="hover:text-gold transition-colors">Our Showroom</Link></li>
              <li><Link href="/#custom-saree" className="hover:text-gold transition-colors">Custom Sarees</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-serif font-bold text-gold uppercase tracking-wider border-b border-gold/10 pb-1.5 inline-block">
              Visit Our Store
            </h4>
            <ul className="space-y-3.5 text-xs text-ivory/80">
              <li className="flex gap-2 items-start">
                <MapPin size={16} className="text-gold flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Shree Banarasi Sarees<br />
                  Rudauli Chowk, Harpur Aloth<br />
                  Samastipur, Bihar – 848103
                </span>
              </li>
              <li className="flex gap-2 items-center">
                <Phone size={16} className="text-gold flex-shrink-0" />
                <span>+91 62039 09946</span>
              </li>
              <li className="pt-2">
                <a
                  href="https://wa.me/+916203909946"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#25D366] text-white rounded font-serif font-bold flex items-center justify-center gap-2 hover:bg-[#20ba5a] transition-all shadow-md"
                >
                  <MessageCircle size={16} className="fill-current" />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-gold/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-ivory/60 font-medium">
          <p>&copy; {currentYear} Shree Banarasi Sarees. All Rights Reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <Heart size={10} className="fill-maroon text-maroon animate-pulse" /> in Samastipur, Bihar
          </p>
        </div>
      </div>
    </footer>
  );
};
