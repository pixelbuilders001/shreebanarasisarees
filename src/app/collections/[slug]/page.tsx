import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { ProductCard } from '../../../components/ProductCard';
import { fetchResolvedCollectionBySlug } from '../../../data/homepage-sections';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const collection = await fetchResolvedCollectionBySlug(resolvedParams.slug);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  const title = collection.title || collection.name;
  const desc = collection.subtitle || collection.description || `Shop exclusive collection of traditional sarees from ${collection.name} at Shree Banarasi Sarees.`;

  return {
    title: `${title} | Shree Banarasi Sarees`,
    description: desc,
    alternates: {
      canonical: `https://shreebanarasisarees.in/collections/${collection.slug}`,
    },
    openGraph: {
      title: `${title} | Shree Banarasi Sarees`,
      description: desc,
      url: `https://shreebanarasisarees.in/collections/${collection.slug}`,
      type: "website",
      images: collection.desktop_banner_url ? [
        {
          url: collection.desktop_banner_url,
          alt: title,
        }
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Shree Banarasi Sarees`,
      description: desc,
      images: collection.desktop_banner_url ? [collection.desktop_banner_url] : [],
    }
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const collection = await fetchResolvedCollectionBySlug(resolvedParams.slug);

  if (!collection) {
    notFound();
  }

  const products = collection.products || [];

  // Schema for Breadcrumbs
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shreebanarasisarees.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Collections",
        "item": "https://shreebanarasisarees.in/sarees"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": collection.name,
        "item": `https://shreebanarasisarees.in/collections/${collection.slug}`
      }
    ]
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": collection.name,
    "description": collection.subtitle || collection.title,
    "numberOfItems": products.length,
    "itemListElement": products.map((p, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": p.name,
      "url": `https://shreebanarasisarees.in/product/${p.slug}`,
      "image": p.images[0] || undefined
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      
      <Header />
      
      <main className="pb-16 bg-[#FFF9F0] min-h-screen">
        {/* Collection Hero Banner - Hidden on Mobile, Full Width on Desktop */}
        {collection.desktop_banner_url ? (
          <div className="hidden sm:block w-full">
            <section className="relative w-full h-[180px] md:h-[220px] lg:h-[240px] overflow-hidden bg-dark-brown border-b border-gold/15 shadow-sm">
              {/* Background Image */}
              <picture className="absolute inset-0 w-full h-full">
                <img
                  src={collection.desktop_banner_url}
                  alt={collection.name}
                  className="w-full h-full object-cover object-center"
                />
              </picture>
              
              {/* Subtle premium dark gradients overlay for readable text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />
              
              {/* Text Overlay - Aligned within max-w-[1650px] to match product grid */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end max-w-[1650px] mx-auto p-6 md:p-8 w-full">
                <div className="space-y-1 max-w-2xl text-ivory">
                  <span className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase block font-serif">
                    —— Curated Collection ——
                  </span>
                  <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide drop-shadow-md leading-tight">
                    {collection.title || collection.name}
                  </h1>
                  {collection.subtitle && (
                    <p className="text-xs md:text-sm text-ivory/85 leading-snug font-light font-sans max-w-xl drop-shadow-sm line-clamp-2">
                      {collection.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Fallback Sleek Header if no Banner Image is present */
          <section className="hidden sm:block bg-gradient-to-b from-[#FFF0DB] to-[#FFF9F0] border-b border-cream py-8 sm:py-10 px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-4">
              <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
                Curated Collection
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-dark-brown">
                {collection.title || collection.name}
              </h1>
              <div className="w-16 h-0.5 bg-maroon mx-auto"></div>
              {collection.subtitle && (
                <p className="text-sm text-dark-brown/70 leading-relaxed max-w-lg mx-auto font-light">
                  {collection.subtitle}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Collection Products Grid */}
        <section className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-12">
          {/* Breadcrumb Navigation */}
          <nav className="text-xs text-dark-brown/50 font-medium mb-4 sm:mb-6 flex items-center gap-1 select-none">
            <a href="/" className="hover:text-maroon">Home</a>
            <span>/</span>
            <span className="text-dark-brown/50">Collections</span>
            <span>/</span>
            <span className="text-dark-brown font-semibold truncate max-w-[200px]">{collection.name}</span>
          </nav>

          {/* Collection Header */}
          <div className="border-b border-cream pb-3 sm:pb-4 mb-6 sm:mb-8">
            <div className="flex items-baseline justify-between">
              {/* On mobile, show collection title directly since hero banner is hidden */}
              <h1 className="sm:hidden font-serif text-xl font-extrabold text-dark-brown">
                {collection.title || collection.name}
                <span className="text-xs font-semibold text-dark-brown/40 font-sans ml-2">
                  ({products.length} {products.length === 1 ? 'Saree' : 'Sarees'})
                </span>
              </h1>

              {/* On desktop, banner already has the H1 collection title */}
              <h2 className="hidden sm:block font-serif text-2xl font-extrabold text-dark-brown">
                Sarees in this Collection
                <span className="text-xs font-semibold text-dark-brown/40 font-sans ml-2">
                  ({products.length} {products.length === 1 ? 'Saree' : 'Sarees'})
                </span>
              </h2>
            </div>
            {collection.subtitle && (
              <p className="sm:hidden text-xs text-dark-brown/70 mt-1 font-light">
                {collection.subtitle}
              </p>
            )}
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
