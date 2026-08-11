import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { StoreInfo } from '../../components/StoreInfo';
import { MapPin, Clock, Phone, ShieldCheck, Heart, Sparkles, Scissors, Landmark } from 'lucide-react';

export const metadata: Metadata = {
  title: "SHREE Banarasi Sarees | Saree Shop in Samastipur, Bihar",
  description: "Visit SHREE Banarasi Sarees, the leading traditional saree showroom in Samastipur, Bihar. Explore our premium collection of authentic Banarasi silk, Lucknowi Chikankari, Gujarati Bandhani, and designer bridal wedding sarees.",
  alternates: {
    canonical: "https://shreebanarasisarees.com/about-us",
  },
  openGraph: {
    title: "SHREE Banarasi Sarees | Saree Shop in Samastipur, Bihar",
    description: "Visit SHREE Banarasi Sarees, the leading traditional saree showroom in Samastipur, Bihar. Explore our premium collection of authentic Banarasi silk, Lucknowi Chikankari, Gujarati Bandhani, and designer bridal wedding sarees.",
    url: "https://shreebanarasisarees.com/about-us",
    type: "website",
  }
};

export default function AboutUs() {
  return (
    <>
      <Header />
      
      <main className="bg-[#FFF9F0] pb-12">
        
        {/* Hero Banner Area */}
        <section className="relative bg-maroon-dark py-20 px-4 text-center border-b border-gold/30">
          <div className="absolute inset-0 bg-black/45 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200" 
            alt="Inside SHREE Banarasi Sarees Showroom" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-65"
          />
          <div className="relative z-20 max-w-4xl mx-auto space-y-4">
            <span className="text-xs text-gold uppercase tracking-[0.3em] font-bold block">
              Established in Bihar
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-ivory tracking-wide leading-tight">
              Saree Shop in Samastipur, Bihar
            </h1>
            <div className="w-20 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-sm sm:text-base text-ivory/90 max-w-2xl mx-auto leading-relaxed font-light">
              Experience the luxury of handloom heritage. SHREE Banarasi Sarees brings the finest handwoven silks, Lucknowi block prints, and custom bridal designs directly to Samastipur.
            </p>
          </div>
        </section>

        {/* Brand Story and Location info */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Story Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-gold font-bold uppercase tracking-wider">Our Heritage</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-dark-brown">
                  Samastipur's Premier Destination for Traditional Sarees
                </h2>
                <div className="w-12 h-0.5 bg-maroon"></div>
              </div>

              <div className="text-xs sm:text-sm text-dark-brown/80 space-y-4 leading-relaxed font-light">
                <p>
                  SHREE Banarasi Sarees (श्री बनारसी साड़ियाँ) was founded with a singular mission: to make premium, authentic Indian ethnic wear accessible to families in Bihar. Strategically located at Rudauli Chowk, Harpur Aloth, Samastipur, our physical showroom has served thousands of local brides, mothers, and fashion enthusiasts seeking genuine craftsmanship.
                </p>
                <p>
                  Unlike generic storefronts, we source our garments directly from traditional artisan clusters. From the handloom hubs of Varanasi to the intricate Chikankari artisans of Lucknow and the tie-dye specialists of Kutch, each saree in our collection is handpicked, quality-checked, and priced transparently.
                </p>
                <p>
                  We are deeply committed to preserving the heritage of hand-weaving. Our store collections include exquisite pure Katan silk Banarasis, lightweight Lucknowi Chikankari georgettes, rich Gujarati Bandhanis, transparent glass organzas, and breathable Chanderi silks.
                </p>
              </div>

              {/* USP Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-maroon/5 text-maroon rounded-full">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-dark-brown text-sm">100% Genuine Handlooms</h4>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Inspected by hand for real zari and pure silk yarn.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-maroon/5 text-maroon rounded-full">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-dark-brown text-sm">Custom Tailoring Support</h4>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Custom blouse stitching and size adjustments with expert weavers.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-maroon/5 text-maroon rounded-full">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-dark-brown text-sm">Store Pickup & Delivery</h4>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Buy online and collect at our Samastipur showroom, or get free national shipping.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-maroon/5 text-maroon rounded-full">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-dark-brown text-sm">Personal Consultations</h4>
                    <p className="text-xs text-dark-brown/65 mt-0.5 font-light">Schedule dedicated showroom visits or WhatsApp video shopping calls.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Column / Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-cream shadow-md bg-white p-2">
                <img 
                  src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600" 
                  alt="Traditional Saree Collections in Samastipur Store" 
                  className="w-full h-full object-cover object-center rounded-xl"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-cream flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-dark-brown block">Bridal Specialty Store</span>
                  <span className="text-[10px] text-dark-brown/60">Serving Samastipur & Bihar</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* transit directions & hours */}
        <section className="py-12 bg-white border-t border-b border-cream">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-dark-brown text-center mb-10">
              Showroom Location & Transit Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm text-dark-brown/85 font-light leading-relaxed">
              
              <div className="space-y-2.5 p-5 bg-[#FFF9F0]/60 rounded-xl border border-cream">
                <h4 className="font-serif font-bold text-maroon text-sm flex items-center gap-1.5">
                  <MapPin size={16} /> Location & Landmark
                </h4>
                <p>
                  Our showroom is situated at <strong>Rudauli Chowk, Harpur Aloth, Samastipur, Bihar (848103)</strong>. It is located at the center of the local textile hub, right on the main access highway. Look for our signature maroon and gold signboard.
                </p>
              </div>

              <div className="space-y-2.5 p-5 bg-[#FFF9F0]/60 rounded-xl border border-cream">
                <h4 className="font-serif font-bold text-maroon text-sm flex items-center gap-1.5">
                  <Clock size={16} /> Showroom Hours
                </h4>
                <p>
                  We are open <strong>every day of the week from 10:00 AM to 9:00 PM</strong>, including Sundays, to make wedding shopping convenient for families. We recommend booking a free slot on weekends for dedicated bridal attention.
                </p>
              </div>

              <div className="space-y-2.5 p-5 bg-[#FFF9F0]/60 rounded-xl border border-cream">
                <h4 className="font-serif font-bold text-maroon text-sm flex items-center gap-1.5">
                  <Phone size={16} /> How to Reach & Support
                </h4>
                <p>
                  The outlet is easily accessible by auto-rickshaw and private vehicles from Samastipur Junction (approx 12 mins). Secure parking space is available for customer vehicles. Call us at <strong>+91 62039 09946</strong> for assistance.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Embedded Store Info Map section */}
        <StoreInfo />

      </main>

      <Footer />
    </>
  );
}
