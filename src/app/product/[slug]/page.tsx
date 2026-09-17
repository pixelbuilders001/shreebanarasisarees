import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchProductBySlug, fetchRelatedProducts } from '../../../data/supabase';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shreebanarasisarees.in';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: "Product Not Found | Shree Banarasi Sarees",
      description: "The saree you are looking for is not found or has been moved.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const finalPrice = product.salePrice ?? product.price;

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
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product.category, product.id, 6);
  const finalPrice = product.salePrice ?? product.price;

  // Build JSON-LD structured data for the product
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "sku": product.sku,
    "mpn": product.sku,
    "category": product.category,
    "color": product.color,
    "material": product.fabric,
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
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
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
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    },
    ...(product.rating > 0 && product.reviewsCount > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewsCount,
        "bestRating": 5,
        "worstRating": 1
      }
    } : {})
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Sarees",
        "item": `${siteUrl}/sarees`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category || "Collection",
        "item": `${siteUrl}/sarees/${(product.category || 'all').toLowerCase()}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.name,
        "item": `${siteUrl}/product/${product.slug}`
      }
    ]
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient key={product.id} product={product} relatedProducts={relatedProducts} />
    </>
  );
}
