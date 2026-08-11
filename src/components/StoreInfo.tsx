"use client";

import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, Navigation } from 'lucide-react';

export const StoreInfo: React.FC = () => {
  const mapQuery = "SHREE Banarasi Sarees, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar 848103";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <section className="py-16 px-4 bg-cream/35 border-b border-cream">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-px bg-gold/50"></div>
            <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
              Samastipur Outlet
            </span>
            <div className="w-8 h-px bg-gold/50"></div>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-wide text-dark-brown">
            Visit Our Store
          </h2>
          <div className="w-16 h-0.5 bg-maroon mx-auto my-4"></div>
          <p className="text-sm text-dark-brown/70 max-w-xl mx-auto leading-relaxed">
            Step into our showroom in Samastipur, Bihar to feel the soft fabrics, inspect the real gold zari borders, and enjoy direct personal assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Card Info Column */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-cream flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-maroon mb-1">
                  SHREE Banarasi Sarees
                </h3>
                <p className="text-[11px] text-gold font-bold tracking-widest uppercase">
                  श्री बनारसी साड़ियाँ
                </p>
              </div>

              <div className="space-y-4">
                {/* Address */}
                <div className="flex gap-3 items-start">
                  <MapPin size={20} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-dark-brown/80 leading-relaxed font-medium">
                    Rudauli Chowk, Harpur Aloth<br />
                    Samastipur, Bihar – 848103
                  </p>
                </div>

                {/* Timing */}
                <div className="flex gap-3 items-start">
                  <Clock size={20} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-dark-brown/80 leading-relaxed font-medium">
                    Open Daily: 10:00 AM – 9:00 PM<br />
                    <span className="text-xs text-green-700 font-semibold">(Open on Sundays)</span>
                  </p>
                </div>

                {/* Contact */}
                <div className="flex gap-3 items-start">
                  <Phone size={20} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-dark-brown/80 leading-relaxed font-medium">
                    +91 62039 09946
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-cream">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-maroon text-ivory text-center rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] transition-all shadow flex items-center justify-center gap-1.5"
              >
                <Navigation size={13} className="fill-current" />
                GET DIRECTIONS
              </a>
              <a
                href="https://wa.me/+916203909946"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-white border border-[#25D366] text-[#25D366] text-center rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={14} className="fill-current" />
                WhatsApp
              </a>
            </div>

          </div>

          {/* Map Column */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-cream shadow-sm relative min-h-[300px] bg-cream/15 flex flex-col items-center justify-center">
            {/* Visual Map Layout Graphic inside code */}
            <div className="absolute inset-0 p-4 opacity-30 pointer-events-none grid grid-cols-6 grid-rows-6 border border-cream/50 bg-[#F7EEDF]/20">
              <div className="col-span-2 row-span-3 border-r border-b border-gold/25 bg-gold/5 flex items-center justify-center text-[10px] font-bold text-dark-brown/40">Ganga Road</div>
              <div className="col-span-4 row-span-2 border-b border-gold/25 bg-gold/5 flex items-center justify-center text-[10px] font-bold text-dark-brown/40">Samastipur Highway</div>
              <div className="col-span-3 row-span-4 border-r border-gold/25 bg-gold/5 flex items-center justify-center text-[10px] font-bold text-dark-brown/40">Harpur Aloth Area</div>
            </div>

            {/* Map Center Pin Design */}
            <div className="z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div className="p-4 bg-maroon text-ivory rounded-full shadow-lg border-2 border-gold flex items-center justify-center animate-bounce">
                <MapPin size={32} className="fill-current" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-dark-brown text-sm">Rudauli Chowk, Samastipur</h4>
                <p className="text-xs text-dark-brown/60 mt-1 max-w-xs leading-relaxed">
                  Located at the heart of Samastipur's textile hub. Easy parking available directly in front of the store.
                </p>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-5 bg-white border border-gold text-gold font-serif font-bold text-xs tracking-wider rounded hover:bg-gold hover:text-[#FFFFFF] transition-all"
              >
                OPEN GOOGLE MAPS
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
