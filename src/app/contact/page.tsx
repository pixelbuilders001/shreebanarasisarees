import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { StoreInfo } from '../../components/StoreInfo';
import { Phone, Mail, MapPin, MessageCircle, Send, ShieldCheck } from 'lucide-react';

import { ContactForm } from '../../components/ContactForm';

export const metadata: Metadata = {
  title: "Contact Us | Shree Banarasi Sarees",
  description: "Get in touch with Shree Banarasi Sarees. Call us at +91 62039 09946, chat with us on WhatsApp, or visit our traditional saree showroom in Samastipur, Bihar.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/contact",
  }
};

export default function ContactPage() {
  return (
    <>
      <Header />
      
      <main className="bg-[#FFF9F0] pb-16">
        {/* Banner */}
        <section className="bg-maroon py-16 px-4 text-center border-b border-gold/30">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="text-xs text-gold uppercase tracking-[0.25em] font-bold block">
              Get In Touch
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ivory tracking-wide">
              Contact Shree Banarasi Sarees
            </h1>
            <div className="w-16 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-light">
              Have questions about our weaves, blouse stitching, or custom custom-dye requests? We are here to assist you daily.
            </p>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-12 sm:py-16 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Contact Details (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-gold font-bold uppercase tracking-wider">Quick Channels</span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-dark-brown">
                  Reach Our Customer Care
                </h2>
                <div className="w-10 h-0.5 bg-maroon"></div>
              </div>
              
              <p className="text-xs sm:text-sm text-dark-brown/70 leading-relaxed font-light">
                Whether you prefer to chat on WhatsApp, call us directly, send an email, or visit our physical showroom, we ensure a warm and prompt response.
              </p>

              <div className="space-y-4">
                
                {/* Phone Call Card */}
                <div className="bg-white p-5 rounded-2xl border border-cream flex items-start gap-4 shadow-sm hover:border-gold/35 transition-colors">
                  <div className="p-3 bg-maroon/5 text-maroon rounded-xl flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-dark-brown text-sm">Call Showroom</h3>
                    <p className="text-xs text-dark-brown/75 font-semibold">+91 62039 09946</p>
                    <p className="text-[10px] text-dark-brown/50">Daily support: 10:00 AM – 9:00 PM</p>
                  </div>
                </div>

                {/* WhatsApp Card */}
                <a 
                  href="https://wa.me/+916203909946"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white p-5 rounded-2xl border border-cream flex items-start gap-4 shadow-sm hover:border-[#25D366]/40 transition-colors"
                >
                  <div className="p-3 bg-[#25D366]/5 text-[#25D366] rounded-xl flex-shrink-0">
                    <MessageCircle size={20} className="fill-current" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-dark-brown text-sm flex items-center gap-1.5">
                      WhatsApp Live Chat <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    </h3>
                    <p className="text-xs text-dark-brown/75 font-semibold">+91 62039 09946</p>
                    <p className="text-[10px] text-dark-brown/50">Instant advice from a saree expert</p>
                  </div>
                </a>

                {/* Email Card */}
                <div className="bg-white p-5 rounded-2xl border border-cream flex items-start gap-4 shadow-sm hover:border-gold/35 transition-colors">
                  <div className="p-3 bg-maroon/5 text-maroon rounded-xl flex-shrink-0">
                    <Mail size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-dark-brown text-sm">Email Support</h3>
                    <p className="text-xs text-dark-brown/75 font-semibold">support@shreebanarasisarees.com</p>
                    <p className="text-[10px] text-dark-brown/50">Expect a reply within 24 hours</p>
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-white p-5 rounded-2xl border border-cream flex items-start gap-4 shadow-sm hover:border-gold/35 transition-colors">
                  <div className="p-3 bg-maroon/5 text-maroon rounded-xl flex-shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-dark-brown text-sm">Showroom Address</h3>
                    <p className="text-xs text-dark-brown/75 leading-relaxed">
                      Rudauli Chowk, Harpur Aloth<br />
                      Samastipur, Bihar – 848103
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Contact Form Client Component */}
            <ContactForm />

          </div>
        </section>

        {/* Directions details */}
        <StoreInfo />
      </main>

      <Footer />
    </>
  );
}
