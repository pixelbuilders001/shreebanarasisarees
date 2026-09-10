import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  XCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  ShieldAlert,
  RotateCcw,
  Landmark
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Order Cancellation Policy | Shree Banarasi Sarees",
  description: "Learn about Shree Banarasi Sarees order cancellation policy. Rules for cancellations before and after dispatch, Cash on Delivery fair use, and store cancellation terms.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/cancellation-policy",
  },
  openGraph: {
    title: "Order Cancellation Policy | Shree Banarasi Sarees",
    description: "Clear guidelines on how and when to cancel an order at Shree Banarasi Sarees, refund timelines, and COD fair usage policies.",
    url: "https://shreebanarasisarees.in/cancellation-policy",
    type: "website",
  }
};

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout
      badge="Order Management & Rules"
      title="Order Cancellation Policy"
      subtitle="Clear and fair terms regarding order cancellations by customers, in-transit dispatch rules, and store cancellation handling."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Customer Care" },
        { label: "Cancellation Policy" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            At <strong>Shree Banarasi Sarees</strong>, we strive to dispatch your traditional handloom sarees as quickly as possible. Because our packaging and logistics processes begin promptly after order confirmation, cancellations are governed by structured stages.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-950/90 leading-relaxed font-light">
            <strong>Please Note:</strong> An order cannot be arbitrarily cancelled at any stage. Once a package has been handed over to our courier partner or local rider and is in transit, the order cannot be cancelled in flight.
          </div>
        </div>

        {/* 1. Cancellation by the Customer */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Clock className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. Customer-Initiated Cancellation Stages
            </h2>
          </div>

          <div className="space-y-4">
            {/* Stage A */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif font-bold text-sm text-[#6B1725] flex items-center gap-2">
                  <CheckCircle2 size={16} /> A. Cancellation Before Order Processing / Dispatch
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Eligible for 100% Full Refund
                </span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                You may cancel your order free of charge at any time <strong>prior to order dispatch</strong> from our Samastipur showroom (typically within 2&ndash;4 hours for local orders and 12&ndash;24 hours for national shipments). If you made a prepaid payment, 100% of the purchase amount will be refunded immediately without any cancellation fee.
              </p>
            </div>

            {/* Stage B */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif font-bold text-sm text-[#6B1725] flex items-center gap-2">
                  <AlertTriangle size={16} /> B. Cancellation After Order Processing / Tailoring Initiated
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                  Conditional
                </span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                If custom blouse tailoring, fall stitching, or edge pico was specifically requested and our master tailors have already cut the fabric or commenced stitching, the base saree portion may be cancelled, but the customized labor fee is non-refundable.
              </p>
            </div>

            {/* Stage C */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif font-bold text-sm text-[#6B1725] flex items-center gap-2">
                  <XCircle size={16} /> C. Cancellation After Dispatch (In-Transit)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] uppercase">
                  Not Possible Mid-Route
                </span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                Once an order has been physically handed over to our courier partner (SpeedPost, BlueDart) or a local 20-minute delivery rider has left our showroom, <strong>cancellation in transit cannot be executed</strong>. In such cases:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#6B625D]">
                <li>You may decline to accept the parcel from the delivery agent when they arrive at your doorstep.</li>
                <li>Alternatively, you may accept the delivery and initiate a standard return within 3 days as per our <Link href="/returns-refunds" className="text-[#6B1725] underline font-medium">Returns &amp; Refunds Policy</Link>.</li>
                <li>Outward courier shipping costs incurred may be deducted for preference-based doorstep refusals.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Cash on Delivery (COD) Cancellation & Fair Usage */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Truck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Cash on Delivery (COD) Cancellation &amp; Fair Use Policy
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We offer Cash on Delivery with open-box verification as a convenience and trust gesture for our patrons. However, because packaging heirloom sarees and shipping via insured couriers incurs significant non-recoverable operational costs, we maintain a strict Fair Usage Policy:
          </p>
          <div className="p-4 bg-[#FAF7F0] border border-[#E5DEC9] rounded-2xl space-y-2 text-[#6B625D]">
            <p>
              &bull; Please only confirm a COD order if you genuinely intend to inspect and receive the parcel upon arrival.
            </p>
            <p>
              &bull; If a customer repeatedly refuses COD orders at the doorstep without valid justification (such as damage), Shree Banarasi Sarees reserves the right to disable Cash on Delivery on that phone number, address, or customer account for future purchases.
            </p>
          </div>
        </section>

        {/* 3. Cancellation by Shree Banarasi Sarees */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Cancellation by Shree Banarasi Sarees
            </h2>
          </div>
          <p className="text-[#6B625D]">
            While rare, Shree Banarasi Sarees reserves the right to cancel an order under specific legitimate circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#6B625D]">
            <li><strong>Product Unavailability / Defect:</strong> If the last remaining physical piece on our showroom floor fails pre-dispatch quality audit and no artisan loom replacement is available.</li>
            <li><strong>Pricing or Typographical Errors:</strong> If a technical bug, database glitch, or human typographical error results in an incorrect pricing or discount calculation.</li>
            <li><strong>Unserviceable Delivery Location:</strong> If the destination address is located in a pin code that courier partners cannot deliver to or is severely disrupted.</li>
            <li><strong>Suspected Fraud or Account Abuse:</strong> If order verification checks indicate fraudulent credit activity, unauthorized use of identity, or repeated automated abuse.</li>
            <li><strong>Circumstances Outside Reasonable Control (Force Majeure):</strong> Severe natural disasters, flood conditions in Bihar, curfews, or road blockades preventing dispatch.</li>
          </ul>
          <p className="text-[#6B625D]">
            In all instances where Shree Banarasi Sarees initiates an order cancellation, the customer will be contacted immediately with a complete explanation, and any prepaid amount will be refunded 100% without deductions.
          </p>
        </section>

        {/* 4. Refund Handling for Cancelled Orders */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Landmark className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. Refund Handling for Cancelled Orders
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Prepaid Orders:</strong> For eligible cancelled prepaid orders, the refund is initiated automatically within <strong>24 business hours</strong>. Depending on your bank, funds typically reflect in your account within <strong>5 to 7 business days</strong>.
            </p>
            <p>
              &bull; <strong>Cash on Delivery:</strong> For COD orders cancelled before dispatch, no monetary transaction has occurred; hence no refund is required.
            </p>
          </div>
        </section>

        {/* 5. How to Request a Cancellation */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            5. How to Request an Order Cancellation
          </h2>
          <p className="text-[#6B625D]">
            To cancel an order prior to dispatch, please reach out to our team as quickly as possible:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-2 text-xs text-[#292524]">
            <p><strong>Primary Fast Track:</strong> WhatsApp message at <a href="https://wa.me/+916203909946" className="text-[#6B1725] font-bold underline">+91 62039 09946</a> with your <strong>Order ID</strong> and text &quot;Cancel Order&quot;.</p>
            <p><strong>Telephone Call:</strong> Call our showroom desk at <a href="tel:+916203909946" className="text-[#6B1725] font-bold underline">+91 62039 09946</a> (10:00 AM &ndash; 9:00 PM IST).</p>
            <p><strong>Email:</strong> Send your request to <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] font-bold underline">shreebanarasi180@gmail.com</a>.</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
