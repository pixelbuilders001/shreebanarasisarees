import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { HelpCircle, ChevronRight, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQs) | Shree Banarasi Sarees",
  description: "Find answers to frequently asked questions about authentic Banarasi silks, custom blouse stitching, free shipping, returns, and Samastipur showroom hours.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/faqs",
  }
};

export default function FaqsPage() {
  const faqCategories = [
    {
      title: "Authenticity & Fabrics",
      questions: [
        {
          q: "Are the sarees sold by Shree Banarasi Sarees authentic handlooms?",
          a: "Yes, 100%. We source our sarees directly from traditional artisan clusters. Our pure silk Banarasi sarees are certified by the Geographical Indication (GI) registry and feature real gold/silver electroplated zari weaves rather than polyester chemical replicas."
        },
        {
          q: "How can I test the authenticity of my Katan Silk Saree?",
          a: "You can perform a simple burn test on a loose thread: pure silk burns slowly, smells like burnt hair, and leaves a soft gray ash. Synthetic fibers melt quickly, smell like chemicals, and form a hard black bead."
        },
        {
          q: "What is Katan Silk?",
          a: "Katan is a type of pure silk fabric created by twisting together filaments of silk to create a durable, highly lustrous, and fine thread. It is the premier fabric choice for premium wedding Banarasi sarees."
        }
      ]
    },
    {
      title: "Customization & Sizing",
      questions: [
        {
          q: "Do you offer custom blouse tailoring and fall/pico service?",
          a: "Yes, we provide custom sizing support. You can register custom measurements, choose neck styles, and request fall/pico stitching. Our master weavers and tailors handle the customizations before dispatch."
        },
        {
          q: "Can I request custom-dye colors for a saree?",
          a: "Yes! If you would like a specific saree design dyed in a custom color palette, please contact us on WhatsApp (+91 62039 09946) or use the Custom Request tab in your Account page."
        }
      ]
    },
    {
      title: "Shipping & Returns",
      questions: [
        {
          q: "Is shipping free in India?",
          a: "Yes, standard shipping is completely free across all pin codes in India. We do not charge any delivery markup or courier fees."
        },
        {
          q: "Do you ship internationally?",
          a: "Yes, we ship to over 150 countries using DHL Express and FedEx. International shipping rates are calculated at checkout based on weight and country."
        },
        {
          q: "What is your return policy?",
          a: "We offer a 7-day return and exchange policy for unstitched, unworn sarees in original brand packaging. Customized sarees with pre-stitched blouses or fall/pico edges are not eligible for returns."
        }
      ]
    },
    {
      title: "Showroom & Location",
      questions: [
        {
          q: "Where is your physical showroom located?",
          a: "Our showroom is located at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar - 848103. We are open daily from 10:00 AM to 9:00 PM."
        },
        {
          q: "Can I buy online and pick up my saree at the showroom?",
          a: "Yes. Choose the 'Showroom Pickup' option during online checkout, and we will keep the saree ready, ironed, and boxed for you to pick up within 4 hours."
        }
      ]
    }
  ];

  return (
    <>
      <Header />
      
      <main className="bg-[#FFF9F0] pb-16">
        {/* Banner */}
        <section className="bg-maroon py-16 px-4 text-center border-b border-gold/30">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="text-xs text-gold uppercase tracking-[0.25em] font-bold block">
              Quick Answers
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ivory tracking-wide">
              Frequently Asked Questions
            </h1>
            <div className="w-16 h-0.5 bg-gold mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-light">
              Find answers regarding loom certificates, customization, shipping times, and our Samastipur showroom.
            </p>
          </div>
        </section>

        {/* FAQ Categories & Native Accordion details */}
        <section className="py-12 sm:py-16 px-4 max-w-4xl mx-auto space-y-12">
          {faqCategories.map((category, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-dark-brown border-b border-cream pb-2 tracking-wide">
                {category.title}
              </h2>
              
              <div className="space-y-3">
                {category.questions.map((faq, qIdx) => (
                  <details 
                    key={qIdx} 
                    className="group bg-white rounded-xl border border-cream overflow-hidden transition-all duration-200 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary 
                      className="flex items-center justify-between p-4 cursor-pointer text-xs sm:text-sm font-bold text-dark-brown hover:bg-cream/5 select-none transition-colors"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronRight 
                        size={16} 
                        className="text-gold group-open:rotate-90 transition-transform flex-shrink-0"
                      />
                    </summary>
                    <div 
                      className="p-4 pt-0 text-xs sm:text-sm text-dark-brown/70 leading-relaxed font-light border-t border-cream bg-[#FFF9F0]/10"
                    >
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* WhatsApp Support block */}
          <div className="bg-white p-6 rounded-2xl border border-cream shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-3 items-center">
              <HelpCircle className="text-maroon flex-shrink-0" size={26} />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-dark-brown block">Still have questions?</span>
                <span className="text-[10px] text-dark-brown/60">Connect directly with a showroom representative via WhatsApp.</span>
              </div>
            </div>
            <a 
              href="https://wa.me/+916203909946"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-2.5 px-5 bg-[#25D366] text-white rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-[#20ba5a] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={14} className="fill-current" />
              Chat on WhatsApp
            </a>
          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}
