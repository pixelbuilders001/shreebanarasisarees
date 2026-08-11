import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Landmark, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: "Refund Policy | Shree Banarasi Sarees",
  description: "Read the Shree Banarasi Sarees refund policy. Learn about refund audits, credit processing times, and modes of refund.",
  alternates: {
    canonical: "https://shreebanarasisarees.com/refund-policy",
  }
};

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      
      <main className="bg-[#FFF9F0] pb-16">
        {/* Banner */}
        <section className="bg-maroon py-16 px-4 text-center border-b border-gold/30">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="text-xs text-gold uppercase tracking-[0.25em] font-bold block">
              Financial Safety
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ivory tracking-wide">
              Refund Policy
            </h1>
            <div className="w-16 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-light">
              Transparent transactions are our priority. Learn about our refund auditing and processing timelines.
            </p>
          </div>
        </section>

        {/* Policy Body */}
        <section className="py-12 sm:py-16 px-4 max-w-4xl mx-auto">
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-cream shadow-sm space-y-8">
            
            {/* Auditing */}
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-dark-brown">1. Audit & Inspection</h2>
              <div className="w-10 h-0.5 bg-maroon"></div>
              <p className="text-xs sm:text-sm text-dark-brown/80 leading-relaxed font-light">
                Once we receive your returned package at our Samastipur showroom, our master weavers perform a quality check to verify the item is unworn, tag-intact, and unstitched. This audit is completed within <strong>48 hours</strong> of package arrival.
              </p>
            </div>

            {/* Methods */}
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-dark-brown">2. Modes of Refund</h2>
              <div className="w-10 h-0.5 bg-maroon"></div>
              <div className="text-xs sm:text-sm text-dark-brown/80 leading-relaxed space-y-3 font-light">
                <p>Approved refunds are processed through the following payment methods:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li><strong>Original Payment Method:</strong> For prepaid orders (NetBanking, UPI, Credit/Debit cards), the funds are credited directly to the account used for payment.</li>
                  <li><strong>Bank Transfer (NEFT):</strong> For Cash on Delivery (COD) orders, our accounts team will request your bank details (account number, holder name, and IFSC code) to initiate a direct bank transfer.</li>
                  <li><strong>Store Credit Coupon:</strong> If you prefer, we can issue a digital gift coupon worth the full refund amount, valid for 1 year, to use on any future saree purchases.</li>
                </ul>
              </div>
            </div>

            {/* Timelines */}
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-dark-brown flex items-center gap-2">
                <Landmark className="text-maroon" size={22} />
                3. Refund Timelines
              </h2>
              <div className="w-10 h-0.5 bg-maroon"></div>
              <p className="text-xs sm:text-sm text-dark-brown/80 leading-relaxed font-light">
                Once the refund is approved and initiated by our accounts team, it takes approximately <strong>5 to 7 business days</strong> for the bank to process and reflect the transaction in your account. A confirmation email and SMS containing the transaction ID will be sent as soon as the refund is initiated.
              </p>
            </div>

            {/* Deductions */}
            <div className="p-4 bg-maroon/5 rounded-2xl border border-gold/20 flex gap-3 items-start">
              <AlertTriangle className="text-maroon flex-shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-dark-brown text-xs">Exclusions & Fees</h4>
                <p className="text-[11px] sm:text-xs text-dark-brown/70 leading-relaxed font-light">
                  Cash on Delivery (COD) handling service charges (paid directly to the shipping company) and any custom styling fees are non-refundable. Standard free-shipping fees are not deducted; we return the full amount paid for the saree.
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
