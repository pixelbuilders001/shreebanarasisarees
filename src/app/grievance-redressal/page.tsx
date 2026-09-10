import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Scale,
  UserCheck
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Grievance Redressal Mechanism | Shree Banarasi Sarees",
  description: "Official Grievance Redressal page for Shree Banarasi Sarees under Consumer Protection (E-Commerce) Rules 2020. Contact details for Grievance Officer Rajeev kumar sharma.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/grievance-redressal",
  },
  openGraph: {
    title: "Grievance Redressal Mechanism | Shree Banarasi Sarees",
    description: "Statutory grievance mechanism and Grievance Officer contact details for Shree Banarasi Sarees (Samastipur, Bihar).",
    url: "https://shreebanarasisarees.in/grievance-redressal",
    type: "website",
  }
};

export default function GrievanceRedressalPage() {
  return (
    <PolicyLayout
      badge="Statutory Compliance & Redressal"
      title="Grievance Redressal Mechanism"
      subtitle="Statutory customer grievance channel established under the Consumer Protection (E-Commerce) Rules, 2020 and Information Technology Act."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Legal" },
        { label: "Grievance Redressal" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            In compliance with the <strong>Consumer Protection Act, 2019</strong>, the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, and the <strong>Information Technology Act, 2000</strong>, <strong>Shree Banarasi Sarees</strong> has appointed a designated Grievance Officer to oversee consumer complaints, customer escalations, and data protection inquiries.
          </p>
          <p className="text-[#6B625D]">
            We are committed to resolving customer grievances fairly, transparently, and in strict adherence to mandated statutory timeframes.
          </p>
        </div>

        {/* Grievance Officer Contact Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#FFF9F0] border-2 border-[#B08A3C]/40 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6B1725] text-white flex items-center justify-center shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-serif font-bold uppercase tracking-widest text-[#B08A3C] block">
                Statutory Appointee
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
                Appointed Grievance Officer
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-[#292524]">
            <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] space-y-1.5">
              <p className="text-[#6B625D]">Full Name:</p>
              <p className="font-serif font-bold text-sm text-[#292524]">Rajeev kumar sharma</p>
              <p className="text-[#6B625D] text-[11px]">Designation: Grievance Officer &bull; Shree Banarasi Sarees</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] space-y-1.5">
              <p className="text-[#6B625D]">Electronic Contact:</p>
              <p className="font-bold text-xs text-[#6B1725]">
                <a href="mailto:shreebanarasi180@gmail.com" className="hover:underline">shreebanarasi180@gmail.com</a>
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] space-y-1.5">
              <p className="text-[#6B625D]">Telephone / Helpline:</p>
              <p className="font-bold text-xs text-[#292524]">
                <a href="tel:+916203909946" className="hover:text-[#6B1725]">+91 62039 09946</a>
              </p>
              <p className="text-[11px] text-[#6B625D]">Hours: Monday &ndash; Saturday, 10:00 AM &ndash; 6:00 PM IST</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] space-y-1.5">
              <p className="text-[#6B625D]">Registered Office Address:</p>
              <p className="font-bold text-xs text-[#292524] leading-relaxed">
                Shree Banarasi Sarees<br />
                Rudauli Chowk, Harpur Aloth<br />
                Samastipur, Bihar – 848103, India
              </p>
            </div>
          </div>
        </section>

        {/* Statutory Timelines (48h / 1 Month) */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Clock className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              Statutory Resolution Timelines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] space-y-2">
              <div className="flex items-center gap-2 text-[#6B1725] font-serif font-bold text-sm">
                <Clock size={16} />
                <span>Step 1: 48-Hour Formal Acknowledgement</span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                Every grievance filed with our Grievance Officer is formally acknowledged within <strong>forty-eight (48) hours</strong> of receipt with a unique <strong>Grievance Reference Number (GRN)</strong> sent to your email and phone number.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] space-y-2">
              <div className="flex items-center gap-2 text-[#6B1725] font-serif font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>Step 2: One-Month Redressal (30 Days)</span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                As prescribed by the E-Commerce Rules, 2020, our Grievance Officer will investigate the claim, coordinate with logistics/accounts teams, and provide a formal, reasoned written resolution within <strong>one month (30 calendar days)</strong> of receiving the complaint.
              </p>
            </div>
          </div>
        </section>

        {/* How to Submit a Formal Complaint */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <FileText className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              How to Submit a Formal Grievance
            </h2>
          </div>
          <p className="text-[#6B625D]">
            To enable prompt and efficient investigation of your matter, please ensure your email or written grievance includes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#6B625D]">
            <li><strong>Subject Line:</strong> &quot;Formal Grievance - Order #[Your Order ID]&quot;</li>
            <li><strong>Complainant Details:</strong> Full name, registered mobile telephone number, and postal address.</li>
            <li><strong>Order Particulars:</strong> Order ID, invoice date, purchased saree name, and payment transaction reference.</li>
            <li><strong>Detailed Narrative:</strong> A chronological description of the issue, prior communications with customer care, and the specific resolution sought (e.g. refund, replacement).</li>
            <li><strong>Supporting Documents:</strong> Clear photographs or video evidence of the product, delivery package, courier label, or bank debit record.</li>
          </ul>
        </section>

        {/* Two-Level Escalation Matrix */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Scale className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              Two-Level Escalation Matrix
            </h2>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border border-[#E5DEC9] space-y-1">
              <h4 className="font-serif font-bold text-xs text-[#292524]">
                Level 1: Frontline Customer Care Desk
              </h4>
              <p className="text-xs text-[#6B625D]">
                For immediate order tracking, delivery rescheduling, or routine return questions, first reach our front desk via WhatsApp (+91 62039 09946) or email (<a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] underline">shreebanarasi180@gmail.com</a>). Most inquiries are resolved on the same day.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF9F0] border border-[#B08A3C]/40 space-y-1">
              <h4 className="font-serif font-bold text-xs text-[#6B1725]">
                Level 2: Escalation to Grievance Officer
              </h4>
              <p className="text-xs text-[#6B625D]">
                If your issue remains unresolved after 48 hours or you are dissatisfied with frontline support, escalate directly to the Grievance Officer at <a href="mailto:shreebanarasi180@gmail.com" className="text-[#6B1725] font-bold underline">shreebanarasi180@gmail.com</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Statutory Consumer Rights & National Helpline */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            External Statutory Recourse
          </h2>
          <p className="text-[#6B625D]">
            Consumers also have the statutory right to seek assistance from the government&apos;s <strong>National Consumer Helpline (NCH)</strong> under the Department of Consumer Affairs:
          </p>
          <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] space-y-1 text-xs text-[#6B625D]">
            <p>&bull; <strong>National Consumer Helpline (NCH):</strong> Toll-free <strong>1915</strong> or <strong>1800-11-4000</strong></p>
            <p>&bull; <strong>Web Portal:</strong> <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#6B1725] underline">consumerhelpline.gov.in</a></p>
            <p>&bull; <strong>E-Daakhil Portal:</strong> For filing online consumer disputes before the District Consumer Disputes Redressal Commission in Samastipur, Bihar.</p>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
}
