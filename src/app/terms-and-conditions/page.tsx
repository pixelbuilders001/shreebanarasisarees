import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  FileText,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Sparkles,
  Truck,
  CreditCard,
  RotateCcw,
  Landmark
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Terms and Conditions | Shree Banarasi Sarees",
  description: "Read the official Terms and Conditions of Shree Banarasi Sarees (Samastipur, Bihar). Clear guidelines on website usage, saree purchases, 20-minute delivery, returns, and governing Indian laws.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/terms-and-conditions",
  },
  openGraph: {
    title: "Terms and Conditions | Shree Banarasi Sarees",
    description: "Official contractual terms, purchasing conditions, delivery terms, and customer rights governing Shree Banarasi Sarees.",
    url: "https://shreebanarasisarees.in/terms-and-conditions",
    type: "website",
  }
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      badge="Legal Contract & Terms"
      title="Terms &amp; Conditions"
      subtitle="The contractual terms and legal conditions governing your use of Shree Banarasi Sarees website, products, and services under Indian law."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Legal" },
        { label: "Terms & Conditions" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            Welcome to <strong>Shree Banarasi Sarees</strong> (&quot;Website&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Customer&quot;, or &quot;you&quot;) and <strong>Shree Banarasi Sarees</strong>, having its principal showroom and registered operations at <strong>Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</strong>, holding GSTIN <strong>10AGAFS4190H1Z8</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#B08A3C]/30 space-y-1">
            <span className="font-serif font-bold text-xs text-[#6B1725] uppercase tracking-wider block">
              Consumer Protection Affirmation
            </span>
            <p className="text-xs text-[#6B625D]">
              Nothing in these Terms is intended to disclaim, restrict, or remove any non-waivable statutory rights granted to consumers under the <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
            </p>
          </div>
        </div>

        {/* 1. Acceptance & User Eligibility */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Scale className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. User Eligibility &amp; Agreement Acceptance
            </h2>
          </div>
          <p className="text-[#6B625D]">
            By accessing our website, registering an account, or placing an order, you represent that you are at least <strong>18 years of age</strong> and legally competent to enter into a binding contract under the <strong>Indian Contract Act, 1872</strong>. If you are accessing this site on behalf of a minor, you do so as their legal guardian and assume full legal responsibility.
          </p>
        </section>

        {/* 2. Account Registration & Security */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. User Accounts &amp; Authentication
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Accurate Information:</strong> When signing in via Google OAuth or updating your profile, you agree to provide truthful, accurate, and current contact details.
            </p>
            <p>
              &bull; <strong>Credential Confidentiality:</strong> You are responsible for maintaining the security of your Google account credentials and active storefront sessions. You agree to notify us immediately if you suspect unauthorized access to your account.
            </p>
            <p>
              &bull; <strong>Prohibited Activities:</strong> Users are strictly prohibited from using automated scripts/bots to scrape pricing, placing fraudulent Cash on Delivery orders, injecting malicious code, or impersonating other individuals.
            </p>
          </div>
        </section>

        {/* 3. Product Descriptions & Textile Characteristics */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Handloom Authenticity &amp; Product Representation
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-3">
            <p>
              <strong>Handcrafted Variations:</strong> Our collections feature authentic handloom sarees sourced from master weavers. Handloom weaving inherently contains minor variations in thread tension, subtle yarn slubs, and soft zari irregularities. These are the hallmark characteristics of genuine Indian craftsmanship and shall not be deemed defects.
            </p>
            <p>
              <strong>Color Representation:</strong> We photograph actual garments under studio lighting. However, because display screens, device color gamuts (sRGB, DCI-P3), and ambient room lighting vary significantly, slight visual differences in fabric color or zari luster may occur.
            </p>
          </div>
        </section>

        {/* 4. Pricing, Orders & Acceptance */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <CreditCard className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. Pricing, Orders &amp; Contract Formation
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Pricing &amp; GST:</strong> All prices listed on the website are in Indian Rupees (INR) and are inclusive of applicable GST (5% under HSN 5208).
            </p>
            <p>
              &bull; <strong>Order Acceptance:</strong> Receipt of an automated order confirmation via SMS or website does not constitute a legally binding acceptance of your order. A binding sale contract is formed only upon physical dispatch of the parcel from our Samastipur showroom.
            </p>
            <p>
              &bull; <strong>Pricing Errors:</strong> In the event of a genuine typographical or database technical error resulting in an incorrect price listing, Shree Banarasi Sarees reserves the right to cancel the order and issue a 100% immediate refund.
            </p>
          </div>
        </section>

        {/* 5. Delivery & 20-Minute Local Quick Delivery Terms */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Truck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              5. Delivery Terms &amp; 20-Minute Local Service
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-3">
            <p>
              <strong>Pan-India Shipping:</strong> Deliveries across Bihar and other Indian states are fulfilled through licensed courier partners (SpeedPost, BlueDart, Delhivery) within standard estimated timelines (2&ndash;7 business days).
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1">
              <strong className="font-serif font-bold uppercase">20-Minute Local Quick Delivery Terms:</strong>
              <p>
                Our ~20-minute local delivery is an <strong>eligibility-based service and operational estimate</strong> applicable strictly to serviceable local zones in Samastipur, Bihar, during active operational showroom hours (10:00 AM &ndash; 9:00 PM). It is <strong>not an unconditional guarantee</strong>. Transit times remain subject to local distance, traffic bottlenecks, rail crossings, adverse weather, and order volumes.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Returns, Exchanges & Cancellations */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              6. Returns, Exchanges &amp; Cancellations
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>3-Day Return Window:</strong> Eligible, unworn, unstitched sarees with original brand tags and packaging may be returned or exchanged within <strong>3 calendar days</strong> of delivery. Full rules are set out in our <Link href="/returns-refunds" className="text-[#6B1725] underline font-semibold">Returns &amp; Refunds Policy</Link>.
            </p>
            <p>
              &bull; <strong>Customized Exclusions:</strong> Sarees with custom blouse tailoring, custom cut sleeves, or fall/pico stitched upon request are custom-made goods and are non-returnable.
            </p>
            <p>
              &bull; <strong>Order Cancellation:</strong> You may cancel an order free of charge before it is dispatched from our showroom. In-transit parcels cannot be cancelled mid-route as set out in our <Link href="/cancellation-policy" className="text-[#6B1725] underline font-semibold">Cancellation Policy</Link>.
            </p>
          </div>
        </section>

        {/* 7. Intellectual Property Rights */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <FileText className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              7. Intellectual Property Rights
            </h2>
          </div>
          <p className="text-[#6B625D]">
            All content appearing on this website — including brand logos, graphics, product photography, product descriptions, website layouts, and source code — is the exclusive intellectual property of <strong>Shree Banarasi Sarees</strong> and is protected under the <strong>Indian Copyright Act, 1957</strong> and trademark laws. Unauthorized copying, reproduction, commercial redistribution, or hotlinking of our images is strictly prohibited and subject to civil and criminal legal action.
          </p>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              8. Limitation of Liability
            </h2>
          </div>
          <p className="text-[#6B625D]">
            To the maximum extent permitted under applicable Indian law:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#6B625D]">
            <li>Shree Banarasi Sarees shall not be liable for any indirect, incidental, or consequential damages resulting from website downtime, server outages, or courier transit delays caused by force majeure events.</li>
            <li>Our total aggregate financial liability to you in connection with any product purchased through this website shall not exceed the actual price paid by you for the specific saree giving rise to the claim.</li>
            <li>Nothing in this clause shall limit our liability for death, personal injury caused by gross negligence, fraudulent misrepresentation, or any other liability that cannot legally be excluded under Indian consumer law.</li>
          </ul>
        </section>

        {/* 9. Governing Law & Jurisdiction */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Landmark className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              9. Governing Law &amp; Dispute Resolution
            </h2>
          </div>
          <p className="text-[#6B625D]">
            These Terms, and all disputes arising out of or in connection with orders placed on our website, shall be governed by, interpreted, and construed in accordance with the <strong>laws of the Republic of India</strong>. The competent courts located in <strong>Samastipur, Bihar</strong> shall have exclusive territorial and subject-matter jurisdiction.
          </p>
        </section>

        {/* 10. Contact Information */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            10. Inquiries &amp; Legal Notices
          </h2>
          <p className="text-[#6B625D]">
            For legal notices, inquiries regarding these terms, or business correspondence, contact us at:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-1 text-xs text-[#292524]">
            <p><strong>Business Name:</strong> Shree Banarasi Sarees</p>
            <p><strong>GSTIN:</strong> 10AGAFS4190H1Z8</p>
            <p><strong>Physical Address:</strong> Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</p>
            <p><strong>Phone / WhatsApp:</strong> +91 62039 09946</p>
            <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline">shreebanarasi180@gmail.com</a></p>
            <p><strong>Store Hours:</strong> Open Daily: 10:00 AM – 9:00 PM (Open on Sundays)</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
