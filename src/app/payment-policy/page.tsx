import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  AlertTriangle,
  BadgePercent,
  Banknote,
  Smartphone,
  Landmark,
  CheckCircle2
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Payment Policy & Security Guidelines | Shree Banarasi Sarees",
  description: "Read the payment policy for Shree Banarasi Sarees. Learn about Cash on Delivery (COD), doorstep inspection, digital payment security, GST-inclusive pricing, and fraud prevention.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/payment-policy",
  },
  openGraph: {
    title: "Payment Policy & Security Guidelines | Shree Banarasi Sarees",
    description: "Official payment guidelines, Cash on Delivery verification, 256-bit SSL security, and transparent GST pricing for Shree Banarasi Sarees.",
    url: "https://shreebanarasisarees.in/payment-policy",
    type: "website",
  }
};

export default function PaymentPolicyPage() {
  return (
    <PolicyLayout
      badge="Financial Security & Transparency"
      title="Payment Policy &amp; Security"
      subtitle="Complete clarity on checkout methods, Cash on Delivery with open-box verification, payment security standards, and all-inclusive pricing."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Customer Care" },
        { label: "Payment Policy" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            At <strong>Shree Banarasi Sarees</strong>, financial integrity and customer trust are central to everything we do. This Payment Policy outlines our currently enabled payment options, transaction security practices, price transparency, and fraud safeguards.
          </p>
        </div>

        {/* Security Alert Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50/80 border border-red-200 text-red-950 space-y-2">
          <div className="flex items-center gap-2 font-serif font-bold text-xs uppercase tracking-wider text-red-900">
            <AlertTriangle size={18} className="text-red-700 shrink-0" />
            <span>Important Customer Security Advisory &mdash; Never Share PIN or OTP</span>
          </div>
          <p className="text-xs leading-relaxed">
            <strong>Shree Banarasi Sarees will NEVER call, message, or email you asking for your bank account password, ATM PIN, UPI PIN, OTP (One-Time Password), or credit/debit card CVV.</strong> If anyone claiming to represent Shree Banarasi Sarees asks you to enter a PIN to receive a refund or lottery prize, immediately decline and report it to our Grievance Officer (<a href="mailto:shreebanarasi180@gmail.com" className="underline font-bold">shreebanarasi180@gmail.com</a>).
          </p>
        </div>

        {/* 1. Accepted Payment Methods */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. Accepted Checkout Methods
            </h2>
          </div>

          <div className="space-y-4">
            {/* Cash on Delivery Card */}
            <div className="p-5 rounded-2xl bg-[#FFF9F0] border border-[#B08A3C]/40 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-2">
                  <Banknote className="text-[#6B1725]" size={18} />
                  Cash on Delivery (COD) &mdash; Currently Active
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Available Across Delivery Network
                </span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                Cash on Delivery is enabled for all eligible postal pin codes across India and for our local Samastipur delivery fleet. You may pay the exact order amount in cash or via on-the-spot UPI QR code directly to the courier agent upon arrival.
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs text-[#6B1725] font-semibold">
                <CheckCircle2 size={14} />
                <span>Doorstep Open-Box Inspection Guaranteed: Inspect the saree fabric and zari before you pay.</span>
              </div>
            </div>

            {/* Digital Payments & Payment Gateways */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] space-y-2.5">
              <h3 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-2">
                <Smartphone className="text-[#6B1725]" size={18} />
                Online &amp; Digital Payments (RBI-Licensed Gateways)
              </h3>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                When prepaid digital checkout is selected, transactions are routed through Reserve Bank of India (RBI) authorized, PCI-DSS Level 1 compliant payment gateways. Supported channels include:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs text-[#292524]">
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] text-center font-medium">
                  UPI (GPay / PhonePe / Paytm)
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] text-center font-medium">
                  Debit Cards (Visa / RuPay / MC)
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] text-center font-medium">
                  Credit Cards (Major Indian Banks)
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5DEC9] text-center font-medium">
                  Net Banking (50+ Banks)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Payment Security & Data Handling */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Lock className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Transaction Security &amp; Card Data Protection
            </h2>
          </div>
          <div className="space-y-3 text-[#6B625D]">
            <p>
              <strong>We Never Store Payment Card Details:</strong> Shree Banarasi Sarees does not store, process, or have access to your raw credit card numbers, debit card details, expiration dates, or 3-digit CVV codes. All card payment submissions occur directly on PCI-DSS certified gateway servers.
            </p>
            <p>
              <strong>256-Bit SSL Encryption:</strong> All communications between your web browser and our servers are encrypted using modern Transport Layer Security (TLS/SSL).
            </p>
          </div>
        </section>

        {/* 3. Pricing & GST Transparency */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <BadgePercent className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Transparent Pricing &amp; GST Compliance
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>All-Inclusive Listed Prices:</strong> All saree prices displayed on our website are inclusive of applicable Goods &amp; Services Tax (GST at 5% under HSN 5208 for woven textiles).
            </p>
            <p>
              &bull; <strong>Zero Hidden Surcharges:</strong> We do not charge extra payment processing fees or hidden convenience surcharges. The price you see at checkout is the exact amount payable.
            </p>
            <p>
              &bull; <strong>Tax Invoice:</strong> Every confirmed order receives a formal GST tax invoice showing our registered GSTIN (<strong>10AGAFS4190H1Z8</strong>), itemized price, and tax breakdown.
            </p>
          </div>
        </section>

        {/* 4. Failed Transactions & Duplicate Payments */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. Failed Transactions &amp; Duplicate Debits
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; <strong>Bank Debited but Order Not Created:</strong> In rare cases of network timeouts during checkout, your bank may debit the amount without our system receiving confirmation. In such circumstances, the payment gateway automatically reverses the debited funds back to your account within <strong>48 to 72 hours</strong>.
            </p>
            <p>
              &bull; <strong>Duplicate Deductions:</strong> If you accidentally submit two payments for a single order, please contact our accounts desk immediately with your transaction references. We will verify and process a 100% refund of the duplicate charge within 24 business hours.
            </p>
          </div>
        </section>

        {/* 5. Promotional Coupons & Discounts */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            5. Coupons &amp; Promotional Discounts
          </h2>
          <div className="text-[#6B625D] space-y-2">
            <p>
              &bull; Promotional coupons (such as WELCOME10, SHREE500) must be entered in the promotional code field during checkout prior to placing the order.
            </p>
            <p>
              &bull; Only one promotional coupon code can be applied per order. Coupons cannot be redeemed for cash or retroactively applied to past orders.
            </p>
          </div>
        </section>

        {/* 6. Contact Accounts Desk */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            6. Billing Support Contact
          </h2>
          <p className="text-[#6B625D]">
            For any billing, tax invoice, or payment inquiries, reach out directly to our accounts team:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-1 text-xs text-[#292524]">
            <p><strong>Business Name:</strong> Shree Banarasi Sarees</p>
            <p><strong>GSTIN:</strong> 10AGAFS4190H1Z8</p>
            <p><strong>Phone / WhatsApp:</strong> +91 62039 09946</p>
            <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline">shreebanarasi180@gmail.com</a></p>
            <p><strong>Showroom Address:</strong> Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
