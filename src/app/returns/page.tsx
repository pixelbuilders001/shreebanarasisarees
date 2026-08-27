import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { RefreshCw, CheckSquare, AlertTriangle, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Returns & Exchanges Policy | Shree Banarasi Sarees",
  description: "Read the Shree Banarasi Sarees 7-day return policy, exchange conditions, and custom order exclusions.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/returns",
  }
};

export default function ReturnsPage() {
  return (
    <>
      <Header />
      
      <main className="bg-[#FFF9F0] pb-16">
        {/* Banner */}
        <section className="bg-maroon py-16 px-4 text-center border-b border-gold/30">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="text-xs text-gold uppercase tracking-[0.25em] font-bold block">
              Customer Reassurance
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ivory tracking-wide">
              Returns & Exchanges
            </h1>
            <div className="w-16 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-light">
              Your satisfaction is our priority. Read our straightforward guidelines on returns and saree exchanges.
            </p>
          </div>
        </section>

        {/* Policy Body */}
        <section className="py-12 sm:py-16 px-4 max-w-4xl mx-auto">
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-cream shadow-sm space-y-8">
            
            {/* Intro */}
            <div className="border-b border-cream pb-6 space-y-3 text-center sm:text-left">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-dark-brown">
                7-Day Returns Policy
              </h2>
              <div className="w-10 h-0.5 bg-maroon mx-auto sm:mx-0"></div>
              <p className="text-xs sm:text-sm text-dark-brown/70 leading-relaxed font-light">
                We take pride in the quality of our handloom sarees. If you are not completely satisfied with your purchase, you can return or exchange the item within <strong>7 days</strong> of delivery.
              </p>
            </div>

            {/* Steps & Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Eligibility */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-dark-brown text-base flex items-center gap-2">
                  <CheckSquare className="text-maroon" size={18} />
                  Eligibility Conditions
                </h3>
                <ul className="text-xs text-dark-brown/85 space-y-2.5 font-light leading-relaxed list-disc pl-4">
                  <li>The saree must be completely unworn, unwashed, and in original brand packaging.</li>
                  <li>All original product tags, security labels, and loom certificates must remain attached.</li>
                  <li>The request must be initiated within 7 calendar days of receipt.</li>
                  <li>For local buyers, items can be returned directly to our Samastipur showroom.</li>
                </ul>
              </div>

              {/* Exclusions */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-dark-brown text-base flex items-center gap-2">
                  <AlertTriangle className="text-maroon" size={18} />
                  Non-Returnable Items
                </h3>
                <ul className="text-xs text-dark-brown/85 space-y-2.5 font-light leading-relaxed list-disc pl-4">
                  <li>Sarees with custom blouse tailoring or custom-cut sleeves.</li>
                  <li>Sarees that have already had the fall and pico edges stitched.</li>
                  <li>Custom-dye requests or specialized yarn modifications.</li>
                  <li>Sarees purchased during final clearance offers or end-of-season sales.</li>
                </ul>
              </div>

            </div>

            {/* Exchange flow */}
            <div className="pt-6 border-t border-cream space-y-4">
              <h3 className="font-serif text-lg font-bold text-dark-brown flex items-center gap-2">
                <RefreshCw className="text-maroon" size={20} />
                How to Request an Exchange
              </h3>
              
              <div className="text-xs sm:text-sm text-dark-brown/80 font-light leading-relaxed space-y-3">
                <p>
                  <strong>Step 1:</strong> Email us at <strong>returns@shreebanarasisarees.in</strong> or message us on WhatsApp at <strong>+91 62039 09946</strong> with your Order ID and photos showing the unstitched condition.
                </p>
                <p>
                  <strong>Step 2:</strong> Once approved, package the saree securely. You can send it back to our Samastipur outlet using any major courier (BlueDart, SpeedPost).
                </p>
                <p>
                  <strong>Step 3:</strong> Once received and checked by our weaver team, we will issue a store credit coupon code or ship your requested exchange saree immediately.
                </p>
              </div>
            </div>

            {/* Support promo */}
            <div className="p-5 bg-cream/15 rounded-2xl border border-cream/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 items-center">
                <HelpCircle className="text-maroon" size={24} />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-dark-brown block">Have any questions about returns?</span>
                  <span className="text-[10px] text-dark-brown/60">Our support desk is happy to assist you.</span>
                </div>
              </div>
              <Link 
                href="/contact"
                className="w-full sm:w-auto py-2 px-5 bg-maroon text-ivory text-center rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Contact Support
              </Link>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
