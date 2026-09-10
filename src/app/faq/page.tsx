import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import {
  HelpCircle,
  ChevronRight,
  MessageCircle,
  MapPin,
  Truck,
  RotateCcw,
  ShieldCheck,
  Phone,
  Sparkles,
  CreditCard
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Shree Banarasi Sarees",
  description: "Find answers to all your questions about Shree Banarasi Sarees: Samastipur showroom location, 20-minute local delivery, pan-India shipping, COD, 3-day returns, and handloom authenticity.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQ) | Shree Banarasi Sarees",
    description: "Get quick answers regarding authentic Banarasi sarees, 20-minute quick delivery in Samastipur, payment options, and returns.",
    url: "https://shreebanarasisarees.in/faq",
    type: "website",
  }
};

export default function FaqPage() {
  const faqCategories = [
    {
      categoryName: "Store Location & Physical Visits",
      icon: MapPin,
      questions: [
        {
          q: "Where is Shree Banarasi Sarees located?",
          a: "Shree Banarasi Sarees is located at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India. Our showroom is prominently situated along the main highway route and is easily accessible from Samastipur Junction (~12 minutes)."
        },
        {
          q: "Do you have a physical store?",
          a: "Yes! We operate a full-scale physical retail showroom in Samastipur, Bihar. It houses hundreds of authentic handloom Banarasi silk sarees, bridal lehenga sarees, festive Chikankari, Gujarati Bandhani, and contemporary organza drapes."
        },
        {
          q: "Can I visit the store?",
          a: "Absolutely! We welcome walk-in customers and families daily. Our showroom hours are Monday to Sunday from 10:00 AM to 9:00 PM (including Sundays). You can inspect the fabrics in natural daylight, test the drape, and avail in-person styling consultations."
        }
      ]
    },
    {
      categoryName: "Online Shopping & Product Availability",
      icon: Sparkles,
      questions: [
        {
          q: "Do you sell sarees online?",
          a: "Yes, our complete live inventory is available for online purchase on this website (shreebanarasisarees.in). You can browse by fabric, color, occasion, or price, add sarees to your bag, and order with Cash on Delivery and doorstep inspection."
        },
        {
          q: "How can I know whether a product is available?",
          a: "Every saree listed on our website is synced with our Samastipur showroom shelves. If a saree shows an active 'Add to Bag' button, it is currently in stock. If an item is sold out, it will be marked as 'Out of Stock' with an option to receive a notification or enquire via WhatsApp."
        },
        {
          q: "Are Banarasi sarees handmade?",
          a: "Yes, our genuine Banarasi silk sarees are woven on traditional pit looms and jacquard handlooms in artisan clusters of Varanasi. Authentic handloom sarees possess subtle weave variations and soft zari edges that distinguish them from mass-produced synthetic replicas."
        },
        {
          q: "Why can saree colours look slightly different?",
          a: "Natural silk yarns and metallic zari reflect light dynamically. While we photograph all sarees in dedicated studio lighting without artificial beautification filters, slight visual differences may occur due to varying smartphone/computer display color temperatures, brightness levels, and ambient lighting."
        }
      ]
    },
    {
      categoryName: "Delivery & 20-Minute Local Quick Delivery",
      icon: Truck,
      questions: [
        {
          q: "Do you deliver in Samastipur?",
          a: "Yes! We provide dedicated local delivery across Samastipur town and surrounding eligible local pin codes (such as 848103, 848101, etc.), including rapid local delivery dispatched straight from our Rudauli Chowk showroom."
        },
        {
          q: "Do you offer 20-minute delivery?",
          a: "Yes, we offer approximately 20-minute local quick delivery for eligible local addresses within our designated showroom delivery radius during operating hours (10:00 AM to 9:00 PM IST). Please note that 20-minute delivery is an operational estimate and service, not an unconditional guarantee; delivery times may vary based on local distance, order volumes, inventory packing, traffic, and adverse weather conditions."
        },
        {
          q: "Where is 20-minute delivery available?",
          a: "Local 20-minute quick delivery is available within selected areas and radial distances surrounding our Rudauli Chowk showroom in Samastipur, Bihar. You can check serviceability by entering your 6-digit pin code on any product page or in your checkout bag."
        },
        {
          q: "Do you deliver outside Samastipur?",
          a: "Yes, we ship across all districts in Bihar and to all serviceable pin codes across India. Domestic deliveries are fulfilled using premier express courier partners like BlueDart, SpeedPost, and Delhivery. Standard delivery within Bihar typically takes 2 to 3 business days; delivery to other Indian states takes 4 to 7 business days."
        },
        {
          q: "How can I track my order?",
          a: "Once your order is confirmed and dispatched, you will receive an SMS and WhatsApp update with your courier consignment number or local rider tracking information. Registered users can also track live order status anytime by visiting the 'My Account' or 'Track Order' section on our website."
        }
      ]
    },
    {
      categoryName: "Payments & Pricing",
      icon: CreditCard,
      questions: [
        {
          q: "What payment methods are supported?",
          a: "We currently support Cash on Delivery (COD) across our delivery network with open-box doorstep verification. When online prepaid gateways are active, we also accept UPI (Google Pay, PhonePe, Paytm), Net Banking, and Debit/Credit Cards. All online transactions are processed through 256-bit SSL encrypted, RBI-authorized gateways. We never ask for or store your card CVV, ATM PIN, or UPI PIN."
        }
      ]
    },
    {
      categoryName: "Returns, Refunds & Cancellations",
      icon: RotateCcw,
      questions: [
        {
          q: "Can I cancel my order?",
          a: "Yes, you can cancel your order free of charge before it has been dispatched from our showroom. Simply visit your 'My Account' page or message us on WhatsApp (+91 62039 09946) with your Order ID. Once an order is already out with the delivery rider or courier partner, cancellation in flight is not possible; you may decline delivery at the doorstep."
        },
        {
          q: "Can I return a saree?",
          a: "Yes. We offer a transparent 3-day return policy from the date of delivery. To be eligible for a return, the saree must be completely unworn, unwashed, and in its original folding and brand packaging with all tags and security seals intact. Sarees with custom blouse tailoring, custom fall/pico stitching, or altered edges are customized items and cannot be returned."
        },
        {
          q: "Can I exchange a product?",
          a: "Yes, you can request an exchange for another saree or design within 3 days of delivery. Once the original unworn saree arrives at our Samastipur showroom and passes quality inspection, we will immediately dispatch your replacement saree or issue store credit for your purchase."
        },
        {
          q: "What happens if I receive a damaged/wrong product?",
          a: "We take rigorous care in quality inspection before packing. However, in the rare event that you receive a damaged, defective, or incorrect saree, please notify us within 48 hours of delivery by WhatsApp (+91 62039 09946) or email (shreebanarasi180@gmail.com). Please share photos or a short unboxing video of the package. We will arrange an immediate priority replacement or a 100% full refund at no cost to you."
        },
        {
          q: "How long do refunds take?",
          a: "Once your return is received at our Samastipur showroom, our master weavers complete the quality audit within 48 hours. Upon approval, refunds are processed via direct bank transfer (NEFT/UPI) for COD orders or back to the original payment source for prepaid orders. The amount typically reflects in your bank account within 5 to 7 business days."
        }
      ]
    },
    {
      categoryName: "Customer Support & Grievances",
      icon: HelpCircle,
      questions: [
        {
          q: "How do I contact support?",
          a: "You can reach our customer care desk via WhatsApp or phone call at +91 62039 09946 daily between 10:00 AM and 9:00 PM IST. You can also email us at shreebanarasi180@gmail.com or visit our showroom at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar."
        },
        {
          q: "How do I make a formal complaint?",
          a: "If you have an unresolved issue or wish to lodge a formal complaint under the Consumer Protection (E-Commerce) Rules, 2020, you may write directly to our appointed Grievance Officer, Rajeev kumar sharma, at shreebanarasi180@gmail.com or call +91 62039 09946. In accordance with applicable law, all formal complaints are acknowledged within 48 hours and resolved within 30 days."
        }
      ]
    }
  ];

  const allFaqItems = faqCategories.flatMap(c => c.questions);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

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
        "name": "FAQ",
        "item": "https://shreebanarasisarees.in/faq"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main className="bg-[#FFF9F0] pb-16 text-[#292524]">

        {/* Hero Banner Area */}
        <section className="bg-[#52111C] py-16 px-4 text-center border-b border-[#B08A3C]/30 relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-3 relative z-10">
            <span className="text-xs text-[#D4B870] uppercase tracking-[0.25em] font-bold block font-serif">
              Help Center &amp; Common Enquiries
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#FAF7F0] tracking-wide">
              Frequently Asked Questions
            </h1>
            <div className="w-16 h-0.5 bg-[#B08A3C] mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/85 max-w-xl mx-auto leading-relaxed font-light">
              Clear answers regarding our Samastipur showroom, 20-minute local delivery, pan-India courier shipping, Cash on Delivery, and handloom authenticity.
            </p>
          </div>
        </section>

        {/* FAQ Categories & Native Accordions */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
          {faqCategories.map((category, idx) => {
            const IconComponent = category.icon;
            return (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#E5DEC9] pb-2.5">
                  <div className="p-1.5 rounded-lg bg-[#6B1725]/10 text-[#6B1725]">
                    <IconComponent size={18} />
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524] tracking-wide">
                    {category.categoryName}
                  </h2>
                </div>

                <div className="space-y-3">
                  {category.questions.map((faq, qIdx) => (
                    <details
                      key={qIdx}
                      className="group bg-white rounded-2xl border border-[#E5DEC9] overflow-hidden shadow-2xs transition-all duration-200 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary
                        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer text-xs sm:text-sm font-bold text-[#292524] hover:bg-[#FFF9F0]/60 select-none transition-colors"
                      >
                        <span className="pr-4 font-serif text-[13px] sm:text-[15px] font-semibold text-[#292524]">
                          {faq.q}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#FAF7F0] group-open:bg-[#6B1725] group-open:text-white flex items-center justify-center shrink-0 transition-colors">
                          <ChevronRight
                            size={14}
                            className="text-[#B08A3C] group-open:text-white group-open:rotate-90 transition-transform"
                          />
                        </div>
                      </summary>
                      <div
                        className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[#6B625D] leading-relaxed font-light border-t border-[#F3ECE0] bg-[#FFF9F0]/20"
                      >
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}

          {/* WhatsApp Support Block */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DEC9] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#6B1725]/10 flex items-center justify-center text-[#6B1725] shrink-0">
                <HelpCircle size={26} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#292524]">
                  Still have questions?
                </h4>
                <p className="text-xs text-[#6B625D]">
                  Connect directly with our Samastipur showroom team on WhatsApp for instant guidance.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/+916203909946?text=Namaste!%20I%20have%20a%20question%20not%20answered%20in%20the%20FAQ."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-serif font-bold text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 shrink-0"
            >
              <MessageCircle size={15} className="fill-current" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

        </section>
      </main>

      <Footer />
    </>
  );
}
