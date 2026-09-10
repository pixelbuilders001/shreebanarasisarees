import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Landmark,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Eye,
  Camera
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Returns & Refunds Policy | Shree Banarasi Sarees",
  description: "Read the 3-day return and refund policy for Shree Banarasi Sarees. Learn about eligibility conditions, handloom weave variations, return pickups, and 5-7 day refund timelines.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/returns-refunds",
  },
  openGraph: {
    title: "Returns & Refunds Policy | Shree Banarasi Sarees",
    description: "Transparent 3-day return policy, exchange terms, refund timelines, and handloom craftsmanship standards for Shree Banarasi Sarees.",
    url: "https://shreebanarasisarees.in/returns-refunds",
    type: "website",
  }
};

export default function ReturnsRefundsPage() {
  return (
    <PolicyLayout
      badge="Reassurance & Consumer Rights"
      title="Returns &amp; Refunds Policy"
      subtitle="Clear, fair, and transparent return, exchange, and refund guidelines for authentic handloom sarees."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Customer Care" },
        { label: "Returns & Refunds" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            At <strong>Shree Banarasi Sarees</strong>, every piece is curated from traditional handloom clusters and inspected with care. We want you to be completely satisfied with your purchase. If an item does not meet your expectations, we provide a structured and transparent <strong>3-day return window</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#B08A3C]/30 text-[#292524] space-y-1">
            <span className="font-serif font-bold text-xs text-[#6B1725] uppercase tracking-wider block">
              Statutory Consumer Rights Safeguard
            </span>
            <p className="text-xs text-[#6B625D]">
              Nothing in this policy is intended to remove, restrict, or modify any statutory consumer rights that cannot legally be excluded under the Consumer Protection Act, 2019, the Consumer Protection (E-Commerce) Rules, 2020, or any other applicable law of India.
            </p>
          </div>
        </div>

        {/* 1. Return Window & Core Conditions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. 3-Day Return Period &amp; Eligibility
            </h2>
          </div>
          <p className="text-[#6B625D]">
            Customers may initiate a return or exchange request within <strong>3 calendar days</strong> from the date of confirmed delivery by our courier partner or local rider.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <h3 className="font-serif font-bold text-sm text-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                Eligible for Return
              </h3>
              <ul className="text-xs text-emerald-950/85 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Saree is in completely <strong>unused, unworn, and unwashed</strong> original condition.</li>
                <li>All original product tags, security bands, and loom authenticity labels are attached.</li>
                <li>The garment retains its original factory folds, butter paper wrap, and brand box.</li>
                <li>The return request is raised within 3 calendar days of delivery.</li>
                <li>Product received was damaged, defective, or materially different from description.</li>
              </ul>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <h3 className="font-serif font-bold text-sm text-amber-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-700" />
                Non-Returnable Items (Exceptions)
              </h3>
              <ul className="text-xs text-amber-950/85 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Sarees where custom blouse tailoring, sleeve adjustments, or size cuts were done.</li>
                <li>Sarees where fall stitching and edge pico have been completed upon request.</li>
                <li>Sarees that have been worn, dry-cleaned, sprayed with perfume, or ironed.</li>
                <li>Products showing customer-caused snagging, pulled zari threads, or body oil marks.</li>
                <li>Items returned without original packaging or damaged transit boxes.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Color Variations & Handcrafted Textile Authenticity */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Saree Color Appearance &amp; Handloom Characteristics
            </h2>
          </div>

          <div className="space-y-3 text-[#6B625D]">
            <div className="p-4 bg-[#FFF9F0] border border-[#E5DEC9] rounded-2xl space-y-2">
              <h4 className="font-serif font-bold text-xs text-[#292524] uppercase tracking-wide">
                A. Screen &amp; Photography Color Variations
              </h4>
              <p className="text-xs leading-relaxed">
                We make every reasonable effort to display product colors as accurately as possible under calibrated studio lighting. However, because pure silk fibers possess natural optical luster and metallic zari reflects light dynamically, subtle color tones can vary based on ambient lighting (daylight vs warm home lighting) and digital display settings (OLED, AMOLED, sRGB, night light filter). A 5&ndash;10% difference in perceived shade is normal and is not considered a manufacturing defect.
              </p>
            </div>

            <div className="p-4 bg-[#FFF9F0] border border-[#E5DEC9] rounded-2xl space-y-2">
              <h4 className="font-serif font-bold text-xs text-[#292524] uppercase tracking-wide">
                B. Handcrafted &amp; Traditional Weave Hallmarks
              </h4>
              <p className="text-xs leading-relaxed">
                Our Banarasi, Chikankari, and Bandhani sarees are traditional artisanal handloom creations. Minor inconsistencies in weave thickness, tiny yarn slubs, minor motif asymmetries, or natural thread knots on the underside are the authentic signatures of traditional manual weaving — not industrial machine defects.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Damaged, Defective, or Wrong Product Received */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Camera className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Damaged, Defective, or Materially Different Products
            </h2>
          </div>
          <p className="text-[#6B625D]">
            In the improbable event that you receive a damaged, materially defective, or incorrect saree:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#6B625D]">
            <li>Report the discrepancy to us within <strong>48 hours of delivery</strong>.</li>
            <li>Send photos or a continuous unboxing video showing the outer package, shipping label, and the specific defect to our WhatsApp (+91 62039 09946) or email (shreebanarasi180@gmail.com).</li>
            <li>Upon verification, we will arrange a complimentary priority return pickup and offer you an immediate 100% full refund or free replacement dispatch.</li>
          </ul>
        </section>

        {/* 4. Return Request Process (Step-by-Step) */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <FileText className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. How to Submit a Return or Exchange Request
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-xl flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6B1725] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <strong className="text-[#292524]">Initiate Request:</strong> Message our customer desk on WhatsApp at <strong>+91 62039 09946</strong> or email <strong>shreebanarasi180@gmail.com</strong> within 3 days of delivery. State your <strong>Order ID</strong> and the reason for return/exchange.
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-xl flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6B1725] text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <strong className="text-[#292524]">Photo Verification:</strong> Share 2&ndash;3 photos demonstrating that the saree is unstitched, unworn, and all brand tags and folds are intact.
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-xl flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6B1725] text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <strong className="text-[#292524]">Pickup or Showroom Return:</strong>
                <ul className="list-disc pl-4 pt-1 space-y-1 text-[#6B625D]">
                  <li><strong>Local Samastipur Customers:</strong> You may drop off the saree directly at our Rudauli Chowk showroom or request a local rider pickup.</li>
                  <li><strong>National Orders:</strong> We will schedule a courier pickup from your delivery address where reverse pickup is serviceable. If reverse pickup is unavailable in your pin code, we will guide you to ship via India Post (SpeedPost) or BlueDart and reimburse reasonable postal shipping charges.</li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-xl flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6B1725] text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
              <div>
                <strong className="text-[#292524]">Showroom Inspection:</strong> Within <strong>48 hours</strong> of arrival at our Samastipur showroom, our master weavers audit the parcel to confirm unstitched and tag-intact condition.
              </div>
            </div>
          </div>
        </section>

        {/* 5. Exchanges & Product Availability */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              5. Exchange Protocol &amp; Stock Availability
            </h2>
          </div>
          <p className="text-[#6B625D]">
            If you wish to exchange for another saree, color variant, or fabric:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#6B625D]">
            <li>Exchanges are subject to inventory availability in our showroom or artisan loom batches.</li>
            <li>If the chosen replacement saree carries a higher price, the price difference must be settled prior to dispatch. If it carries a lower price, the remaining balance will be refunded or credited as a store coupon.</li>
            <li>If the desired exchange design is currently out of stock, you may choose any alternate saree or receive a 100% full refund.</li>
          </ul>
        </section>

        {/* 6. Refund Process, Modes & Timelines */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Landmark className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              6. Modes of Refund &amp; Processing Timelines
            </h2>
          </div>

          <div className="space-y-3 text-[#6B625D]">
            <p>
              Once your returned package is audited and approved by our quality team, refunds are initiated promptly through the applicable mode:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-1">
                <span className="font-bold text-[#292524] text-xs block">Prepaid Digital Orders</span>
                <p className="text-[11px]">Credited directly back to the original bank account, debit/credit card, or UPI ID used during checkout.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-1">
                <span className="font-bold text-[#292524] text-xs block">Cash on Delivery (COD)</span>
                <p className="text-[11px]">Direct electronic bank transfer (NEFT / IMPS / UPI) to the customer&apos;s verified bank account.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] space-y-1">
                <span className="font-bold text-[#292524] text-xs block">Store Credit Coupon</span>
                <p className="text-[11px]">Digital voucher code worth 100% value, issued instantly with 1-year validity for any future order.</p>
              </div>
            </div>

            <p className="pt-2">
              <strong>Bank Timeline:</strong> Following refund initiation from our accounts, it takes approximately <strong>5 to 7 business days</strong> for the funds to reflect in your bank account, depending on inter-bank clearing cycles. You will receive an SMS and email containing the bank UTR reference number as soon as the transfer is completed.
            </p>
            <p className="text-[11px] text-[#6B625D]">
              Note: Third-party payment gateway or bank holidays may occasionally cause slight processing delays beyond our direct control.
            </p>
          </div>
        </section>

        {/* 7. Shipping & Return Charges */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            7. Return Shipping Charges &amp; Deductions
          </h2>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Damaged, Defective, or Incorrect Items:</strong> 100% free return and replacement. No shipping or handling deductions apply.
            </p>
            <p>
              &bull; <strong>Customer Preference Returns (Change of Mind):</strong> For standard preference returns of undamaged, unstitched sarees, standard courier return logistics charges (₹99 for courier pickup) may be deducted from the refund amount. For walk-in showroom returns at Samastipur, zero deductions apply.
            </p>
            <p>
              &bull; <strong>Non-Refundable Services:</strong> Custom tailoring fees (blouse stitching, fall/pico service) and express local rider delivery charges paid to delivery agents are non-refundable once fulfilled.
            </p>
          </div>
        </section>

        {/* 8. Contact Desk */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            8. Need Help with a Return?
          </h2>
          <p className="text-[#6B625D]">
            Our dedicated returns desk is available every day to assist you:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-1 text-xs text-[#292524]">
            <p><strong>Returns Desk:</strong> Shree Banarasi Sarees</p>
            <p><strong>Physical Address:</strong> Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</p>
            <p><strong>WhatsApp &amp; Helpline:</strong> +91 62039 09946</p>
            <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline">shreebanarasi180@gmail.com</a></p>
            <p><strong>Working Hours:</strong> Open Daily: 10:00 AM – 9:00 PM (Open on Sundays)</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
