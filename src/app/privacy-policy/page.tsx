import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  Share2,
  AlertTriangle,
  Mail,
  Scale
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Privacy Policy | Shree Banarasi Sarees",
  description: "Read the Privacy Policy of Shree Banarasi Sarees. Learn how we collect, handle, store, and protect your personal data in compliance with Indian privacy laws and DPDP regulations.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Shree Banarasi Sarees",
    description: "Official privacy practices, data protection principles, and statutory grievance mechanisms for Shree Banarasi Sarees (Samastipur, Bihar).",
    url: "https://shreebanarasisarees.in/privacy-policy",
    type: "website",
  }
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      badge="Data Privacy & Compliance"
      title="Privacy Policy"
      subtitle="How Shree Banarasi Sarees collects, uses, safeguards, and respects your personal information under applicable Indian data protection laws."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Legal" },
        { label: "Privacy Policy" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            <strong>Shree Banarasi Sarees</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operating our physical showroom at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, and our online storefront at <strong>shreebanarasisarees.in</strong>, is deeply dedicated to preserving the privacy and data security of our patrons.
          </p>
          <p className="text-[#6B625D]">
            This Privacy Policy governs the collection, storage, processing, transfer, and disclosure of personal data gathered when you browse our website, interact with our customer support channels, or purchase sarees through our storefront. It complies with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, and the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> framework.
          </p>
        </div>

        {/* 1. Information We Collect */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. Personal Information We Collect
            </h2>
          </div>
          <p className="text-[#6B625D]">
            Depending on how you engage with our store, we collect only necessary and proportionate categories of information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#6B1725]">
                A. Contact &amp; Identity Information
              </h3>
              <ul className="text-xs text-[#6B625D] space-y-1 list-disc pl-4">
                <li>Full name and preferred salutation</li>
                <li>Primary mobile telephone number</li>
                <li>Email address</li>
                <li>Account login identifiers (via secure Google OAuth authentication)</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#6B1725]">
                B. Delivery &amp; Billing Addresses
              </h3>
              <ul className="text-xs text-[#6B625D] space-y-1 list-disc pl-4">
                <li>Complete shipping address (building, street, landmark)</li>
                <li>City, State, and 6-digit postal PIN code</li>
                <li>Delivery instructions and recipient contact details</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#6B1725]">
                C. Transaction &amp; Order History
              </h3>
              <ul className="text-xs text-[#6B625D] space-y-1 list-disc pl-4">
                <li>Sarees ordered, SKU codes, color, fabric, and quantities</li>
                <li>Order timestamps and invoice totals</li>
                <li>Chosen payment method (e.g. Cash on Delivery)</li>
                <li>Return, replacement, and refund audit history</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2">
              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#6B1725]">
                D. Technical, Device &amp; Analytics Data
              </h3>
              <ul className="text-xs text-[#6B625D] space-y-1 list-disc pl-4">
                <li>IP address and approximate geographic location (city level)</li>
                <li>Browser type, operating system, and device screen resolution</li>
                <li>Page visits, time spent, and referring URLs</li>
                <li>Cookies and local session storage records</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1">
            <p className="font-bold font-serif">Important Note on Payment Card Data:</p>
            <p>
              <strong>Shree Banarasi Sarees does NOT collect, capture, or store payment card details</strong> (credit or debit card numbers, expiration dates, or CVV security codes). All digital card entries occur on authorized PCI-DSS certified third-party payment gateways.
            </p>
          </div>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <FileText className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Purpose of Information Processing
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We process your personal information strictly for legitimate commercial and operational purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#6B625D]">
            <li><strong>Order Fulfillment:</strong> Processing your saree purchase, packaging the items at our Samastipur showroom, and assigning local riders or national couriers.</li>
            <li><strong>Delivery Coordination:</strong> Sharing recipient name, contact number, and address with assigned courier partners for physical delivery and live tracking.</li>
            <li><strong>Transactional Communications:</strong> Sending order confirmations, dispatch updates, invoice PDFs, and delivery status alerts via SMS, WhatsApp, and email.</li>
            <li><strong>Customer Service:</strong> Responding to sizing queries, blouse tailoring requests, return inspections, and warranty questions.</li>
            <li><strong>Fraud Detection &amp; Security:</strong> Preventing automated bot attacks, unauthorized account takeovers, and fraudulent Cash on Delivery orders.</li>
            <li><strong>Website Improvement &amp; Analytics:</strong> Analyzing aggregated user navigation metrics via Google Analytics and Microsoft Clarity to optimize load times and page ergonomics.</li>
            <li><strong>Legal Compliance:</strong> Complying with GST invoicing requirements, tax audits, and lawful statutory disclosures.</li>
          </ul>
        </section>

        {/* 3. Third-Party Service Providers */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Share2 className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. Information Sharing &amp; Third-Party Providers
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We do not sell, rent, trade, or monetize your personal information to third-party advertisers. Information is disclosed strictly on a need-to-know basis to trusted operational partners who are bound by stringent confidentiality agreements:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#6B625D]">
            <li><strong>Logistics &amp; Courier Partners:</strong> India Post (SpeedPost), BlueDart, Delhivery, and local express delivery personnel for parcel transportation.</li>
            <li><strong>Cloud Infrastructure &amp; Database Hosting:</strong> Supabase and Cloudflare for encrypted data storage, authentication tokens, and content distribution.</li>
            <li><strong>Analytics &amp; Performance Tools:</strong> Google Analytics (aggregated traffic statistics) and Microsoft Clarity (session ergonomics).</li>
            <li><strong>Communication &amp; Authentication Providers:</strong> Authentication and messaging providers (e.g. Google OAuth, Resend) to manage secure sign-in and deliver transactional order alerts.</li>
            <li><strong>Legal &amp; Law Enforcement Authorities:</strong> Where mandated by a valid judicial warrant, court order, or statutory enforcement directive under Indian law.</li>
          </ul>
        </section>

        {/* 4. Data Security & Retention */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Lock className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. Data Security &amp; Retention
            </h2>
          </div>
          <div className="text-[#6B625D] space-y-2">
            <p>
              <strong>Security Measures:</strong> We employ industry-standard administrative, physical, and technical safeguards. All data transmitted between your browser and our servers is encrypted using 256-bit SSL/TLS encryption. Sensitive access tokens are hashed and stored securely.
            </p>
            <p>
              <strong>Data Retention:</strong> We retain customer personal data only as long as necessary to fulfill the purposes outlined in this policy, manage customer accounts, handle return/warranty windows, and comply with statutory legal and GST accounting obligations (typically 7 years for tax audit records). Non-identifiable analytics data may be retained in anonymized aggregate formats.
            </p>
          </div>
        </section>

        {/* 5. User Privacy Rights */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Scale className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              5. Your Privacy Rights Under Indian Law
            </h2>
          </div>
          <p className="text-[#6B625D]">
            Under the Digital Personal Data Protection Act, 2023 and applicable regulations, you enjoy the following rights:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#6B625D]">
            <li><strong>Right to Access:</strong> You may request a summary of the personal data held about you.</li>
            <li><strong>Right to Correction:</strong> You may edit or update inaccurate addresses or contact numbers anytime in your &quot;My Account&quot; profile.</li>
            <li><strong>Right to Erasure / Deletion:</strong> You may request the deletion of your customer profile, subject to statutory tax retention requirements.</li>
            <li><strong>Right to Withdraw Consent:</strong> You may opt out of non-essential promotional communications at any time.</li>
          </ul>
        </section>

        {/* 6. Children's Privacy */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            6. Protection of Children&apos;s Information
          </h2>
          <p className="text-[#6B625D]">
            Our website is intended for use by individuals who have attained the age of majority (18 years) in India. We do not knowingly collect personal data from minors without parental or legal guardian consent. If a parent or guardian discovers that a minor has submitted personal data without authorization, please contact us for immediate deletion.
          </p>
        </section>

        {/* 7. Data Breach Response */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            7. Data Incident &amp; Breach Protocol
          </h2>
          <p className="text-[#6B625D]">
            In the event of a security breach affecting personal data, Shree Banarasi Sarees maintains an incident response protocol to investigate, contain the vulnerability, notify affected users without undue delay, and report to the Indian Computer Emergency Response Team (CERT-In) in accordance with applicable cybersecurity directives.
          </p>
        </section>

        {/* 8. Grievance Officer & Contact */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Mail className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              8. Grievance Redressal &amp; Privacy Officer
            </h2>
          </div>
          <p className="text-[#6B625D]">
            In compliance with the Information Technology Act, 2000 and the DPDP framework, you may direct any privacy concerns, data rectification requests, or statutory grievances to our appointed Grievance Officer:
          </p>
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#E5DEC9] space-y-1.5 text-xs text-[#292524]">
            <p><strong>Name:</strong> Rajeev kumar sharma</p>
            <p><strong>Designation:</strong> Grievance Officer</p>
            <p><strong>Business:</strong> Shree Banarasi Sarees</p>
            <p><strong>Physical Address:</strong> Rudauli Chowk, Harpur Aloth, Samastipur, Bihar – 848103, India</p>
            <p><strong>Email:</strong> <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline font-bold">shreebanarasi180@gmail.com</a></p>
            <p><strong>Phone:</strong> +91 62039 09946</p>
            <p><strong>Response Timeline:</strong> Acknowledged within 48 hours; resolved within 30 days.</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
