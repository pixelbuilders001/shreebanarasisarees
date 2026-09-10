import React from 'react';
import { Metadata } from 'next';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import OurStoreClient from '../our-store/OurStoreClient';

export const metadata: Metadata = {
  title: "Store Location & Showroom | Shree Banarasi Sarees - Samastipur, Bihar",
  description: "Visit the Shree Banarasi Sarees showroom at Rudauli Chowk, Harpur Aloth, Samastipur, Bihar (848103). Open daily 10:00 AM – 9:00 PM. Authentic handloom sarees, bridal consultations, and 20-minute local delivery.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/our-store",
  },
  openGraph: {
    title: "Store Location & Showroom | Shree Banarasi Sarees - Samastipur, Bihar",
    description: "Visit our traditional saree showroom at Rudauli Chowk, Samastipur, Bihar. Browse pure Banarasi silks in natural light or order with ~20-minute local delivery.",
    url: "https://shreebanarasisarees.in/store-location",
    type: "website",
  }
};

export default function StoreLocationPage() {
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
        "name": "Store Location",
        "item": `${siteUrl}/store-location`
      }
    ]
  };

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Shree Banarasi Sarees Showroom",
    "image": `${siteUrl}/brand_logo.png`,
    "url": `${siteUrl}/store-location`,
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
      "closes": "21:00"
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
