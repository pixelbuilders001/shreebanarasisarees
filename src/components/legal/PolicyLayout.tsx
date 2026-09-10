import React from 'react';
import Link from 'next/link';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { ShieldCheck, ChevronRight, Clock, HelpCircle, Phone, MessageCircle, Mail, MapPin } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PolicyLayoutProps {
  badge?: string;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export const PolicyLayout: React.FC<PolicyLayoutProps> = ({
  badge = "Customer Care & Transparency",
  title,
  subtitle,
  lastUpdated = "10 September 2026",
  breadcrumbs = [],
  children
}) => {
  return (
    <>
      <Header />

      <main className="bg-[#FFF9F0] min-h-screen pb-16">
        {/* Breadcrumbs Bar */}
        <div className="bg-[#FAF7F0] border-b border-[#E5DEC9]/80 py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-xs text-[#7A6E65] font-sans flex-wrap">
            <Link href="/" className="hover:text-[#6B1725] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-[#B08A3C]" />
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#6B1725] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#292524] font-medium">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight size={12} className="text-[#B08A3C]" />
                )}
              </React.Fragment>
            ))}
            {breadcrumbs.length === 0 && (
              <span className="text-[#292524] font-medium">{title}</span>
            )}
          </div>
        </div>

        {/* Hero Banner Area */}
        <section className="bg-[#52111C] text-[#FAF7F0] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#B08A3C]/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#6B1725]/40 via-transparent to-black/30 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#B08A3C]/40 text-[#D4B870] text-[11px] font-serif uppercase tracking-[0.2em]">
              <ShieldCheck size={14} className="text-[#B08A3C]" />
              <span>{badge}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#FAF7F0] tracking-wide leading-tight">
              {title}
            </h1>
            <div className="w-16 h-0.5 bg-[#B08A3C] mx-auto my-3"></div>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/85 max-w-2xl mx-auto leading-relaxed font-light">
              {subtitle}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#FAF7F0]/70 font-sans">
              <Clock size={13} className="text-[#B08A3C]" />
              <span>Last Updated: <strong>{lastUpdated}</strong></span>
              <span className="text-[#FAF7F0]/30">•</span>
              <span>Samastipur, Bihar</span>
            </div>
          </div>
        </section>

        {/* Policy Content Card */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#E5DEC9] shadow-sm p-6 sm:p-10 lg:p-12 space-y-8 text-[#292524]">
            {children}

            {/* Quick Contact & Assistance Footer Card */}
            <div className="mt-12 pt-8 border-t border-[#F3ECE0]">
              <div className="bg-[#FFF9F0] rounded-2xl border border-[#B08A3C]/25 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-serif font-bold tracking-widest text-[#B08A3C] block">
                      Need Assistance?
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#292524]">
                      Have Questions About This Policy or an Order?
                    </h3>
                    <p className="text-xs text-[#6B625D] leading-relaxed">
                      Our customer desk at our Samastipur showroom is available daily from 10:00 AM to 9:00 PM IST.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href="https://wa.me/+916203909946"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-serif font-bold tracking-wide transition-all shadow-xs"
                    >
                      <MessageCircle size={14} className="fill-current" />
                      <span>WhatsApp</span>
                    </a>
                    <Link
                      href="/contact-us"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#6B1725] hover:bg-[#52111C] text-white rounded-xl text-xs font-serif font-bold tracking-wide transition-all shadow-xs"
                    >
                      <span>Contact Desk</span>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#B08A3C]/15 text-xs text-[#292524]/80">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[#B08A3C] shrink-0" />
                    <a href="tel:+916203909946" className="hover:text-[#6B1725] font-medium">+91 62039 09946</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#B08A3C] shrink-0" />
                    <a href="mailto:shreebanarasi180@gmail.com" className="hover:text-[#6B1725] truncate">shreebanarasi180@gmail.com</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#B08A3C] shrink-0" />
                    <span className="truncate">Samastipur, Bihar (848103)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};
