import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  AlertTriangle,
  Camera,
  Sparkles,
  Truck,
  FileCode,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Legal Disclaimer | Shree Banarasi Sarees",
  description: "Read the official legal and product disclaimer for Shree Banarasi Sarees. Clear disclosures regarding handloom variations, screen colors, delivery estimates, and consumer rights.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/disclaimer",
  },
  openGraph: {
    title: "Legal Disclaimer | Shree Banarasi Sarees",
    description: "Important product, textile, delivery, and website disclaimers for Shree Banarasi Sarees.",
    url: "https://shreebanarasisarees.in/disclaimer",
    type: "website",
  }
};

export default function DisclaimerPage() {
  return (
    <PolicyLayout
      badge="Transparency & Notices"
      title="Website &amp; Product Disclaimer"
      subtitle="Important disclosures concerning handloom textile characteristics, photographic representations, delivery estimates, and technical operations."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Legal" },
        { label: "Disclaimer" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            This Disclaimer governs your interaction with the website <strong>shreebanarasisarees.in</strong> and products offered by <strong>Shree Banarasi Sarees</strong> (Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103). Please review these terms carefully to understand our product characteristics and operational limitations.
          </p>
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#B08A3C]/30 space-y-1">
            <span className="font-serif font-bold text-xs text-[#6B1725] uppercase tracking-wider block">
              Statutory Consumer Rights Safeguard
            </span>
            <p className="text-xs text-[#6B625D]">
              Nothing contained in this disclaimer is intended to exclude, limit, or diminish any non-waivable statutory rights available to consumers under the <strong>Consumer Protection Act, 2019</strong> or the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
            </p>
          </div>
        </div>

        {/* 1. Product Photography & Screen Variations */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Camera className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. Product Imagery &amp; Screen Color Variations
            </h2>
          </div>
          <div className="p-4 bg-[#FFF9F0] border border-[#E5DEC9] rounded-2xl space-y-2 text-[#6B625D]">
            <p>
              All sarees presented on our storefront are genuine inventory items photographed under balanced studio lighting. We endeavor to reproduce true-to-life colors and textures.
            </p>
            <p>
              However, because pure silk threads (such as Katan and Organza) refract light dynamically and metallic zari reflects varying color temperatures, fabric shades can appear subtly different in natural sunlight versus indoor LED lighting. Furthermore, individual computer screens and mobile device displays (AMOLED, Retina, Super AMOLED) calibrate colors differently. Minor color differences (typically 5&ndash;10%) are normal and do not qualify as product defects.
            </p>
          </div>
        </section>

        {/* 2. Handloom & Artisanal Textile Characteristics */}
        <section className="space-y-3 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Handcrafted Weaving &amp; Textile Nuances
            </h2>
          </div>
          <div className="p-4 bg-[#FFF9F0] border border-[#E5DEC9] rounded-2xl space-y-2 text-[#6B625D]">
            <p>
              Our Banarasi, Chikankari, Chanderi, and Bandhani sarees are handwoven by traditional artisan weavers using wooden looms. Unlike automated power-loom mass manufacturing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Minor variations in weave density, subtle yarn slubs, or tiny thread knots on the reverse side are natural consequences of human hand-weaving.</li>
              <li>Small irregularities in hand-embroidered Chikankari motifs or tie-dye Bandhani dot patterns are the authentic beauty of genuine Indian handicrafts.</li>
              <li>Such nuances certify handloom origin and are not regarded as manufacturing defects.</li>
            </ul>
          </div>
        </section>

        {/* 3. Delivery Estimates & 20-Minute Local Delivery */}
        <section className="space-y-3 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Truck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Delivery Estimates &amp; 20-Minute Local Quick Delivery
            </h2>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-amber-950">
            <p className="font-serif font-bold text-xs uppercase">
              Operational Estimate Disclaimer:
            </p>
            <p className="text-xs leading-relaxed">
              All delivery timelines stated on our website — including national courier delivery (2&ndash;7 days) and local quick delivery (~20 minutes) — are <strong>operational estimates, not unconditional guarantees</strong>.
            </p>
            <p className="text-xs leading-relaxed">
              Local 20-minute delivery applies strictly to eligible local zones in Samastipur during operating showroom hours (10:00 AM &ndash; 9:00 PM IST) and may be impacted by traffic bottlenecks, level crossings, monsoon rains, road closures, or high order volumes. Shree Banarasi Sarees shall not be liable for transit delays arising from external factors beyond reasonable control.
            </p>
          </div>
        </section>

        {/* 4. Product Availability & Technical Errors */}
        <section className="space-y-3 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <FileCode className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. Product Availability, Pricing &amp; Typographical Disclaimers
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We make every reasonable effort to maintain real-time accuracy across our live catalog. However, occasional errors may occur:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#6B625D]">
            <li><strong>Inventory Disparities:</strong> Rare simultaneous in-store purchases at our Samastipur showroom may occasionally result in an item showing online becoming unavailable before warehouse sync. In such events, we will notify you promptly and offer an alternate weave or 100% full refund.</li>
            <li><strong>Typographical / Pricing Glitches:</strong> In the event a product is mistakenly listed at an incorrect price or with incorrect specifications due to a software error, we reserve the right to cancel the order and provide a full refund.</li>
          </ul>
        </section>

        {/* 5. External Third-Party Links */}
        <section className="space-y-3 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <ExternalLink className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              5. Third-Party Websites &amp; Logistics Links
            </h2>
          </div>
          <p className="text-[#6B625D]">
            Our website may contain links to third-party platforms (such as Google Maps, courier tracking portals, WhatsApp, and social media platforms). These external services are operated independently. Shree Banarasi Sarees exercises no editorial or technical control over third-party websites and accepts no responsibility for their content, uptime, or privacy practices.
          </p>
        </section>

        {/* 6. Contact for Clarifications */}
        <section className="space-y-3 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            6. Questions Regarding This Disclaimer
          </h2>
          <p className="text-[#6B625D]">
            If you have questions regarding any product detail, fabric weave, or policy disclaimer, please consult our team:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-1 text-xs text-[#292524]">
            <p><strong>Business Name:</strong> Shree Banarasi Sarees</p>
            <p><strong>Physical Address:</strong> Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</p>
            <p><strong>Phone / WhatsApp:</strong> +91 62039 09946</p>
            <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline">shreebanarasi180@gmail.com</a></p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
