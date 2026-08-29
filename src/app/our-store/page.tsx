import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { StoreInfo } from '../../components/StoreInfo';
import { MapPin, Clock, Phone, Navigation, MessageCircle, Star, Sparkles } from 'lucide-react';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholder';

export const metadata: Metadata = {
  title: "Our Showroom in Samastipur, Bihar | Shree Banarasi Sarees",
  description: "Visit Shree Banarasi Sarees outlet at Rudauli Chowk, Samastipur, Bihar. Draping advice, pure silks, and in-person customization services.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/our-store",
  }
};

export default function OurStorePage() {
  const mapQuery = "Shree Banarasi Sarees, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar 848103";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

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
        "name": "Our Store",
        "item": "https://shreebanarasisarees.in/our-store"
      }
    ]
  };

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Shree Banarasi Sarees Showroom",
    "image": "https://shreebanarasisarees.in/brand_logo.png",
    "url": "https://shreebanarasisarees.in/our-store",
    "telephone": "+916203909946",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rudauli Chowk, Harpur Aloth",
      "addressLocality": "Samastipur",
      "addressRegion": "Bihar",
      "postalCode": "848103",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.827918,
      "longitude": 85.7546103
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "10:00",
      "closes": "20:30"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <Header />
      
      <main className="bg-[#FFF9F0] pb-16">
        {/* Banner */}
        <section className="bg-maroon py-16 px-4 text-center border-b border-gold/30">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="text-xs text-gold uppercase tracking-[0.25em] font-bold block">
              In-Store Experience
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ivory tracking-wide">
              Our Samastipur Showroom
            </h1>
            <div className="w-16 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-light">
              Step into our physical showroom in Bihar to touch the pure fabrics, inspect the zari weaves, and consult with our bridal styling experts.
            </p>
          </div>
        </section>

        {/* Showroom Features */}
        <section className="py-12 sm:py-16 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-gold font-bold uppercase tracking-wider">Showroom Services</span>
                <h2 className="font-serif text-2xl font-bold text-dark-brown">
                  Bihar's Trusted Hub for Exquisite Ethnic Sarees
                </h2>
                <div className="w-12 h-0.5 bg-maroon"></div>
              </div>

              <p className="text-xs sm:text-sm text-dark-brown/70 leading-relaxed font-light">
                Our brick-and-mortar showroom in Samastipur is more than just a retail store—it is a space celebrating traditional Indian weavers. Here, you can examine our entire catalog including heavy bridal Katan silks, pastel georgette Chikankari, organic glass organza, and cotton-silk Chanderi sarees.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="p-1 text-gold">
                    <Star size={16} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-dark-brown text-sm">Personal Bridal Styling</h3>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Get dedicated drape assistance and color-matching suggestions for your entire wedding trousseau.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-1 text-gold">
                    <Star size={16} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-dark-brown text-sm">Custom Saree Ordering</h3>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Request bespoke dye colors, custom borders, and tailor-fit blouse stitching with our master weavers.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-1 text-gold">
                    <Star size={16} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-dark-brown text-sm">Store Pickup and Returns</h3>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Shop online at your convenience and pick up your items packaged, ironed, and ready to wear at the outlet.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-6 bg-maroon text-ivory text-center rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Navigation size={13} className="fill-current" />
                  GET DIRECTIONS
                </a>
                <a
                  href="https://wa.me/+916203909946"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-6 bg-white border border-[#25D366] text-[#25D366] text-center rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} className="fill-current" />
                  CONSULT ON WHATSAPP
                </a>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="lg:col-span-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-cream shadow-md bg-white p-2">
                <img 
                  src={NO_IMAGE_PLACEHOLDER} 
                  alt="Our Showroom Display" 
                  className="w-full h-full object-cover object-center rounded-xl"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Store Address Block */}
        <StoreInfo />
      </main>

      <Footer />
    </>
  );
}
