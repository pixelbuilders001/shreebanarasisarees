import React from 'react';
import { Metadata } from 'next';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import OurStoreClient from './OurStoreClient';

export const metadata: Metadata = {
  title: "Our Showroom in Samastipur, Bihar | Shree Banarasi Sarees",
  description: "Visit Shree Banarasi Sarees showroom at Rudauli Chowk, Samastipur, Bihar. Authentic Banarasi silks, bridal styling, and bespoke saree weaves.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/our-store",
  }
};

export default function OurStorePage() {
  const siteUrl = 'https://shreebanarasisarees.in';

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
        "name": "Our Store",
        "item": `${siteUrl}/our-store`
      }
    ]
  };

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Shree Banarasi Sarees Showroom",
    "image": `${siteUrl}/brand_logo.png`,
    "url": `${siteUrl}/our-store`,
    "telephone": "+916203909946",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rudauli Chowk, Harpur Aloth",
      "addressLocality": "Samastipur",
      "addressRegion": "Bihar",
      "postalCode": "848103",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.827918,
      "longitude": 85.7546103
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "10:00",
      "closes": "20:30"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {/* Hide desktop header on mobile view, where OurStoreClient displays the clean mobile app header */}
      <Header hideOnMobile={true} />
      
      <main>
        <OurStoreClient />
      </main>

      <Footer />
    </>
  );
}
