"use client";

import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, Navigation } from 'lucide-react';

export const StoreInfo: React.FC = () => {
  const mapQuery = "Shree Banarasi Sarees, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar 848103";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;

  return (
    <section className="py-16 px-4 bg-cream/35">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide text-dark-brown">
            Visit Our Store
          </h2>
          <div className="w-16 h-0.5 bg-maroon mx-auto mt-3 mb-4"></div>
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
                  Shree Banarasi Sarees
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
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-cream shadow-sm relative min-h-[300px] bg-cream/15">
            {/* Live Google Maps Embed (no API key required) */}
            <iframe
              src={mapEmbedUrl}
              title="Shree Banarasi Sarees Store Location - Rudauli Chowk, Samastipur"
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full border-0"
              style={{ border: 0 }}
            />

            {/* Floating Open in Google Maps chip */}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 z-10 py-2 px-4 bg-white border border-gold text-gold font-serif font-bold text-[11px] tracking-wider uppercase rounded-lg shadow-lg hover:bg-gold hover:text-dark-brown hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Navigation size={12} className="fill-current" />
              Open in Maps
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
