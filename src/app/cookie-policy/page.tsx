import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyLayout } from '../../components/legal/PolicyLayout';
import {
  Cookie,
  ShieldCheck,
  Sliders,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Cookie Policy | Shree Banarasi Sarees",
  description: "Learn about how Shree Banarasi Sarees uses essential, preference, and analytics cookies (Google Analytics & Microsoft Clarity) to provide a seamless saree shopping experience.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/cookie-policy",
  },
  openGraph: {
    title: "Cookie Policy | Shree Banarasi Sarees",
    description: "Detailed breakdown of essential cookies, session storage, and analytics tools used on Shree Banarasi Sarees.",
    url: "https://shreebanarasisarees.in/cookie-policy",
    type: "website",
  }
};

export default function CookiePolicyPage() {
  return (
    <PolicyLayout
      badge="Web Technologies & Transparency"
      title="Cookie Policy"
      subtitle="How Shree Banarasi Sarees uses cookies, session identifiers, and analytics technologies to optimize your shopping experience."
      lastUpdated="10 September 2026"
      breadcrumbs={[
        { label: "Legal" },
        { label: "Cookie Policy" }
      ]}
    >
      <div className="space-y-8 text-xs sm:text-sm text-[#292524] font-sans leading-relaxed">

        {/* Introduction */}
        <div className="border-b border-[#F3ECE0] pb-6 space-y-3">
          <p className="text-sm sm:text-base text-[#292524] font-medium leading-relaxed">
            This Cookie Policy explains how <strong>Shree Banarasi Sarees</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) uses cookies and similar client-side storage technologies on our website (<strong>shreebanarasisarees.in</strong>).
          </p>
          <p className="text-[#6B625D]">
            We believe in total transparency. We only employ cookies strictly necessary to operate your shopping cart and user session, along with privacy-respecting performance analytics. <strong>We do not use invasive third-party behavioral advertising trackers or social media tracking pixels.</strong>
          </p>
        </div>

        {/* 1. What Are Cookies? */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Cookie className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              1. What Are Cookies and Local Storage?
            </h2>
          </div>
          <p className="text-[#6B625D]">
            Cookies are small text data files placed on your smartphone, tablet, or computer browser when you visit websites. They enable the website to &quot;remember&quot; your actions over time (such as which saree is currently in your shopping bag, whether you are logged in, and your selected delivery pincode) so you do not have to re-enter them on every page reload.
          </p>
          <p className="text-[#6B625D]">
            In addition to cookies, modern web applications utilize <em>Local Storage</em> and <em>IndexedDB</em> (such as Dexie.js in our application) to cache saree categories and images locally, ensuring fast load times even on spotty mobile network connections across Bihar.
          </p>
        </section>

        {/* 2. Categories of Cookies We Use */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Sliders className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              2. Categories of Cookies Used on Our Storefront
            </h2>
          </div>

          <div className="space-y-4">
            {/* Essential Cookies */}
            <div className="p-5 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-2">
                  <CheckCircle2 className="text-[#6B1725]" size={16} />
                  A. Strictly Essential Cookies (Mandatory for Shopping)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                These cookies are strictly necessary for the storefront to function. Without them, core e-commerce features cannot operate:
              </p>
              <ul className="text-xs text-[#6B625D] space-y-1 list-disc pl-5">
                <li><strong>Shopping Cart State:</strong> Remembers your selected sarees, quantities, and chosen customization flags while browsing.</li>
                <li><strong>User Authentication:</strong> Manages secure customer login tokens and Google OAuth session validation.</li>
                <li><strong>Checkout &amp; Security:</strong> Protects order forms from Cross-Site Request Forgery (CSRF) and maintains order step continuity.</li>
                <li><strong>PWA Installation Flags:</strong> Remembers whether you have already installed our mobile application.</li>
              </ul>
            </div>

            {/* Preference Cookies */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] space-y-2.5">
              <h3 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-2">
                <Settings className="text-[#6B1725]" size={16} />
                B. Functionality &amp; Preference Storage
              </h3>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                These identifiers retain your user choices to personalize your browsing experience:
              </p>
              <ul className="text-xs text-[#6B625D] space-y-1 list-disc pl-5">
                <li><strong>Delivery Pincode:</strong> Remembers your checked 6-digit postal code (e.g. 848103) so product pages display accurate 20-minute local delivery or pan-India courier ETAs automatically.</li>
                <li><strong>Wishlist Storage:</strong> Keeps track of your bookmarked heirloom designs locally.</li>
              </ul>
            </div>

            {/* Analytics Cookies */}
            <div className="p-5 rounded-2xl bg-[#FFF9F0] border border-[#E5DEC9] space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif font-bold text-sm text-[#292524] flex items-center gap-2">
                  <BarChart3 className="text-[#6B1725]" size={16} />
                  C. Performance &amp; Ergonomics Analytics
                </h3>
              </div>
              <p className="text-xs text-[#6B625D] leading-relaxed">
                To improve user experience and troubleshoot technical glitches, our application utilizes two specific, industry-standard analytics tools:
              </p>
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse border border-[#E5DEC9] rounded-xl text-xs">
                  <thead className="bg-[#FAF7F0] font-serif text-[#292524]">
                    <tr>
                      <th className="p-2.5 border-b border-[#E5DEC9]">Provider</th>
                      <th className="p-2.5 border-b border-[#E5DEC9]">Cookie Name</th>
                      <th className="p-2.5 border-b border-[#E5DEC9]">Purpose</th>
                      <th className="p-2.5 border-b border-[#E5DEC9]">Lifespan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3ECE0] text-[#6B625D]">
                    <tr>
                      <td className="p-2.5 font-medium text-[#292524]">Google Analytics</td>
                      <td className="p-2.5 font-mono text-[11px]">_ga, _ga_*</td>
                      <td className="p-2.5">Distinguishes unique anonymous sessions to measure aggregate website traffic and bounce rates.</td>
                      <td className="p-2.5">Up to 2 years</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-[#292524]">Microsoft Clarity</td>
                      <td className="p-2.5 font-mono text-[11px]">_clck, _clsk</td>
                      <td className="p-2.5">Records anonymous user scroll heatmaps and detects broken navigation clicks to improve page design.</td>
                      <td className="p-2.5">1 year / Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#6B625D] pt-1">
                Both analytics tools record data in pseudonymized formats and are configured to mask sensitive personal inputs.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Third-Party Advertising & Marketing Notice */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              3. No Third-Party Cross-Site Ad Tracking
            </h2>
          </div>
          <p className="text-[#6B625D]">
            We respect your digital boundaries. <strong>Shree Banarasi Sarees does not employ Meta Pixel, Facebook App Events, or third-party ad retargeting networks.</strong> We do not sell your browsing profiles to data brokers or cross-site behavioral advertising platforms.
          </p>
        </section>

        {/* 4. Managing and Disabling Cookies */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <div className="flex items-center gap-2.5">
            <Settings className="text-[#6B1725] shrink-0" size={20} />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              4. How to Control and Manage Cookies
            </h2>
          </div>
          <p className="text-[#6B625D]">
            You have full control over cookie permissions through your web browser settings. Most mobile and desktop browsers allow you to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#6B625D]">
            <li>View what cookies are currently stored and delete them individually.</li>
            <li>Block all third-party cookies by default.</li>
            <li>Configure your browser to clear all stored cookies whenever you close the browser window.</li>
          </ul>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-start">
            <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-950">
              <span className="font-serif font-bold">Impact of Disabling Essential Cookies:</span>
              <p className="leading-relaxed">
                If you choose to block strictly essential cookies in your browser, key e-commerce features will not function correctly: sarees placed in your bag may disappear upon page navigation, and checkout confirmation will fail.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Contact Information */}
        <section className="space-y-4 pt-4 border-t border-[#F3ECE0]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
            5. Cookie Questions &amp; Support
          </h2>
          <p className="text-[#6B625D]">
            If you have questions regarding our use of cookies or tracking technologies, please contact our team:
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
