import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Truck, Clock, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: "Shipping & Delivery Information | Shree Banarasi Sarees",
  description: "Learn about Shree Banarasi Sarees shipping rules, timelines, domestic free delivery details, and premium packaging policies.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/shipping",
  }
};

export default function ShippingPage() {
  return (
    <>
      <Header />
      
      <main className="bg-[#FFF9F0] pb-16">
        {/* Banner */}
        <section className="bg-maroon py-16 px-4 text-center border-b border-gold/30">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="text-xs text-gold uppercase tracking-[0.25em] font-bold block">
              Fulfillment Policies
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ivory tracking-wide">
              Shipping & Delivery
            </h1>
            <div className="w-16 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-light">
              We make sure that your heirloom sarees are handled with care and delivered safely to your doorstep.
            </p>
          </div>
        </section>

        {/* Shipping details */}
        <section className="py-12 sm:py-16 px-4 max-w-5xl mx-auto">
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-cream shadow-sm space-y-8">
            
            {/* Header info */}
            <div className="border-b border-cream pb-6 space-y-3 text-center sm:text-left">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-dark-brown">
                Domestic & International Shipping
              </h2>
              <div className="w-10 h-0.5 bg-maroon mx-auto sm:mx-0"></div>
              <p className="text-xs sm:text-sm text-dark-brown/70 leading-relaxed font-light">
                Every saree in our collection represents days of manual craftsmanship. To match that, we partner with reliable express couriers to deliver them safely.
              </p>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-cream/10 border border-cream/50 space-y-2">
                <Truck className="text-maroon" size={24} />
                <h3 className="font-serif font-bold text-dark-brown text-sm">Free India Delivery</h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-light">We offer 100% free standard shipping across all pin codes in India with no minimum order values.</p>
              </div>
              <div className="p-5 rounded-2xl bg-cream/10 border border-cream/50 space-y-2">
                <Clock className="text-maroon" size={24} />
                <h3 className="font-serif font-bold text-dark-brown text-sm">Express Transit</h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-light">Orders within Bihar arrive in 2-3 business days. Deliveries to Delhi, Mumbai, Bengaluru and other states take 4-7 business days.</p>
              </div>
              <div className="p-5 rounded-2xl bg-cream/10 border border-cream/50 space-y-2">
                <Sparkles className="text-maroon" size={24} />
                <h3 className="font-serif font-bold text-dark-brown text-sm">Crease-Free Packing</h3>
                <p className="text-xs text-dark-brown/65 leading-relaxed font-light">Sarees are packed in hard moisture-proof boxes wrapped in soft tissue to prevent gold zari creases.</p>
              </div>
            </div>

            {/* Timelines list */}
            <div className="space-y-4 pt-4 border-t border-cream">
              <h3 className="font-serif text-lg font-bold text-dark-brown">Detailed Delivery Timelines</h3>
              
              <div className="space-y-3.5 text-xs sm:text-sm text-dark-brown/80 font-light leading-relaxed">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Standard In-Stock Sarees:</strong> We pack and dispatch in-stock items from our Samastipur showroom within 24 to 48 hours of order confirmation.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Custom Tailoring & Blouse Fall/Pico:</strong> If you request custom blouse tailoring, fall stitching, or edge pico, please allow an additional <strong>3 to 5 business days</strong> for dispatch.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>International Deliveries:</strong> We ship worldwide using Express DHL or FedEx. International shipping flat rates are calculated at checkout. Transit times are <strong>10 to 15 business days</strong>, subject to customs clearance.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-maroon flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Showroom Pick-up (Samastipur Outlet):</strong> You can select "Pick up from Samastipur Showroom" at checkout. The saree will be steamed, packed, and kept ready for collection within 4 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Note */}
            <div className="p-4 bg-maroon/5 rounded-2xl border border-gold/20 flex gap-3.5 items-start">
              <ShieldAlert className="text-maroon flex-shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-dark-brown text-xs">Real-Time Tracking & Customs duties</h4>
                <p className="text-[11px] sm:text-xs text-dark-brown/70 leading-relaxed font-light">
                  A unique tracking number will be texted and emailed to you as soon as the package leaves our showroom. For international shipments, any local custom duties or import taxes levied at the port of entry are paid directly by the buyer.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
