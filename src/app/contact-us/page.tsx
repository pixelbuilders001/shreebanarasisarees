import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { StoreInfo } from '../../components/StoreInfo';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ShieldAlert,
  HelpCircle,
  FileQuestion,
  Sparkles,
  Truck,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Contact Us | Shree Banarasi Sarees - Samastipur Showroom & Support",
  description: "Contact Shree Banarasi Sarees in Samastipur, Bihar. Call or message +91 62039 09946, email shreebanarasi180@gmail.com, or visit our showroom at Rudauli Chowk.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/contact-us",
  },
  openGraph: {
    title: "Contact Us | Shree Banarasi Sarees - Samastipur Showroom & Support",
    description: "Get in touch with Shree Banarasi Sarees customer care or visit our showroom in Samastipur, Bihar.",
    url: "https://shreebanarasisarees.in/contact-us",
    type: "website",
  }
};

export default function ContactUsPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Shree Banarasi Sarees",
    "url": "https://shreebanarasisarees.in/contact-us",
    "mainEntity": {
      "@type": "ClothingStore",
      "name": "Shree Banarasi Sarees",
      "telephone": "+916203909946",
      "email": "shreebanarasi180@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rudauli Chowk, Harpur Aloth",
        "addressLocality": "Samastipur",
        "addressRegion": "Bihar",
        "postalCode": "848103",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <Header />

      <main className="bg-[#FFF9F0] pb-16 text-[#292524]">

        {/* Hero Banner Area */}
        <section className="bg-[#52111C] py-16 px-4 text-center border-b border-[#B08A3C]/30 relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-3 relative z-10">
            <span className="text-xs text-[#D4B870] uppercase tracking-[0.25em] font-bold block font-serif">
              Customer Support &amp; Showroom Desk
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#FAF7F0] tracking-wide">
              Contact Shree Banarasi Sarees
            </h1>
            <div className="w-16 h-0.5 bg-[#B08A3C] mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/85 max-w-xl mx-auto leading-relaxed font-light">
              Whether you have questions regarding our authentic weaves, order status, blouse customization, or wish to plan a showroom visit in Samastipur, our team is here to assist you daily.
            </p>
          </div>
        </section>

        {/* Direct Contact Channels Grid */}
        <section className="py-12 sm:py-16 px-4 max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs text-[#B08A3C] font-bold uppercase tracking-wider font-serif">
              Direct Communication Channels
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#292524]">
              Reach Our Customer Care Directly
            </h2>
            <p className="text-xs sm:text-sm text-[#6B625D]">
              Call, message on WhatsApp, or email us directly. We respond promptly during showroom hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Phone Call Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-2xs hover:border-[#B08A3C]/40 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#6B1725]/10 text-[#6B1725] flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#292524]">Call Showroom</h3>
                  <p className="text-xs text-[#6B625D] mt-0.5">Speak with our sales desk</p>
                </div>
                <p className="text-sm font-bold text-[#6B1725]">
                  <a href="tel:+916203909946" className="hover:underline">+91 62039 09946</a>
                </p>
              </div>
              <div className="pt-2 border-t border-[#F3ECE0] text-[11px] text-[#6B625D] flex items-center gap-1">
                <Clock size={12} className="text-[#B08A3C] shrink-0" />
                <span>10:00 AM – 9:00 PM Daily</span>
              </div>
            </div>

            {/* WhatsApp Card */}
            <a
              href="https://wa.me/+916203909946?text=Namaste!%20I%20have%20an%20enquiry%20regarding%20Shree%20Banarasi%20Sarees."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-2xs hover:border-[#25D366]/50 transition-colors flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageCircle size={20} className="fill-current" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-1.5">
                    WhatsApp Chat
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </h3>
                  <p className="text-xs text-[#6B625D] mt-0.5">Live video drape &amp; styling</p>
                </div>
                <p className="text-sm font-bold text-[#292524]">+91 62039 09946</p>
              </div>
              <div className="pt-2 border-t border-[#F3ECE0] text-[11px] text-[#25D366] font-semibold flex items-center gap-1">
                <span>Chat Now &rarr;</span>
              </div>
            </a>

            {/* Email Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-2xs hover:border-[#B08A3C]/40 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#6B1725]/10 text-[#6B1725] flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#292524]">Official Email</h3>
                  <p className="text-xs text-[#6B625D] mt-0.5">Orders &amp; official queries</p>
                </div>
                <p className="text-xs font-bold text-[#6B1725] break-all">
                  <a href="mailto:shreebanarasi180@gmail.com" className="hover:underline">
                    shreebanarasi180@gmail.com
                  </a>
                </p>
              </div>
              <div className="pt-2 border-t border-[#F3ECE0] text-[11px] text-[#6B625D]">
                <span>Replies within 24 hours</span>
              </div>
            </div>

            {/* Showroom Location Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-2xs hover:border-[#B08A3C]/40 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#6B1725]/10 text-[#6B1725] flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#292524]">Showroom</h3>
                  <p className="text-xs text-[#6B625D] mt-0.5">Visit in person</p>
                </div>
                <p className="text-xs text-[#292524] leading-relaxed font-medium">
                  Rudauli Chowk, Harpur Aloth<br />
                  Samastipur, Bihar – 848103
                </p>
              </div>
              <div className="pt-2 border-t border-[#F3ECE0]">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Shree%20Banarasi%20Sarees%2C%20Rudauli%20Chowk%2C%20Harpur%20Aloth%2C%20Samastipur%2C%20Bihar%20848103"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#6B1725] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Get Directions</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* Enquiry Types & Order Support Instructions */}
        <section className="py-12 bg-white border-y border-[#F3ECE0]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            {/* Types of enquiries */}
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1.5">
                <span className="text-xs text-[#B08A3C] uppercase tracking-wider font-bold font-serif">
                  Customer Assistance
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#292524]">
                  Types of Enquiries We Handle
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-1.5">
                  <div className="text-[#6B1725]"><Sparkles size={18} /></div>
                  <h4 className="font-serif font-bold text-xs text-[#292524]">Saree Fabric &amp; Weave Advice</h4>
                  <p className="text-[11px] text-[#6B625D] leading-relaxed">
                    Need help deciding between Katan Silk, Organza, or Chikankari? Get genuine artisan consultation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-1.5">
                  <div className="text-[#6B1725]"><Truck size={18} /></div>
                  <h4 className="font-serif font-bold text-xs text-[#292524]">Order Tracking &amp; Delivery ETA</h4>
                  <p className="text-[11px] text-[#6B625D] leading-relaxed">
                    Check standard pan-India dispatch updates or local Samastipur 20-minute express serviceability.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-1.5">
                  <div className="text-[#6B1725]"><RotateCcw size={18} /></div>
                  <h4 className="font-serif font-bold text-xs text-[#292524]">Returns, Exchanges &amp; Refunds</h4>
                  <p className="text-[11px] text-[#6B625D] leading-relaxed">
                    Initiate a 3-day return or exchange for unworn, unstitched sarees in original brand packaging.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-1.5">
                  <div className="text-[#6B1725]"><HelpCircle size={18} /></div>
                  <h4 className="font-serif font-bold text-xs text-[#292524]">Bridal Trousseau &amp; Bulk Orders</h4>
                  <p className="text-[11px] text-[#6B625D] leading-relaxed">
                    Planning a wedding in Bihar? Schedule exclusive bridal trials or bulk family gift packages.
                  </p>
                </div>
              </div>
            </div>

            {/* Order-Related Support Instructions & Grievance Officer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#F3ECE0]">

              {/* Order Support Guidelines */}
              <div className="p-5 sm:p-6 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-3">
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524] flex items-center gap-2">
                  <FileQuestion size={18} className="text-[#6B1725]" />
                  Order-Related Support Instructions
                </h4>
                <p className="text-xs text-[#6B625D] leading-relaxed">
                  To ensure our support desk can investigate and resolve your enquiry without delay, please have the following details ready when reaching out:
                </p>
                <ul className="text-xs text-[#292524]/85 space-y-1.5 list-disc pl-5 leading-relaxed">
                  <li><strong>Order ID:</strong> Stated in your order confirmation SMS, invoice PDF, or My Account page.</li>
                  <li><strong>Registered Mobile Number:</strong> The 10-digit number entered during checkout.</li>
                  <li><strong>Description:</strong> Brief details of what you need assistance with (e.g. delivery date, exchange).</li>
                  <li><strong>Photos or Video:</strong> For damaged/defective package queries, attach clear photos/videos of the package and saree upon unboxing within 48 hours.</li>
                </ul>
              </div>

              {/* Grievance Officer Information */}
              <div className="p-5 sm:p-6 bg-[#FFF9F0] rounded-2xl border border-[#B08A3C]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-[#6B1725]" />
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">
                    Statutory Grievance Redressal
                  </h4>
                </div>
                <p className="text-xs text-[#6B625D] leading-relaxed">
                  In compliance with the Consumer Protection (E-Commerce) Rules, 2020 and Information Technology Act, you may escalate unresolved consumer complaints to our appointed Grievance Officer:
                </p>
                <div className="text-xs text-[#292524] bg-white p-3.5 rounded-xl border border-[#E5DEC9] space-y-1">
                  <p><strong>Name:</strong> Rajeev kumar sharma</p>
                  <p><strong>Designation:</strong> Grievance Officer</p>
                  <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline font-medium">shreebanarasi180@gmail.com</a></p>
                  <p><strong>Phone:</strong> +91 62039 09946</p>
                  <p><strong>Address:</strong> Shree Banarasi Sarees, Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103</p>
                </div>
                <p className="text-[11px] text-[#6B625D]">
                  Statutory commitment: Grievances are acknowledged within 48 hours and redressed within 30 days. For full details, visit our <Link href="/grievance-redressal" className="text-[#6B1725] underline font-semibold">Grievance Redressal page</Link>.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* Embedded Map & Showroom Directions */}
        <StoreInfo />

      </main>

      <Footer />
    </>
  );
}
