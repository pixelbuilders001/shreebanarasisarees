import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchProductBySlug } from '../../../data/supabase';
import ProductDetailClient from './ProductDetailClient';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: "Product Not Found | Shree Banarasi Sarees",
      description: "The saree you are looking for is not found or has been moved.",
    };
  }

  const finalPrice = product.salePrice ?? product.price;

  // Resolve dynamic host for absolute URLs
  let siteUrl = 'https://shreebanarasisarees.vercel.app';
  try {
    const headersList = await headers();
    const hostHeader = headersList.get('host');
    if (hostHeader) {
      const cleanHost = hostHeader.replace(/^https?:\/\//i, '');
      const protocol = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1') ? 'http' : 'https';
      siteUrl = `${protocol}://${cleanHost}`;
    }
  } catch (e) {
    console.error('Error getting headers:', e);
  }

  let ogImageUrl = product.images[0] || '';
  if (ogImageUrl.includes('unsplash.com')) {
    ogImageUrl = ogImageUrl.replace('auto=format', 'fm=jpg');
    if (!ogImageUrl.includes('fm=jpg')) {
      ogImageUrl += '&fm=jpg';
    }
  }

  return {
    title: `${product.name} | Shree Banarasi Sarees`,
    description: `Shop the ${product.name} from Shree Banarasi Sarees. Made of premium ${product.fabric} with ${product.work} work. Perfect for ${product.occasion} and festivals. Price: ₹${finalPrice.toLocaleString('en-IN')}.`,
    alternates: {
      canonical: `${siteUrl}/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Shree Banarasi Sarees`,
      description: product.description,
      url: `${siteUrl}/product/${product.slug}`,
      type: "website",
      siteName: "Shree Banarasi Sarees",
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 1067,
          alt: product.name,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Shree Banarasi Sarees`,
      description: product.description,
      images: [ogImageUrl],
    }
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await fetchProductBySlug(resolvedParams.slug);

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
          <h2 className="font-serif text-2xl font-bold text-dark-brown mb-2">Product Not Found</h2>
          <p className="text-sm text-dark-brown/60 mb-6">The saree collection you are looking for does not exist or has been moved.</p>
          <Link href="/sarees" className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase">
            BACK TO CATALOG
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const finalPrice = product.salePrice ?? product.price;

  // Resolve dynamic host for absolute URLs
  let siteUrl = 'https://shreebanarasisarees.vercel.app';
  try {
    const headersList = await headers();
    const hostHeader = headersList.get('host');
    if (hostHeader) {
      const cleanHost = hostHeader.replace(/^https?:\/\//i, '');
      const protocol = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1') ? 'http' : 'https';
      siteUrl = `${protocol}://${cleanHost}`;
    }
  } catch (e) {
    console.error('Error getting headers:', e);
  }

  // Build JSON-LD structured data for the product
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "sku": product.sku,
    "mpn": product.sku,
    "brand": {
      "@type": "Brand",
      "name": "Shree Banarasi Sarees"
    },
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": finalPrice,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 0,
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        }
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewsCount,
      "bestRating": 5,
      "worstRating": 1
    }
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
