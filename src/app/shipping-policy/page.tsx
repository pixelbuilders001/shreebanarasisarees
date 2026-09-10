import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  Truck,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Package,
  CalendarCheck,
  CheckCircle2,
  Phone,
  FileCheck2
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Shree Banarasi Sarees",
  description: "Read the official Shipping & Delivery Policy of Shree Banarasi Sarees. Learn about our local ~20-minute express delivery in Samastipur, pan-India courier timelines, delivery charges, and packaging standards.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/shipping-policy",
  },
  openGraph: {
    title: "Shipping & Delivery Policy | Shree Banarasi Sarees",
    description: "Official shipping guidelines, local quick delivery eligibility, dispatch timelines, and safe packaging standards for Shree Banarasi Sarees.",
    url: "https://shreebanarasisarees.in/shipping-policy",
    type: "website",
  }
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      badge="Fulfillment & Logistics"
      title="Shipping & Delivery Policy"
      subtitle="Transparent details on our local 20-minute delivery service in Samastipur, standard pan-India express courier delivery, order dispatch timelines, and safe packaging."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Customer Care" },
        { label: "Shipping & Delivery Policy" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            At <strong>Shree Banarasi Sarees</strong> (Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103), we treat every heirloom saree with utmost reverence. From the moment your order is placed until it reaches your hands, our logistics processes are designed to ensure safety, speed, and complete transparency.
          </p>
          <p className="text-[#6B625D]">
            This Shipping &amp; Delivery Policy sets forth the terms, operating parameters, eligibility criteria, and delivery timelines applicable to orders placed on our website (shreebanarasisarees.in) or via our direct customer service channels.
          </p>
        </div>

        {/* 1. Delivery Coverage & Serviceable Areas */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <MapPin className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. Delivery Coverage &amp; Serviceable Areas
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We fulfill orders across two distinct fulfillment categories:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <h3 className="font-serif font-bold text-sm text-[#6B1725] flex items-center gap-2">
                <Zap size={16} /> A. Local Quick Delivery (Samastipur)
              </h3>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                Dedicated local courier and rider dispatch direct from our Rudauli Chowk showroom to eligible addresses within Samastipur town and adjoining local pin codes (e.g. 848103, 848101).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <h3 className="font-serif font-bold text-sm text-[#6B1725] flex items-center gap-2">
                <Truck size={16} /> B. Standard Domestic Delivery (Pan-India)
              </h3>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                Comprehensive express domestic surface and air courier shipping across all 28 states and union territories in India, covering over 19,000 postal pin codes.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Local Quick Delivery (~20-Minute Delivery) & Operational Terms */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Zap className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Local Quick Delivery (~20-Minute Service)
            </h2>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide font-serif">
              <AlertTriangle size={16} className="text-amber-700 shrink-0" />
              <span>Important Operational Notice &mdash; Service Disclaimer</span>
            </div>
            <p className="text-xs text-amber-950/90 leading-relaxed font-light">
              <strong>Shree Banarasi Sarees does NOT represent local 20-minute delivery as an unconditional guarantee.</strong> Approximately 20-minute delivery is a targeted operational delivery service provided exclusively to eligible local delivery zones in Samastipur. Actual transit and delivery times are subject to and may be affected by geographical distance, product packaging buffer, live road traffic, rail crossings, inclement weather (such as heavy monsoon rainfall or dense winter fog), local festival processions, order surges, and operational showroom hours.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-serif font-bold text-sm text-[#292524]">
              Eligibility Criteria for Local 20-Minute Quick Delivery:
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-[#6B625D]">
              <li>
                <strong>Geographical Radius:</strong> The destination address must be situated within our designated rapid delivery radial radius (typically within 5 to 10 kilometers of our Rudauli Chowk showroom).
              </li>
              <li>
                <strong>Operating Hours Window:</strong> Orders must be placed during our active dispatch hours, between <strong>10:00 AM and 8:00 PM IST</strong>. Express orders placed after 8:00 PM or before 10:00 AM are queued for priority morning delivery by 10:00 AM.
              </li>
              <li>
                <strong>Stock Availability:</strong> The requested saree must be immediately available on our Samastipur showroom display floor (unaltered and unstitched).
              </li>
              <li>
                <strong>No Custom Tailoring:</strong> Sizing adjustments, custom blouse stitching, or custom fall/pico orders are not eligible for 20-minute delivery as master tailoring requires dedicated manual work.
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Standard Delivery Timelines */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Clock className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Standard Delivery Estimates &amp; Dispatch Schedule
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#E5DEC9] rounded-2xl overflow-hidden text-xs">
              <thead className="bg-[#FAF7F0] font-serif text-[#292524]">
                <tr>
                  <th className="p-3 border-b border-[#E5DEC9]">Destination / Service</th>
                  <th className="p-3 border-b border-[#E5DEC9]">Dispatch Window</th>
                  <th className="p-3 border-b border-[#E5DEC9]">Estimated Delivery Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3ECE0] text-[#6B625D]">
                <tr>
                  <td className="p-3 font-medium text-[#292524]">Samastipur Local Quick Delivery</td>
                  <td className="p-3">Immediate (within 3&ndash;5 mins)</td>
                  <td className="p-3">Approx. 20 to 45 minutes (subject to traffic)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#292524]">Bihar (Patna, Muzaffarpur, Darbhanga, etc.)</td>
                  <td className="p-3">24 to 48 hours</td>
                  <td className="p-3">2 to 3 business days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#292524]">Metro Cities (Delhi, Mumbai, Bengaluru, Kolkata)</td>
                  <td className="p-3">24 to 48 hours</td>
                  <td className="p-3">4 to 6 business days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#292524]">Rest of India (Tier 2/3 &amp; North East)</td>
                  <td className="p-3">24 to 48 hours</td>
                  <td className="p-3">5 to 7 business days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#292524]">Custom Blouse Stitching / Fall &amp; Pico</td>
                  <td className="p-3">Additional 3 to 5 business days</td>
                  <td className="p-3">Standard transit applies after tailoring</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Delivery Charges */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Package className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. Delivery Charges &amp; Free Shipping Policy
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Free Standard Shipping:</strong> Standard delivery across India is free on eligible orders above ₹999. Orders below ₹999 carry a flat delivery fee of ₹99.
            </p>
            <p>
              &bull; <strong>Local Quick Delivery Fee:</strong> When rapid 20-minute local rider delivery is opted for, a nominal local express charge (as displayed clearly during checkout, typically ₹29 to ₹49) applies to compensate local delivery personnel.
            </p>
            <p>
              &bull; <strong>All-Inclusive Transparent Pricing:</strong> All shipping and product rates shown on our website include applicable Goods &amp; Services Tax (GST).
            </p>
          </div>
        </section>

        {/* 5. Courier Partners & Order Tracking */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              5. Logistics Partners &amp; Tracking Mechanism
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We collaborate only with vetted, reputable courier networks including <strong>India Post (SpeedPost), BlueDart, Delhivery</strong>, and dedicated local express riders.
          </p>
          <p className="text-[#6B625D]">
            As soon as an order is handed over to the courier partner, an automated confirmation is dispatched to your registered phone number and email address containing:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#6B625D]">
            <li>Name of the assigned logistics partner</li>
            <li>Unique Air Waybill (AWB) consignment tracking number</li>
            <li>Direct URL link to track live parcel movement</li>
          </ul>
        </section>

        {/* 6. Packaging Standards & Safe Transit */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              6. Packaging Integrity &amp; Crease Protection
            </h2>
          </div>
          <p className="text-[#6B625D]">
            Pure silk threads and delicate zari work are sensitive to moisture and hard friction. We package each saree through a rigorous multi-stage packing process:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#6B625D]">
            <li>Steam-ironing and natural grain folding</li>
            <li>Wrapping in breathable, acid-free butter paper to guard metallic zari sheen</li>
            <li>Enclosing in heavy-gauge moisture-proof outer protective sleeve</li>
            <li>Placing inside a rigid, tamper-evident corrugated presentation box</li>
          </ul>
        </section>

        {/* 7. Delivery Attempts, Incorrect Address & Failed Delivery */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              7. Delivery Attempts, Incomplete Addresses &amp; RTO
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Delivery Attempts:</strong> Our courier partners typically make up to <strong>three (3) delivery attempts</strong> before initiating Return to Origin (RTO). The delivery executive will contact your registered phone number prior to arrival.
            </p>
            <p>
              &bull; <strong>Customer Address Accuracy:</strong> Customers are strictly responsible for supplying accurate delivery details including building name, landmark, town, state, and 6-digit PIN code. If you notice a typo after placing an order, notify us immediately on WhatsApp (+91 62039 09946) before parcel dispatch.
            </p>
            <p>
              &bull; <strong>Failed Deliveries:</strong> If a package cannot be delivered due to repeated customer unavailability, incorrect contact details, or refusal of a Cash on Delivery shipment, the package will return to our Samastipur showroom. Re-dispatch requests may attract actual round-trip courier shipping fees.
            </p>
          </div>
        </section>

        {/* 8. Damaged, Tampered, or Defective Parcels upon Delivery */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              8. Inspection, Damaged or Tampered Parcels
            </h2>
          </div>
          <p className="text-[#6B625D]">
            For local Cash on Delivery shipments, we encourage <strong>doorstep open-box inspection</strong> so you can verify the saree prior to completing payment.
          </p>
          <p className="text-[#6B625D]">
            For national courier parcels: If the outer corrugated carton appears visibly crushed, torn, tampered, or resealed with unbranded tape, please either decline receipt from the delivery agent with the remark &quot;Rejected due to damaged outer packaging&quot; or record a 360-degree continuous unboxing video.
          </p>
          <p className="text-[#6B625D]">
            Any transit damage or incorrect product claims must be reported within <strong>48 hours of delivery</strong> to our customer support desk (+91 62039 09946 / shreebanarasi180@gmail.com) with supporting photographic or video evidence.
          </p>
        </section>

        {/* 9. Product Availability Issues */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            9. Product Availability &amp; Inventory Discrepancies
          </h2>
          <p className="text-[#6B625D]">
            Because our online inventory is synchronized in real time with our physical Samastipur showroom floor, rare simultaneous in-store customer purchases may occasionally cause an item to become unavailable. In such events, our team will reach out within 24 hours to offer an equivalent weave, reserve the next handloom batch, or issue an immediate 100% full refund.
          </p>
        </section>

        {/* 10. Contact Information */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            10. Shipping Inquiries &amp; Customer Assistance
          </h2>
          <p className="text-[#6B625D]">
            If you have questions about this policy, need delivery ETA updates, or wish to reschedule a delivery, please reach out to our team:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-1 text-xs text-[#292524]">
            <p><strong>Business Name:</strong> Shree Banarasi Sarees</p>
            <p><strong>Physical Address:</strong> Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</p>
            <p><strong>Phone / WhatsApp:</strong> +91 62039 09946</p>
            <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline">shreebanarasi180@gmail.com</a></p>
            <p><strong>Support Hours:</strong> Open Daily: 10:00 AM – 9:00 PM (Open on Sundays)</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
