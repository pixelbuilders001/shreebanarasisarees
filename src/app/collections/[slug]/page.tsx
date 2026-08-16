import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { ProductCard } from '../../../components/ProductCard';
import { fetchCampaignBySlug, fetchCampaignProducts } from '../../../data/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const campaign = await fetchCampaignBySlug(resolvedParams.slug);

  if (!campaign) {
    return {
      title: 'Collection Not Found',
    };
  }

  // Check if active
  const now = new Date();
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  const isActive = campaign.status === 'active' && now >= startDate && now <= endDate;

  if (!isActive) {
    return {
      title: 'Collection Not Found',
    };
  }

  return {
    title: `${campaign.name} | Shree Banarasi Sarees`,
    description: campaign.subtitle || campaign.title || `Shop exclusive collection of traditional sarees from ${campaign.name} at Shree Banarasi Sarees.`,
    alternates: {
      canonical: `https://shreebanarasisarees.com/collections/${campaign.slug}`,
    },
    openGraph: {
      title: `${campaign.name} | Shree Banarasi Sarees`,
      description: campaign.subtitle || campaign.title || `Shop exclusive collection of traditional sarees from ${campaign.name} at Shree Banarasi Sarees.`,
      url: `https://shreebanarasisarees.com/collections/${campaign.slug}`,
      type: "website",
      images: campaign.desktop_banner_url ? [
        {
          url: campaign.desktop_banner_url,
          alt: campaign.title || campaign.name,
        }
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${campaign.name} | Shree Banarasi Sarees`,
      description: campaign.subtitle || campaign.title || `Shop exclusive collection of traditional sarees from ${campaign.name} at Shree Banarasi Sarees.`,
      images: campaign.desktop_banner_url ? [campaign.desktop_banner_url] : [],
    }
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const campaign = await fetchCampaignBySlug(resolvedParams.slug);

  if (!campaign) {
    notFound();
  }

  // Verify dates and status
  const now = new Date();
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  const isActive = campaign.status === 'active' && now >= startDate && now <= endDate;

  if (!isActive) {
    notFound();
  }

  // Fetch campaign products
  const products = await fetchCampaignProducts(campaign.id);

  // Schema for Breadcrumbs
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shreebanarasisarees.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Collections",
        "item": "https://shreebanarasisarees.com/sarees"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": campaign.name,
        "item": `https://shreebanarasisarees.com/collections/${campaign.slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <Header />
      
      <main className="pb-16 bg-[#FFF9F0] min-h-screen">
        {/* Campaign Hero Banner */}
        {campaign.desktop_banner_url ? (
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <section className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden rounded-xl sm:rounded-2xl bg-dark-brown border border-gold/15 shadow-md">
              {/* Background Image with Fallbacks/Responsiveness */}
              <picture className="absolute inset-0 w-full h-full">
                {campaign.mobile_banner_url && (
                  <source media="(max-width: 640px)" srcSet={campaign.mobile_banner_url} />
                )}
                <img
                  src={campaign.desktop_banner_url}
                  alt={campaign.name}
                  className="w-full h-full object-cover"
                />
              </picture>
              
              {/* Subtle premium dark gradients overlay for readable text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />
              
              {/* Text Overlay (Premium Styling) */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-8 md:p-10 w-full">
                <div className="space-y-1.5 max-w-2xl text-ivory">
                  <span className="text-[9px] sm:text-xs font-bold tracking-[0.25em] text-gold uppercase block font-serif">
                    —— Exclusive Collection ——
                  </span>
                  <h1 className="font-serif text-lg sm:text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow-md">
                    {campaign.title}
                  </h1>
                  {campaign.subtitle && (
                    <p className="text-[10px] sm:text-xs md:text-sm text-ivory/80 leading-relaxed font-light font-sans max-w-xl drop-shadow-sm line-clamp-2">
                      {campaign.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Fallback Elegant Header if no Banner Image is present */
          <section className="bg-gradient-to-b from-[#FFF0DB] to-[#FFF9F0] border-b border-cream py-12 px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-4">
              <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
                Exclusive Collection
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-dark-brown">
                {campaign.title || campaign.name}
              </h1>
              <div className="w-16 h-0.5 bg-maroon mx-auto"></div>
              {campaign.subtitle && (
                <p className="text-sm text-dark-brown/70 leading-relaxed max-w-lg mx-auto font-light">
                  {campaign.subtitle}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Collection Products Grid */}
        <section className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb Navigation */}
          <nav className="text-xs text-dark-brown/50 font-medium mb-6 flex items-center gap-1 select-none">
            <a href="/" className="hover:text-maroon">Home</a>
            <span>/</span>
            <span className="text-dark-brown/50">Collections</span>
            <span>/</span>
            <span className="text-dark-brown font-semibold">{campaign.name}</span>
          </nav>

          {/* Collection Count Header */}
          <div className="flex items-center justify-between border-b border-cream pb-4 mb-8">
            <h2 className="font-serif text-lg sm:text-2xl font-extrabold text-dark-brown">
              Sarees in this Collection
              <span className="text-xs font-semibold text-dark-brown/40 font-sans ml-2">
                ({products.length} {products.length === 1 ? 'Saree' : 'Sarees'})
              </span>
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-cream rounded-xl shadow-sm px-4">
              <svg className="w-12 h-12 text-dark-brown/25 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-dark-brown mb-2">
                Collection is empty
              </h3>
              <p className="text-sm text-dark-brown/60 max-w-sm mb-6 leading-relaxed">
                Check back soon! We are curating beautiful sarees for this collection.
              </p>
              <a
                href="/sarees"
                className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-105 active:scale-95 transition-all shadow"
              >
                BROWSE ALL SAREES
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 sm:gap-1.5 lg:gap-2">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </>
  );
}
